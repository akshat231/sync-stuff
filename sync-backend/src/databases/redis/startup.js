const { createClient } = require('redis');
const logger = require('../../utilities/logger');
const redisConfig = require('config').get('database.redis')

// Read only host and port from environment
const {
  REDIS_HOST = 'localhost',
  REDIS_PORT = 6379,
} = redisConfig

let redisClient;

/**
 * Initialize Redis client
 */
async function initRedis() {
  if (redisClient) return redisClient; // avoid re-initialization

  logger.info('⏳ Initializing Redis client...');

  const redisUrl = `redis://${REDIS_HOST}:${REDIS_PORT}`;

  redisClient = createClient({
    url: redisUrl,
    // You can add more options here if needed in the future
  });

  redisClient.on('error', (err) => {
    logger.error('Redis Client Error:', err);
  });

  try {
    await redisClient.connect();
    await redisClient.ping(); // test the connection
    logger.info(`Connected to Redis at ${REDIS_HOST}:${REDIS_PORT}`);
  } catch (err) {
    logger.error('Redis connection failed:', err);
    process.exit(1);
  }

  return redisClient;
}

/**
 * Get Redis client instance
 */
function getRedisClient() {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call initRedis() first.');
  }
  return redisClient;
}

/**
 * Gracefully close Redis client
 */
async function closeRedis() {
  if (redisClient) {
    logger.info('Closing Redis connection...');
    await redisClient.quit();
    redisClient = null;
  }
}

module.exports = {
  initRedis,
  getRedisClient,
  closeRedis,
};
