const { Router } = require('express')
const router     = Router()
const middleware = require("./middleware")

const files      = require("./files")
const home       = require("./home")

const api       = require("./api")

// express middlewares
router.use(middleware)

// API
router.use("/api", api)

// Serve files dynamically
router.use("/lib", files)

// Serve pages
router.use("/", home)

module.exports = router