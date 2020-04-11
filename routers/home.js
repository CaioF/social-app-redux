const { Router }  = require('express')
const router      = Router()
const path        = require('path')

router.get("/", (request, response) => {
    response.render(path.join(__dirname, "../website/pages/main/index.hbs"))
})

module.exports = router