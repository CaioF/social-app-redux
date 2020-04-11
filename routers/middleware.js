const express      = require('express');
const router       = express.Router();
const httpsdirect  = require('./../utils/https');
const compression  = require('./../utils/compression');
const helmet       = require("helmet")
const cors         = require("cors")
const RateLimit    = require("express-rate-limit")
const cookieParser = require("cookie-parser")
const session      = require("express-session")
const crypto       = require("crypto")

const genId = (function* () {
    let index = 0;
    while(true)
        yield index++;
})();

console.log(process.env.PORT)
const limiter = new RateLimit({
    windowMs: 50 * 1000,
    max: 100,
    delayMs: 0
})

router.use(cookieParser());
router.use(session({
    genid: req => genId.next().value,
    saveUninitialized: true,
    resave: true,
    secret: crypto.randomBytes(64).toString('base64').replace(/\//g,'_').replace(/\+/g,'-')
}));

router.use(limiter)
router.use(express.json());
router.use(httpsdirect([/localhost:(\d{4})/], [/\/insecure/], 301));
router.use(compression());
router.use(express.urlencoded());
router.use(helmet())
router.use(express.static('web/public'));
router.use(cors())

module.exports = router;