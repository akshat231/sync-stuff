const logger = require("../utilities/logger");
const { syncService } = require("../services");

const connect = async(headers, body) => {
    try {
        const jwtToken = headers['jwt_token'];
        const deviceId = body['device_id'];
        const result = await syncService.connect(jwtToken, deviceId);
        return result;
    } catch (error) {
        throw error;
    }
}

module.exports = {
    connect
}