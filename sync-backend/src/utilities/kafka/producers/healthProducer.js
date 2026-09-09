const logger = require('../../logger');
const { Kafka } = require('kafkajs');
const kafkaConfig = require('config').get('kafka');

const kafka = new Kafka({
  clientId: kafkaConfig.clientId,
  brokers: kafkaConfig.brokers
});

const producer = kafka.producer();

const sendMessage = async (topic, message) => {
  try {
    const result = await producer.send({
      topic,
      messages: [{ value: message }],
    });
    logger.info(`Message sent to Kafka topic "${topic}": ${message}`);
    return result;
  } catch (error) {
    logger.error(`Failed to send message to Kafka topic "${topic}":`, error);
    throw error; // Optional: rethrow if the calling code needs to handle it
  }
};

const initProducer = async () => {
  try {
    await producer.connect();
    logger.info('Kafka producer (documentAnalyzer) connected');
  } catch (error) {
    logger.error('Failed to connect Kafka producer:', error);
    throw error;
  }
};

module.exports = { producer, sendMessage, initProducer };
