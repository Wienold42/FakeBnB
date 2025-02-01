// ...
const router = require('express').Router();
const sessionRouter = require('./session.js');
const usersRouter = require('./users.js');
const spotsRouter = require('./spots.js'); //like this line 70
const reviewsRouter = require('./reviews.js');
const reviewImageRouter = require('./review-images.js');
const spotImageRouter = require('./spot-images.js');
const bookingsRouter = require('./bookings.js');
const { restoreUser } = require("../../utils/auth.js");

// Connect restoreUser middleware to the API router
  // If current user session is valid, set req.user to the user in the database
  // If current user session is not valid, set req.user to null
router.use(restoreUser);

router.use('/session', sessionRouter);

router.use('/users', usersRouter);
//After I build the route file, i must import the route file i.e. line 58 - and I must define the url that points to that router file.
router.use('/spots',spotsRouter);
router.use ('/reviews', reviewsRouter);
router.use ('/spot-images', spotImageRouter);
router.use ('/review-images', reviewImageRouter);
router.use ('/bookings', bookingsRouter);
router.post('/test', (req, res) => {
  res.json({ requestBody: req.body });
});

module.exports = router;
