const config = require('config').get('server');
const express = require('express');
const compression = require('compression');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const cors = require('cors');

const router = express.Router();

router.use((req, res, next) => {
    if (req.url.indexOf('iframe.html') === -1) {
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    }
    res.setHeader('Cache-Control', 'no-cache', 'no-store');
    res.setHeader('pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-XSS-Protection', '1;');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET');
    res.setHeader('Keep-Alive', 'timeout=5, max=1000');
    next()
});

router.use(helmet());
router.use(compression());
router.use(bodyParser.json({limit: '5mb'}));
router.use(bodyParser.urlencoded({extended: true}));
router.use(cors({
    origin: config.get('corsWhiteList').length === 0
    ? '*'
    : config.get('corsWhiteList').map((x) => new RegExp(x))
}))

module.exports = {
    router
};