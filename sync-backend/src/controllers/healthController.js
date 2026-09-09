const logger = require("../utilities/logger");
const { healthService } = require("../services");

const getHealth = async (port, host) => {
  try {
    const result = await healthService.getHealth(port, host);
    return result;
  } catch (error) {
    throw error;
  }
};

module.exports = {
    getHealth
}
