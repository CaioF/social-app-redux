const Sequelize     = require('sequelize');
const sequelize     = new Sequelize('', {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true
        }
    }
});

module.exports = sequelize
