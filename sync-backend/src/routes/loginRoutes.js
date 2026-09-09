const router = require('express').Router();
const logger = require('../utilities/logger')
const ApiResponse = require('../utilities/apiResponse')
const { loginValidator } = require('../validators')
const { loginController } = require('../controllers')

router.post('/', loginValidator.getAuthValidator, async (req, res, next) => {
    try {
        const result = await loginController.validateAuth(req.headers);
        return ApiResponse.success(result).send(res)
    } catch (error) {
        logger.error('Error in Login Route: ', error);
        next(error);
    }
})

module.exports = router;