const { OAuth2Client } = require("google-auth-library");
require("dotenv").config();
const { getJwtOfEmail } = require('../utilities/jwt')

const logger = require('../utilities/logger');
const { valid } = require("joi");

const validateAuth = async (token) => {
    try {

        const client = new OAuth2Client(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );

        client.setCredentials({
            access_token: token,
        });

        const { data } = await client.request({
            url: process.env.GOOGLE_AUTH_URL,
        });
        logger.info('Data is fetched from google successfully');

        const email = data.email;
        const name = data.name;

        const jwtToken = getJwtOfEmail(email);
        return { data: jwtToken, message: "login successful" };
    } catch (error) {
        throw error;
    }
}

module.exports = {
    validateAuth
}