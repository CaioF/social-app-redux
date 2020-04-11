const express         = require('express');
const app             = express();
const server          = require('http').createServer(app);
const port            = process.env.PORT || 3000;
const hbs             = require('./utils/hbs');
const index           = require('./routers')
const path            = require('path')
const db              = require('./database/database.js')

// view engine
hbs.registerPartials(path.join(__dirname, 'website/partials'));
app.engine('hbs', hbs.__express);
app.set('view engine', "hbs");

// extra caching
app.set('view cache', true);

// express middlewares and pages
app.use(index)

// listen to the server after syncing to db
db.sync().then( () =>
    server.listen(port, () => console.log('Server listening at port %d', port))
);