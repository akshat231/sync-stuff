const healthController = require('./healthController');
const loginController = require('./loginController')
const dataController = require('./dataController')
const syncController = require('./syncController')

module.exports = {
    healthController,
    loginController,
    dataController,
    syncController
}