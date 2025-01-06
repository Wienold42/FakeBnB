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
          {
            ownerId: 2,
            address: '1234 Main St',
            city: 'Anytown',
            state: 'FL',
            country: 'USA',
            lat: 50,
            lng: 89,
            name: 'BoyNextDoor',
            description: 'Normal',
            price: 7
          },
          {
            ownerId: 3,
            address: '666 Devils Way',
            city: 'New York',
            state: 'NY',
            country: 'USA',
            lat: 127,
            lng: 54,
            name: 'BigApple',
            description: 'Tired',
            price: 999
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
