const logger = require("../utilities/logger");
const { dataService } = require("../services");

const getData = async(headers) => {
    try {
        const jwtToken = headers['jwt_token'];
        const result = await dataService.getData(jwtToken);
        return result;
    } catch (error) {
        throw error;
    }
}

const playFile = async(headers, params, req, res) => {
    try {
        const jwtToken = headers['jwt_token'];
        const fileName = params.filename;
        const result = await dataService.playFile(jwtToken, fileName, req, res);
        return result;
    } catch (error) {
        throw error;
    }
}

module.exports = {
    getData,
    playFile
}