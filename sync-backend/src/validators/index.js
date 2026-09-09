const healthValidator = require('./healthValidator')
const loginValidator = require('./loginValidator')
const dataValidator = require('./dataValidator');
const syncValidator = require('./syncValidator')

module.exports ={
    healthValidator,
    loginValidator,
    dataValidator,
    syncValidator
}