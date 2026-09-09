const logger = require("./logger");
const { initializeMongo } = require("../databases/mongo/startup");
const { initPostgres } = require("../databases/postgres/startup");
const { initRedis } = require("../databases/redis/startup");
const { initializeKafka } = require("../utilities/kafka/startup");
const app = require("express")();

const initializeServices = async (options) => {
  const response = {};
  logger.info("Initializing services");
  if (options && options.mongo) {
    logger.info("Initializing MongoDB service");
    await initializeMongo();
  }

  if (options && options.postgres) {
    logger.info("Initializing Postgres service");
    await initPostgres();
  }

  if (options && options.redis) {
    logger.info("Initializing Redis service");
    await initRedis();
  }

  if (options && options.kafka) {
    logger.info("Initializing Kafka service");
    await initializeKafka();
  }

  response.app = app;
  logger.info("BoilerPlate Initialized");
  return response;
};

module.exports = {
  initializeServices,
};
