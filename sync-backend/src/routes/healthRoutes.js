const router = require('express').Router();
const logger = require('../utilities/logger')
const ApiResponse = require('../utilities/apiResponse')
const { healthValidator } = require('../validators')
const { healthController } = require('../controllers')

router.get('/', healthValidator.getHealthValidator, async (req, res, next) => {
    try {
        const port = parseInt(req.query.port);
        const host = req.query.host;
        const getHealth = await healthController.getHealth(port, host);
        return ApiResponse.success(getHealth).send(res)
    } catch (error) {
        logger.error('Error in Health Route: ', error);
        next(error);
    }
});

module.exports = router;