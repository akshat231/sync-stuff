const logger = require("../utilities/logger");
const { loginService } = require("../services");

const validateAuth = async(headers) => {
    try {
        const authToken = headers['auth_token'];
        const result = await loginService.validateAuth(authToken);
        return result;
    } catch (error) {
        throw error;
    }
}

module.exports = {
    validateAuth
}