const { Router } = require('express')
const router     = Router()
// const bcrypt     = require("bcrypt")

router.post("/register", (request, response) => {
    let username = request.body.username;
    let password = request.body.password;
    let email    = request.body.email;

    if (username && password && email) {
        response.json({success: true});
    } else {
        response.status(403).json({success: false})
    }

})

router.post("/login", (request, response) => {
    let password = request.body.password;
    let email    = request.body.email;
    
    if (password && email) {
        response.json({success: true});
    } else {
        response.status(403).json({success: false})
    }
})

module.exports = router;