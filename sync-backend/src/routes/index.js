const router = require('express').Router();
const healthRoutes = require('./healthRoutes');
const loginRoutes = require('./loginRoutes');
const dataRoutes = require('./dataRoutes');
const syncRoutes = require('./syncRoutes');


router.use('/health', healthRoutes);
router.use('/login', loginRoutes);
router.use('/data', dataRoutes);
router.use('/sync', syncRoutes);

module.exports = router;