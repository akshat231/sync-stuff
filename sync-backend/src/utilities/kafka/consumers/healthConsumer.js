const logger = require('../../logger');
const { Kafka } = require('kafkajs');
const kafkaConfig = require('config').get('kafka');

const kafka = new Kafka({
  clientId: kafkaConfig.clientId,
  brokers: kafkaConfig.brokers,
});

const consumer = kafka.consumer({
  groupId: kafkaConfig.groupIds.health || 'health-group',
});

const topic = kafkaConfig.topics.health || 'health-topic'; // e.g., "health-check"

const initConsumer = async () => {
  try {
    await consumer.connect();
    logger.info('Kafka consumer (healthConsumer) connected');

    await consumer.subscribe({ topic, fromBeginning: false });
    logger.info(`Subscribed to Kafka topic "${topic}"`);
  } catch (error) {
    logger.error('Failed to initialize Kafka healthConsumer:', error);
    throw error;
  }
};

const handleMessages = async () => {
  try {
    await consumer.run({
      eachMessage: async ({ topic, message }) => {
        const value = message.value.toString();
        logger.info(`Message received on topic "${topic}": ${value}`);

        try {
          // Process the message (custom logic here)
          await handleMessage(value, message);
        } catch (err) {
          logger.error(`Error processing message from topic "${topic}":`, err);
        }
      },
    });
  } catch (err) {
    logger.error('Error running Kafka healthConsumer:', err);
    throw err;
  }
};

// Define the message handler logic here or import from another module
const handleMessage = async (value, rawMessage) => {
  try {
    logger.info(`Handling health message: ${value}`);
    // Optional: const data = JSON.parse(value);
    // Do something with data
  } catch (err) {
    logger.error('Error in health message handler:', err);
    throw err;
  }
};

module.exports = {
  consumer,
  initConsumer,
  handleMessages,
};
