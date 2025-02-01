//Every new routes file must exist under API
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');
const express = require('express')
//Every route file must import its model.
const { Spot, Review, User, ReviewImage, Booking } = require('../../db/models');
const {SpotImage} = require('../../db/models');
const router = express.Router();
const {requireAuth} = require('../../utils/auth');
const { where } = require('sequelize');
const { validationResult } = require('express-validator');
const {Op} = require('sequelize')

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

  // "Create a Spot" / API box
  router.post('/', requireAuth, validateSpots, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Transform errors into the required format
        const errorMessages = {};
        errors.array().forEach(error => {
            errorMessages[error.param] = error.msg;
        });

        return res.status(400).json({
            message: "Bad Request",
            errors: errorMessages,
        });
    }
    try {
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
        } = req.body;

        const newSpot = await Spot.create({
            ownerId: req.user.id,
            address,
            city,
            state,
            country,
            lat,
            lng,
            name,
            description,
            price,
        });

        // Respond with a 201 status code and the spot details
        return res.status(201).json({
            id: newSpot.id,
            ownerId: newSpot.ownerId,
            address: newSpot.address,
            city: newSpot.city,
            state: newSpot.state,
            country: newSpot.country,
            lat: newSpot.lat,
            lng: newSpot.lng,
            name: newSpot.name,
            description: newSpot.description,
            price: newSpot.price,
            createdAt: newSpot.createdAt,
            updatedAt: newSpot.updatedAt,
        });
    } catch (error) {
        console.error('Error creating a new spot:', error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
});

// Create a new Spot Image
router.post('/:spotId/images', requireAuth, async (req, res) => {
    const { spotId } = req.params;
    const { url, preview } = req.body;

    try {
        // Find the spot by ID
        const spot = await Spot.findByPk(spotId);

        if (!spot) {
            return res.status(404).json({
                message: "Spot couldn't be found",
            });
        }

        // Add the new image
        const newImage = await SpotImage.create({
            spotId: spot.id,
            url,
            preview,
        });

        return res.status(201).json({
            id: newImage.id,
            url: newImage.url,
            preview: newImage.preview,
        });
    } catch (error) {
        console.error('Error adding image to spot:', error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
});

router.put('/:spotId', requireAuth, validateSpots, async (req, res) => {
    const { spotId } = req.params;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const errorMessages = {};
        errors.array().forEach(error => {
            errorMessages[error.param] = error.msg;
        });

        return res.status(400).json({
            message: "Bad Request",
            errors: errorMessages,
        });
    }

    try {
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
        } = req.body;

        const spot = await Spot.findByPk(spotId);

        if (!spot) {
            return res.status(404).json({
                message: "Spot couldn't be found",
            });
        }

        // Ensure the user is authorized
        if (spot.ownerId !== req.user.id) {
            return res.status(403).json({
                message: "Forbidden",
            });
        }

        // Update the spot
        await spot.update({
            address,
            city,
            state,
            country,
            lat,
            lng,
            name,
            description,
            price,
        });

        return res.status(200).json({
            id: spot.id,
            ownerId: spot.ownerId,
            address: spot.address,
            city: spot.city,
            state: spot.state,
            country: spot.country,
            lat: spot.lat,
            lng: spot.lng,
            name: spot.name,
            description: spot.description,
            price: spot.price,
            createdAt: spot.createdAt,
            updatedAt: spot.updatedAt,
        });
    } catch (error) {
        console.error('Error updating spot:', error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
});

// GET /api/spots - Get all spots with filters
router.get('/', async (req, res) => {
    let { page, size, minLat, maxLat, minLng, maxLng, minPrice, maxPrice } = req.query;

    // Default pagination values
    page = parseInt(page) || 1;
    size = parseInt(size) || 20;

    // Validation errors
    const errors = {};
    if (page < 1) errors.page = "Page must be greater than or equal to 1";
    if (size < 1) errors.size = "Size must be greater than or equal to 1";
    if (minLat && isNaN(minLat)) errors.minLat = "Minimum latitude is invalid";
    if (maxLat && isNaN(maxLat)) errors.maxLat = "Maximum latitude is invalid";
    if (minLng && isNaN(minLng)) errors.minLng = "Minimum longitude is invalid";
    if (maxLng && isNaN(maxLng)) errors.maxLng = "Maximum longitude is invalid";
    if (minPrice && (isNaN(minPrice) || minPrice < 0)) errors.minPrice = "Minimum price must be greater than or equal to 0";
    if (maxPrice && (isNaN(maxPrice) || maxPrice < 0)) errors.maxPrice = "Maximum price must be greater than or equal to 0";

    if (Object.keys(errors).length > 0) {
        return res.status(400).json({
            message: "Bad Request",
            errors
        });
    }

    // Query construction
    const where = {};
    if (minLat) where.lat = { [Op.gte]: parseFloat(minLat) };
    if (maxLat) where.lat = { [Op.lte]: parseFloat(maxLat) };
    if (minLng) where.lng = { [Op.gte]: parseFloat(minLng) };
    if (maxLng) where.lng = { [Op.lte]: parseFloat(maxLng) };
    if (minPrice) where.price = { [Op.gte]: parseFloat(minPrice) };
    if (maxPrice) where.price = { [Op.lte]: parseFloat(maxPrice) };

    // Fetch spots with avgRating and previewImage
    const spots = await Spot.findAll({
        where,
        limit: size,
        offset: (page - 1) * size,
        attributes: [
            'id', 'ownerId', 'address', 'city', 'state', 'country',
            'lat', 'lng', 'name', 'description', 'price', 'createdAt', 'updatedAt'
        ],
        include: [
            {
                model: SpotImage,
                attributes: ['url'],
                limit: 1
            }
        ]
    });

    const formattedSpots = spots.map(spot => {
        return {
            ...spot.get(),
            previewImage: spot.SpotImages.length ? spot.SpotImages[0].url : null
        };
    });

    return res.status(200).json({
        Spots: formattedSpots,
        page,
        size
    });
});

router.get('/', async (req,res)=> {
    let spots = await Spot.findAll()
    return res.json(spots)
})

router.get ('/current', requireAuth, async (req,res)=> {{
  let spotOwnerId = req.user.id
  let spots = await Spot.findAll({where:{
    ownerId: spotOwnerId
  }})
  return res.json(spots)
  } 
});

// GET /api/spots/:spotId/bookings - Get all bookings for a spot
router.get('/:spotId/bookings', requireAuth, async (req, res) => {
    const { spotId } = req.params;
    const userId = req.user.id;

    // Find the spot
    const spot = await Spot.findByPk(spotId);
    if (!spot) {
        return res.status(404).json({ message: "Spot couldn't be found" });
    }

    // Fetch bookings for the spot
    let bookings;
    if (spot.ownerId === userId) {
        // If owner, include user details
        bookings = await Booking.findAll({
            where: { spotId },
            include: {
                model: User,
                attributes: ['id', 'firstName', 'lastName']
            }
        });
    } else {
        // If not owner, return limited details
        bookings = await Booking.findAll({
            where: { spotId },
            attributes: ['spotId', 'startDate', 'endDate']
        });
    }

    return res.status(200).json({ Bookings: bookings });
});

// POST /api/spots/:spotId/bookings - Create a Booking
router.post('/:spotId/bookings', requireAuth, async (req, res) => {
    const { spotId } = req.params;
    const { startDate, endDate } = req.body;
    const userId = req.user.id;

    // Find the spot
    const spot = await Spot.findByPk(spotId);
    if (!spot) {
        return res.status(404).json({ message: "Spot couldn't be found" });
    }

    // Prevent booking by the owner
    if (spot.ownerId === userId) {
        return res.status(403).json({ message: "Owners cannot book their own spot" });
    }

    // Validate dates
    if (new Date(endDate) <= new Date(startDate)) {
        return res.status(400).json({
            message: "Bad Request",
            errors: { endDate: "endDate cannot be on or before startDate" }
        });
    }

    // Check for booking conflicts
    const existingBookings = await Booking.findAll({
        where: {
            spotId,
            [Op.or]: [
                { startDate: { [Op.between]: [startDate, endDate] } },
                { endDate: { [Op.between]: [startDate, endDate] } },
                { startDate: { [Op.lte]: startDate }, endDate: { [Op.gte]: endDate } }
            ]
        }
    });

    if (existingBookings.length > 0) {
        return res.status(403).json({
            message: "Sorry, this spot is already booked for the specified dates",
            errors: {
                startDate: "Start date conflicts with an existing booking",
                endDate: "End date conflicts with an existing booking"
            }
        });
    }

    // Create new booking
    const newBooking = await Booking.create({
        spotId,
        userId,
        startDate,
        endDate
    });

    return res.status(201).json(newBooking);
});

router.get ('/:spotId', async (req,res)=> {
    let spots = await Spot.findOne({
        where:{id:req.params.spotId}, 
        include:[{model:SpotImage}, {model:User, as:'Owner'}]
    })
    console.log(spots)
    // const preview= spots.dataValues.SpotImages.find(pic=>pic.preview===true)
    // spots.dataValues.previewImage=preview.url;
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
// Create a Review for a Spot based on the Spot's id
router.post('/spots/:spotId/reviews', requireAuth, async (req, res) => {
    const { spotId } = req.params;
    const { review, stars } = req.body;

    try {
        const spot = await Spot.findByPk(spotId);

        if (!spot) {
            return res.status(404).json({
                message: "Spot couldn't be found",
            });
        }

        // Check if the user has already left a review for this spot
        const existingReview = await Review.findOne({
            where: { spotId, userId: req.user.id }
        });

        if (existingReview) {
            return res.status(500).json({
                message: "User already has a review for this spot",
            });
        }

        // Validate review data
        if (!review || typeof review !== 'string') {
            return res.status(400).json({
                message: "Bad Request",
                errors: {
                    review: "Review text is required",
                },
            });
        }

        if (!stars || !Number.isInteger(stars) || stars < 1 || stars > 5) {
            return res.status(400).json({
                message: "Bad Request",
                errors: {
                    stars: "Stars must be an integer from 1 to 5",
                },
            });
        }

        const newReview = await Review.create({
            userId: req.user.id,
            spotId,
            review,
            stars,
        });

        return res.status(201).json({
            id: newReview.id,
            userId: newReview.userId,
            spotId: newReview.spotId,
            review: newReview.review,
            stars: newReview.stars,
            createdAt: newReview.createdAt,
            updatedAt: newReview.updatedAt,
        });
    } catch (error) {
        console.error('Error creating review:', error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
});

// DELETE /api/spot-images/:imageId - Delete a Spot Image
router.delete('/spot-images/:imageId', requireAuth, async (req, res) => {
    const { imageId } = req.params;
    const userId = req.user.id;

    // Find the spot image
    const spotImage = await SpotImage.findByPk(imageId, {
        include: { model: Spot, attributes: ['ownerId'] }
    });

    if (!spotImage) {
        return res.status(404).json({
            message: "Spot Image couldn't be found"
        });
    }

    // Check if the logged-in user owns the spot
    if (spotImage.Spot.ownerId !== userId) {
        return res.status(403).json({
            message: "Unauthorized to delete this spot image"
        });
    }

    // Delete the spot image
    await spotImage.destroy();

    return res.status(200).json({
        message: "Successfully deleted"
    });
});



router.delete('/:spotId', requireAuth, async (req,res)=> {
  let spots = await Spot.findByPk(req.params.spotId)
  if(!spots){
    return res.status(404).json({message:"Spot couldn't be found."})
  }
  else if (req.user.id === spots.ownerId) {
    await spots.destroy()
    res.json({message:"Deleted successfully."})
  }
  else {
    return res.status(401).json({message:"Unauthorized user Id."})
  }
  
})
  
// Get all Reviews of the Current User
router.get('/reviews/current', requireAuth, async (req, res) => {
    try {
        const reviews = await Review.findAll({
            where: { userId: req.user.id },
            include: [
                {
                    model: User,
                    attributes: ['id', 'firstName', 'lastName']
                },
                {
                    model: Spot,
                    attributes: ['id', 'ownerId', 'address', 'city', 'state', 'country', 'lat', 'lng', 'name', 'price'],
                    include: {
                        model: SpotImage,
                        attributes: ['url'],
                        where: { preview: true },
                        required: false
                    }
                },
                {
                    model: ReviewImage,
                    attributes: ['id', 'url']
                }
            ]
        });

        return res.status(200).json({
            Reviews: reviews
        });
    } catch (error) {
        console.error('Error fetching current user reviews:', error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
});

// Add an image to a spot based on the spot's ID
router.post('/:spotId/images', requireAuth, async (req, res) => {
  const { spotId } = req.params;
  const { url, preview } = req.body;

  try {
      // Find the spot by ID
      const spot = await Spot.findByPk(spotId);

      // If the spot does not exist, return a 404 error
      if (!spot) {
          return res.status(404).json({
              message: "Spot couldn't be found",
          });
      }

      // Check if the logged-in user owns the spot
      if (spot.ownerId !== req.user.id) {
          return res.status(403).json({
              message: "Forbidden",
          });
      }

      // Create a new SpotImage
      const newImage = await SpotImage.create({
          spotId,
          url,
          preview,
      });

      // Respond with the new image data
      return res.status(200).json({
          id: newImage.id,
          url: newImage.url,
          preview: newImage.preview,
      });
  } catch (error) {
      console.error('Error adding image to spot:', error);
      return res.status(500).json({
          message: "Internal server error",
      });
  }
});

// Add query filters to Get All Spots
router.get('/', async (req, res) => {
  const { page = 1, size = 20, minLat, maxLat, minLng, maxLng, minPrice, maxPrice } = req.query;

  // Validate query parameters
  const errors = {};
  if (page < 1 || isNaN(page)) errors.page = "Page must be 1 or greater";
  if (size < 1 || isNaN(size)) errors.size = "Size must be 1 or greater";
  if (minLat && isNaN(minLat)) errors.minLat = "Minimum latitude is invalid";
  if (maxLat && isNaN(maxLat)) errors.maxLat = "Maximum latitude is invalid";
  if (minLng && isNaN(minLng)) errors.minLng = "Minimum longitude is invalid";
  if (maxLng && isNaN(maxLng)) errors.maxLng = "Maximum longitude is invalid";
  if (minPrice && (isNaN(minPrice) || minPrice < 0)) errors.minPrice = "Minimum price must be a number greater than or equal to 0";
  if (maxPrice && (isNaN(maxPrice) || maxPrice < 0)) errors.maxPrice = "Maximum price must be a number greater than or equal to 0";

  if (Object.keys(errors).length) {
      return res.status(400).json({
          message: "Validation Error",
          errors,
      });
  }

  // Construct query filters
  const filters = {};
  if (minLat) filters.lat = { ...filters.lat, [Op.gte]: parseFloat(minLat) };
  if (maxLat) filters.lat = { ...filters.lat, [Op.lte]: parseFloat(maxLat) };
  if (minLng) filters.lng = { ...filters.lng, [Op.gte]: parseFloat(minLng) };
  if (maxLng) filters.lng = { ...filters.lng, [Op.lte]: parseFloat(maxLng) };
  if (minPrice) filters.price = { ...filters.price, [Op.gte]: parseFloat(minPrice) };
  if (maxPrice) filters.price = { ...filters.price, [Op.lte]: parseFloat(maxPrice) };

  const limit = parseInt(size);
  const offset = (parseInt(page) - 1) * limit;

  try {
      // Query spots from the database with filters and pagination
      const spots = await Spot.findAll({
          where: filters,
          limit,
          offset,
          include: [
              {
                  model: SpotImage,
                  as: 'previewImage',
                  attributes: ['url'],
                  where: { preview: true },
                  required: false,
              },
          ],
          attributes: [
              'id', 'ownerId', 'address', 'city', 'state', 'country',
              'lat', 'lng', 'name', 'description', 'price', 'createdAt', 'updatedAt'
          ],
      });

      // Format response
      const formattedSpots = spots.map(spot => {
          const spotData = spot.toJSON();
          spotData.previewImage = spotData.previewImage?.[0]?.url || null;
          return spotData;
      });

      return res.status(200).json({
          spots: formattedSpots,
          page: parseInt(page),
          size: parseInt(size),
      });
  } catch (error) {
      console.error('Error fetching spots with filters:', error);
      return res.status(500).json({
          message: "Internal server error",
      });
  }
});

// Create a booking for a spot based on the spot ID
router.post('/:spotId/bookings', requireAuth, async (req, res) => {
  const { spotId } = req.params;
  const { startDate, endDate } = req.body;

  try {
      // Find the spot by ID
      const spot = await Spot.findByPk(spotId);

      // If the spot does not exist, return a 404 error
      if (!spot) {
          return res.status(404).json({
              message: "Spot couldn't be found",
          });
      }

      // Check if the logged-in user owns the spot
      if (spot.ownerId === req.user.id) {
          return res.status(403).json({
              message: "Forbidden",
          });
      }

      // Check for conflicting bookings
      const conflictingBooking = await Booking.findOne({
          where: {
              spotId,
              [Op.or]: [
                  {
                      startDate: {
                          [Op.between]: [startDate, endDate],
                      },
                  },
                  {
                      endDate: {
                          [Op.between]: [startDate, endDate],
                      },
                  },
                  {
                      startDate: {
                          [Op.lte]: startDate,
                      },
                      endDate: {
                          [Op.gte]: endDate,
                      },
                  },
              ],
          },
      });

      if (conflictingBooking) {
          return res.status(403).json({
              message: "Spot is already booked for the specified dates",
          });
      }

      // Create a new booking
      const newBooking = await Booking.create({
          userId: req.user.id,
          spotId,
          startDate,
          endDate,
      });

      // Respond with the new booking data
      return res.status(200).json({
          id: newBooking.id,
          userId: newBooking.userId,
          spotId: newBooking.spotId,
          startDate: newBooking.startDate,
          endDate: newBooking.endDate,
          createdAt: newBooking.createdAt,
          updatedAt: newBooking.updatedAt,
      });
  } catch (error) {
      console.error('Error creating booking:', error);
      return res.status(500).json({
          message: "Internal server error",
      });
  }
});

// Returns all reviews that belong to a spot specified by ID
router.get('/:spotId/reviews', async (req, res) => {
  const { spotId } = req.params;

  try {
      // Check if the spot exists
      const spot = await Spot.findOne({
        where:{id:req.params.spotId}, 
    });
      if (!spot) {
          return res.status(404).json({
              message: "Spot couldn't be found",
          });
      }

      // Retrieve reviews for the specified spot
      const reviews = await Review.findAll({
          where: { spotId:req.params.spotId },
          include: [
              {
                  model: User,
                  attributes: ['id', 'firstName', 'lastName'],
              },
              {
                  model: ReviewImage,
                  attributes: ['id', 'url'],
              },
          ],
          attributes: [
              'id', 'userId', 'spotId', 'review', 'stars', 'createdAt', 'updatedAt',
          ],
      });

      // Respond with the reviews
      return res.status(200).json({ reviews });
  } catch (error) {
      console.error('Error fetching reviews for spot:', error);
      return res.status(500).json({
          message: "Internal server error",
      });
  }
});

// Create and return a new review for a spot specified by ID
router.post('/:spotId/reviews', requireAuth, async (req, res) => {
  const { spotId } = req.params;
  const { review, stars } = req.body;

  try {
      // Check if the spot exists
      const spot = await Spot.findByPk(spotId);
      if (!spot) {
          return res.status(404).json({
              message: "Spot couldn't be found",
          });
      }

      // Check if a review already exists for this spot from the current user
      const existingReview = await Review.findOne({
          where: {
              spotId,
              userId: req.user.id,
          },
      });

      if (existingReview) {
          return res.status(500).json({
              message: "User already has a review for this spot",
          });
      }

      // Validate review and stars
      const errors = {};
      if (!review) errors.review = "Review text is required";
      if (!stars || stars < 1 || stars > 5) errors.stars = "Stars must be an integer from 1 to 5";

      if (Object.keys(errors).length) {
          return res.status(400).json({
              message: "Validation Error",
              errors,
          });
      }

      // Create the new review
      const newReview = await Review.create({
          userId: req.user.id,
          spotId,
          review,
          stars,
      });

      // Respond with the new review data
      return res.status(201).json({
          userId: newReview.userId,
          spotId: newReview.spotId,
          review: newReview.review,
          stars: newReview.stars,
          createdAt: newReview.createdAt,
          updatedAt: newReview.updatedAt,
      });
  } catch (error) {
      console.error('Error creating review:', error);
      return res.status(500).json({
          message: "Internal server error",
      });
  }
});


// Add a new image for a review specified by ID
router.post('/reviews/:reviewId/images', requireAuth, async (req, res) => {
  const { reviewId } = req.params;
  const { url } = req.body;

  try {
      // Find the review by ID
      const review = await Review.findByPk(reviewId);

      // If the review does not exist, return a 404 error
      if (!review) {
          return res.status(404).json({
              message: "Review couldn't be found",
          });
      }

      // Check if the logged-in user owns the review
      if (review.userId !== req.user.id) {
          return res.status(403).json({
              message: "Forbidden",
          });
      }

      // Check if the maximum number of images (e.g., 10) has been reached
      const imageCount = await ReviewImage.count({ where: { reviewId } });
      if (imageCount >= 10) {
          return res.status(403).json({
              message: "Maximum number of images for this resource has been reached",
          });
      }

      // Create the new image
      const newImage = await ReviewImage.create({
          reviewId,
          url,
      });

      // Respond with the new image data
      return res.status(200).json({
          id: newImage.id,
          url: newImage.url,
      });
  } catch (error) {
      console.error('Error adding image to review:', error);
      return res.status(500).json({
          message: "Internal server error",
      });
  }
});

// Add a new image for a review specified by ID
router.post('/reviews/:reviewId/images', requireAuth, async (req, res) => {
  const { reviewId } = req.params;
  const { url } = req.body;

  try {
      // Find the review by ID
      const review = await Review.findByPk(reviewId);

      // If the review does not exist, return a 404 error
      if (!review) {
          return res.status(404).json({
              message: "Review couldn't be found",
          });
      }

      // Check if the logged-in user owns the review
      if (review.userId !== req.user.id) {
          return res.status(403).json({
              message: "Forbidden",
          });
      }

      // Check if the maximum number of images (e.g., 10) has been reached
      const imageCount = await ReviewImage.count({ where: { reviewId } });
      if (imageCount >= 10) {
          return res.status(403).json({
              message: "Maximum number of images for this resource has been reached",
          });
      }

      // Create the new image
      const newImage = await ReviewImage.create({
          reviewId,
          url,
      });

      // Respond with the new image data
      return res.status(200).json({
          id: newImage.id,
          url: newImage.url,
      });
  } catch (error) {
      console.error('Error adding image to review:', error);
      return res.status(500).json({
          message: "Internal server error",
      });
  }
});

// Return all bookings for a spot specified by ID
router.get('/:spotId/bookings', requireAuth, async (req, res) => {
  const { spotId } = req.params;

  try {
      // Check if the spot exists
      const spot = await Spot.findByPk(spotId);
      if (!spot) {
          return res.status(404).json({
              message: "Spot couldn't be found",
          });
      }

      // Retrieve bookings for the specified spot
      const bookings = await Booking.findAll({
          where: { spotId },
          include: req.user.id === spot.ownerId ? [
              {
                  model: User,
                  attributes: ['id', 'firstName', 'lastName'],
              },
          ] : [],
          attributes: req.user.id === spot.ownerId
              ? ['id', 'spotId', 'userId', 'startDate', 'endDate', 'createdAt', 'updatedAt']
              : ['spotId', 'startDate', 'endDate'],
      });

      // Respond with the bookings
      return res.status(200).json({ bookings });
  } catch (error) {
      console.error('Error fetching bookings for spot:', error);
      return res.status(500).json({
          message: "Internal server error",
      });
  }
});



module.exports = router; //every route file ends with this