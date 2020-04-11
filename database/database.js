const Sequelize     = require('sequelize');
const sequelize     = new Sequelize('postgres://gjemaffzmyxkiy:cdcb5cb7571f8cdb8222ff6ed1e93505176e42d7df11bb4c2e3e95c6a09c258b@ec2-54-147-209-121.compute-1.amazonaws.com:5432/ddo0ojgvduccbb', {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true
        }
    }
});

module.exports = sequelize