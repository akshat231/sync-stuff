const logger = require('./utilities/logger');
const bodyParser = require('body-parser');
const config = require('config').get('server');
const { initializeServices } = require('./utilities/startup');
const middleware = require('./middlewares');
const exceptionHandler = require('./middlewares/exception-handler');
const apiRouter = require('./routes');

const createApp = async () => {
  logger.info('Starting App');
  const { app } = await initializeServices({
    mongo: false,
    postgres: false,
    redis: false,
    kafka: false
  })
  app.use(middleware.router);
  app.use('/api', apiRouter);
  app.use(exceptionHandler);
  const server = app.listen(config.get('port'), ()=> {
    logger.info(`Server running on port ${config.get('port')}`);
  })
}

createApp().catch((err) => {logger.error(`Error while starting app: ${err}`)
  process.exit(1);
});