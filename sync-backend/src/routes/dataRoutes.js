const router = require('express').Router();
const logger = require('../utilities/logger')
const ApiResponse = require('../utilities/apiResponse')
const { dataValidator } = require('../validators');
const { dataController } = require('../controllers')


router.get('/', dataValidator.validateToken, async (req, res, next) => {
    try {
        const result = await dataController.getData(req.headers);
        return ApiResponse.success(result).send(res)
    } catch (error) {
        logger.error('Error in Data Route: ', error);
        next(error);
    }
});

router.get('/play/:filename', dataValidator.validateToken, async (req, res, next) => {
    try {
        await dataController.playFile(req.headers, req.params, req, res);
    } catch (error) {
        logger.error('Error in Data Route: ', error);
        next(error);
    }
})

module.exports = router;

