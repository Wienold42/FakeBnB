'use strict';

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;  // define your schema in options object
}

//Every seeder must import its own model.
const {Spot} = require ('../models')
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  //We replace the bulkInsert with bulkCreate using the model.
  async up (queryInterface, Sequelize) {
    await Spot.bulkCreate([
          {
            ownerId: 1,
            address: '1400 Pennsylvania Ave',
            city: 'D.C.',
            state: 'Mars',
            country: 'USA',
            lat: 38.9072,
            lng: 77.0369,
            name: 'GiantMeteor2028',
            description: 'Ahhh',
            price: 3.50
          },
          
        ], { validate: true });
  },

  async down (queryInterface, Sequelize) {
    options.tableName = 'Spots'; //change this line
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      name: { [Op.in]: ['GiantMeteor2028'] } //and this one
    }, {});
  }
};
