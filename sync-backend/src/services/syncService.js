const fs = require('fs/promises')
const axios = require('axios');
const path = require('path');
const config = require('config');
const logger = require('../utilities/logger')
const { decodeJwtOfEmail } = require('../utilities/jwt');
const { decode } = require('jsonwebtoken');

const connect = async (token, deviceId) => {
    try {
        const decoded = decodeJwtOfEmail(token);
        const email = decoded?.email;

        if (!email) {
            logger.error('Email is not valid or missing from token');
            throw new Error('Email is not valid');
        }

        const userFolder = path.join(
            config.get('synced_folder_root_path'),
            email
        );

        logger.info(`Creating synced files for user: ${email}`);

        await fs.mkdir(userFolder, {
            recursive: true
        });

        logger.info(`Synced folder created: ${userFolder}`);

        const syncthingUrl = process.env.SYNCTHING_URL;
        const syncthingApiKey = process.env.SYNCTHING_API_KEY;

        const folderId = `user-${email}`;
        await axios.post(
            `${syncthingUrl}/rest/config/folders`,
            {
                id: folderId,
                label: email,
                path: userFolder,
                type: 'sendreceive',
                devices: [
                    {
                        deviceID: deviceId
                    }
                ]
            },
            {
                headers: {
                    'X-API-Key': syncthingApiKey,
                    'Content-Type': 'application/json'
                }
            }
        );
        logger.info(
            `Syncthing folder configured for ${email} with device ${deviceId}`
        );

        return {
            data: {
                email,
                deviceId,
                folderId,
                path: userFolder
            },
            message: 'Device connected and synced folder configured successfully'
        };


    } catch (error) {
        logger.error(`Failed to fetch synced files: ${error.message}`);
        throw error;
    }
};


module.exports = {
    connect
}