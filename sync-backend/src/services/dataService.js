const path = require('path');
const fs = require('fs/promises');
const mime = require('mime-types');
const config = require('config');
const logger = require('../utilities/logger')
const { decodeJwtOfEmail } = require('../utilities/jwt');
const { decode } = require('jsonwebtoken');

const getData = async (token) => {
    try {
        const decoded =  decodeJwtOfEmail(token);
        const email = decoded?.email;

        if (!email) {
            logger.error('Email is not valid or missing from token');
            throw new Error('Email is not valid');
        }

        const userFolder = path.join(
            config.get('synced_folder_root_path'),
            email
        );

        logger.info(`Fetching synced files for user: ${email}`);

        const files = await fs.readdir(userFolder, {
            withFileTypes: true
        });

        const data = files.map(file => ({
            name: file.name,
            type: file.isDirectory() ? 'directory' : 'file'
        }));

        logger.info(`Successfully fetched ${data.length} items for user: ${email}`);

        return {
            data,
            message: 'All files fetched successfully'
        };

    } catch (error) {
        logger.error(`Failed to fetch synced files: ${error.message}`);
        throw error;
    }
};

const playFile = async (token, fileName, req, res) => {
    try {
        logger.info(`Starting media playback request for file: ${fileName}`);

        const decoded = decodeJwtOfEmail(token);
        const email = decoded?.email;

        if (!email) {
            logger.error('Email is not valid or missing from token');
            throw new Error('Email is not valid');
        }

        logger.info(`Authenticated media request for user: ${email}`);

        const userFolder = path.join(
            config.get('synced_folder_root_path'),
            email
        );

        const filePath = path.join(userFolder, fileName);

        logger.info(`Resolved media file path: ${filePath}`);

        // Prevent path traversal
        if (!filePath.startsWith(userFolder + path.sep)) {
            logger.warn(
                `Access denied: invalid file path requested by user ${email}: ${fileName}`
            );

            return res.status(403).json({
                data: null,
                message: 'Access denied'
            });
        }

        if (!fs.existsSync(filePath)) {
            logger.warn(
                `Media file not found for user ${email}: ${fileName}`
            );

            return res.status(404).json({
                data: null,
                message: 'Media file not found'
            });
        }

        const stat = fs.statSync(filePath);
        const fileSize = stat.size;

        const contentType =
            mime.lookup(filePath) || 'application/octet-stream';

        logger.info(
            `Media file found: ${fileName}, size: ${fileSize} bytes, type: ${contentType}`
        );

        const range = req.headers.range;

        // Normal request without Range
        if (!range) {
            logger.info(
                `Streaming full file: ${fileName} for user ${email}`
            );

            res.writeHead(200, {
                'Content-Length': fileSize,
                'Content-Type': contentType,
                'Accept-Ranges': 'bytes'
            });

            return fs.createReadStream(filePath).pipe(res);
        }

        logger.info(
            `Range request received for ${fileName}: ${range}`
        );

        const parts = range.replace(/bytes=/, '').split('-');

        const start = parseInt(parts[0], 10);
        const end = parts[1]
            ? parseInt(parts[1], 10)
            : fileSize - 1;

        if (
            Number.isNaN(start) ||
            Number.isNaN(end) ||
            start >= fileSize ||
            end >= fileSize ||
            start > end
        ) {
            logger.warn(
                `Invalid range requested for ${fileName}: ${range}`
            );

            return res.status(416).set({
                'Content-Range': `bytes */${fileSize}`
            }).end();
        }

        const chunkSize = end - start + 1;

        logger.info(
            `Streaming range for ${fileName}: ${start}-${end} (${chunkSize} bytes)`
        );

        res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize,
            'Content-Type': contentType
        });

        fs.createReadStream(filePath, {
            start,
            end
        }).pipe(res);

    } catch (error) {
        logger.error(
            `Failed to play file ${fileName}: ${error.message}`
        );

        throw error;
    }
};


module.exports = {
    getData,
    playFile
}