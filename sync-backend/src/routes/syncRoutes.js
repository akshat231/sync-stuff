const router = require('express').Router();
const logger = require('../utilities/logger')
const ApiResponse = require('../utilities/apiResponse')
const { syncValidator } = require('../validators');
const { syncController } = require('../controllers')


router.post('/connect', 
    syncValidator.validateToken, 
    syncValidator.validateConnectBody,
     async (req, res, next) => {
    try {
        const result = await syncController.connect(req.headers, req.body);
        return ApiResponse.success(result).send(res)
    } catch (error) {
        logger.error('Error in Sync Route: ', error);
        next(error);
    }
});

module.exports = router;

