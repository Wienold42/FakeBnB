//Every new routes file must exist under API

const express = require('express')
//Every route file must import its model.
const { Spot } = require('../../db/models');
const router = express.Router();

router.get('/', async (req,res)=> {
    let spots = await Spot.findAll()
    return res.json(spots)

})

module.exports = router; //every route file ends with this