const { Router } = require('express')
const router     = Router()
const middleware = require("./middleware")

const files      = require("./files")
const home       = require("./home")

// express middlewares
router.use(middleware)

// Serve files dynamically
router.use("/lib", files)

// Serve pages
router.use("/", home)

module.exports = router