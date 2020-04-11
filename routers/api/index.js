const { Router } = require('express')
const router     = Router()
const account    = require("./account")

router.use("/account", account)

module.exports = router;