const logger = require('../../utilities/logger');
const producers = require('./producers');
const consumers = require('./consumers');

const initializeKafka = async () => {
  try {
    // Initialize producers
    await Promise.all(
      Object.values(producers).map(async (prod) => {
        if (typeof prod.initProducer === 'function') {
          await prod.initProducer();
        }
      })
    );
    logger.info('Kafka producers initialized');

    // Initialize consumers
    await Promise.all(
      Object.values(consumers).map(async (cons) => {
        if (typeof cons.initConsumer === 'function') {
          await cons.initConsumer();
        }
      })
    );
    logger.info('Kafka consumers initialized');

    logger.info('All Kafka producers and consumers initialized successfully');
  } catch (error) {
    logger.error('Kafka initialization failed:', error);
    throw error; // Optional: rethrow to stop app startup
  }
};

module.exports = {
  ...producers,
  ...consumers,
  initializeKafka,
};
