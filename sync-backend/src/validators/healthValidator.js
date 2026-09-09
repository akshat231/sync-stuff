const joi = require('joi');
const logger = require('../utilities/logger');
const ApiResponse = require('../utilities/apiResponse');

const getHealthSchema = joi.object({
    port: joi.string().required(),
    host: joi.string().required()
})

const getHealthValidator = (req, res, next) => {
    try {
        const { error } = getHealthSchema.validate(req.query);
        if (error) {
            logger.error(`Validation error: ${error.message}`);
           return ApiResponse.error('Validation error', 422, error.message).send(res);
        }
        next();
    } catch (error) {
        logger.error('Error in Health Validator: ', error);
        next(error);
    }
};

module.exports = {
    getHealthValidator
}

