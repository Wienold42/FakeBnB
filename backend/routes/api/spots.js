//Every new routes file must exist under API
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');
const express = require('express')
//Every route file must import its model.
const { Spot } = require('../../db/models');
const router = express.Router();
const {requireAuth} = require('../../utils/auth')

const validateSpots = [
    check('address')
      .exists({ checkFalsy: true })
      .withMessage('Please provide a valid address.'),
    check('city')
      .exists({ checkFalsy: true })
      .withMessage('Please provide a city.'),
    check('state')
    .exists({ checkFalsy: true })
    .withMessage('Please provide a state.'),
    check('country')
    .exists({ checkFalsy: true })
    .withMessage('Please provide a country.'),
    check('lat')
    .exists({ checkFalsy: true })
    .withMessage('Please provide a lat.'),
    check('lng')
    .exists({ checkFalsy: true })
    .withMessage('Please provide a lng.'),
    check('name')
    .exists({ checkFalsy: true })
    .withMessage('Please provide a name.'),
    check('description')
    .exists({ checkFalsy: true })
    .withMessage('Please provide a description.'),
    check('price')
    .exists({ checkFalsy: true })
    .withMessage('Please provide a price.'),
    handleValidationErrors
  ];


router.get('/', async (req,res)=> {
    let spots = await Spot.findAll()
    return res.json(spots)
})
router.get ('/:spotId', async (req,res)=> {
    let spots = await Spot.findByPk(req.params.spotId)
    if(!spots){
      return res.status(404).json({message:"No spots found with that ID."})
    }
    return res.json(spots)
})
 // put routes: require save changes spots.save()
router.put ('/:spotId', requireAuth, validateSpots, async (req,res)=> {
  let spots = await Spot.findByPk(req.params.spotId)
  if(!spots){
    return res.status(404).json({message:"No spots found with that ID."})
  }
  if (req.user.id === spots.ownerId) {
    const {
      address,
      city,
      state,
      country,
      lat,
      lng,
      name,
      description,
      price,
  }= req.body
  spots.address = address
  spots.city = city
  spots.state = state
  spots.country = country
  spots.lat = lat
  spots.lng = lng
  spots.name = name
  spots.description = description
  spots.price = price
  spots.save()
  return res.json(spots)

  } else {
    return res.status(401).json({message:"Unauthorized user Id."})
  }

}
)

router.delete('/:spotId', requireAuth, async (req,res)=> {
  let spots = await Spot.findByPk(req.params.spotId)
  if(!spots){
    return res.status(404).json({message:"No spots found with that ID."})
  }
  else if (req.user.id === spots.ownerId) {
    await spots.destroy()
    res.json({message:"Deleted successfully."})
  }
  else {
    return res.status(401).json({message:"Unauthorized user Id."})
  }
  
})
  
  

router.post('/', requireAuth, validateSpots, async (req,res)=> {
    const {
        address,
        city,
        state,
        country,
        lat,
        lng,
        name,
        description,
        price,
    }= req.body
    const newSpot = await Spot.create({ownerId:req.user.id, 
        address,
        city,
        state,
        country,
        lat,
        lng,
        name,
        description,
        price,})
        return res.json(newSpot)
})



module.exports = router; //every route file ends with this