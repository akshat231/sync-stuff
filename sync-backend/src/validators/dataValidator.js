const joi = require('joi');
const logger = require('../utilities/logger');
const ApiResponse = require('../utilities/apiResponse');

const authHeaderSchema = joi.object({
    jwt_token: joi.string().required()
}).unknown(true);

const validateToken = async (req, res, next) => {
    try {
        const { error } = authHeaderSchema.validate(req.headers);
        if (error) {
            logger.error(`Validation error: ${error.message}`);
            return ApiResponse.error('Validation error', 422, error.message).send(res);
        }
        next();
    } catch (error) {
        logger.error('Error in Health Validator: ', error);
        next(error);
    }
}

module.exports = {
    validateToken
}