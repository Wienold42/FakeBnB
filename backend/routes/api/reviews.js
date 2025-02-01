// Import required modules and utilities
const express = require('express');
const { requireAuth } = require('../../utils/auth');
const { Review, ReviewImage, Spot, SpotImage, User } = require('../../db/models');
const reviewimages = require('../../db/models/reviewimages');
const router = express.Router();

// POST /api/reviews/:reviewId/images - Add an image to a review
router.post('/:reviewId/images', requireAuth, async (req, res) => {
    const { reviewId } = req.params;
    const { url } = req.body;
    const userId = req.user.id;

    // Find the review
    const review = await Review.findByPk(reviewId, {
        include: { model: ReviewImage }
    });

    if (!review) {
        return res.status(404).json({
            message: "Review couldn't be found"
        });
    }

    // Check if the logged-in user owns the review
    if (review.userId !== userId) {
        return res.status(403).json({
            message: "Unauthorized to add images to this review"
        });
    }
console.log(review.dataValues.ReviewImages.length)
    // Check if review already has 10 images
    if (review.ReviewImages.length >= 10) {
        return res.status(403).json({
            message: "Maximum number of images for this resource was reached"
        });
    }

    // Create new image entry
    const newImage = await ReviewImage.create({
        reviewId,
        url
    });

    // Return success response
    return res.status(201).json({
        id: newImage.id,
        url: newImage.url
    });
});

// PUT /api/reviews/:reviewId - Edit a Review
router.put('/:reviewId', requireAuth, async (req, res) => {
    const { reviewId } = req.params;
    const { review, stars } = req.body;
    const userId = req.user.id;

    // Find the review
    const existingReview = await Review.findByPk(reviewId);

    if (!existingReview) {
        return res.status(404).json({
            message: "Review couldn't be found"
        });
    }

    // Check if the logged-in user owns the review
    if (existingReview.userId !== userId) {
        return res.status(403).json({
            message: "Unauthorized to edit this review"
        });
    }

    // Validate request body
    const errors = {};
    if (!review) errors.review = "Review text is required";
    if (!stars || !Number.isInteger(stars) || stars < 1 || stars > 5) {
        errors.stars = "Stars must be an integer from 1 to 5";
    }

    if (Object.keys(errors).length > 0) {
        return res.status(400).json({
            message: "Bad Request",
            errors
        });
    }

    // Update the review
    existingReview.review = review;
    existingReview.stars = stars;
    await existingReview.save();

    // Return success response
    return res.status(200).json({
        id: existingReview.id,
        userId: existingReview.userId,
        spotId: existingReview.spotId,
        review: existingReview.review,
        stars: existingReview.stars,
        createdAt: existingReview.createdAt,
        updatedAt: existingReview.updatedAt
    });
});

// POST /api/reviews/:reviewId/images - Add an image to a review
router.post('/:reviewId/images', requireAuth, async (req, res) => {
    const { reviewId } = req.params;
    const { url } = req.body;
    const userId = req.user.id;

    // Find the review
    const review = await Review.findByPk(reviewId, {
        include: { model: ReviewImage }
    });

    if (!review) {
        return res.status(404).json({
            message: "Review couldn't be found"
        });
    }

    // Check if the logged-in user owns the review
    if (review.userId !== userId) {
        return res.status(403).json({
            message: "Unauthorized to add images to this review"
        });
    }

    // Check if review already has 10 images
    if (review.ReviewImages.length >= 10) {
        return res.status(403).json({
            message: "Maximum number of images for this resource was reached"
        });
    }

    // Create new image entry
    const newImage = await ReviewImage.create({
        reviewId,
        url
    });

    // Return success response
    return res.status(201).json({
        id: newImage.id,
        url: newImage.url
    });
});

// PUT /api/reviews/:reviewId - Edit a Review
router.put('/:reviewId', requireAuth, async (req, res) => {
    const { reviewId } = req.params;
    const { review, stars } = req.body;
    const userId = req.user.id;

    // Find the review
    const existingReview = await Review.findByPk(reviewId);

    if (!existingReview) {
        return res.status(404).json({
            message: "Review couldn't be found"
        });
    }

    // Check if the logged-in user owns the review
    if (existingReview.userId !== userId) {
        return res.status(403).json({
            message: "Unauthorized to edit this review"
        });
    }

    // Validate request body
    const errors = {};
    if (!review) errors.review = "Review text is required";
    if (!stars || !Number.isInteger(stars) || stars < 1 || stars > 5) {
        errors.stars = "Stars must be an integer from 1 to 5";
    }

    if (Object.keys(errors).length > 0) {
        return res.status(400).json({
            message: "Bad Request",
            errors
        });
    }

    // Update the review
    existingReview.review = review;
    existingReview.stars = stars;
    await existingReview.save();

    // Return success response
    return res.status(200).json({
        id: existingReview.id,
        userId: existingReview.userId,
        spotId: existingReview.spotId,
        review: existingReview.review,
        stars: existingReview.stars,
        createdAt: existingReview.createdAt,
        updatedAt: existingReview.updatedAt
    });
});

// DELETE /api/reviews/:reviewId - Delete a Review
router.delete('/:reviewId', requireAuth, async (req, res) => {
    const { reviewId } = req.params;
    const userId = req.user.id;

    // Find the review
    const review = await Review.findByPk(reviewId);

    if (!review) {
        return res.status(404).json({
            message: "Review couldn't be found"
        });
    }

    // Check if the logged-in user owns the review
    if (review.userId !== userId) {
        return res.status(403).json({
            message: "Unauthorized to delete this review"
        });
    }

    // Delete the review
    await review.destroy();

    return res.status(200).json({
        message: "Successfully deleted"
    });
});


// DELETE /api/reviews/:reviewId - Delete a Review
router.delete('/:reviewId', requireAuth, async (req, res) => {
    const { reviewId } = req.params;
    const userId = req.user.id;

    // Find the review
    const review = await Review.findByPk(reviewId);

    if (!review) {
        return res.status(404).json({
            message: "Review couldn't be found"
        });
    }

    // Check if the logged-in user owns the review
    if (review.userId !== userId) {
        return res.status(403).json({
            message: "Unauthorized to delete this review"
        });
    }

    // Delete the review
    await review.destroy();

    return res.status(200).json({
        message: "Successfully deleted"
    });
});

// Return all reviews written by the current user
router.get('/current', requireAuth, async (req, res) => {
    try {
        // Retrieve reviews created by the current user
        const reviews = await Review.findAll({
            where: { userId: req.user.id },
            include: [
                {
                    model: User,
                    attributes: ['id', 'firstName', 'lastName'],
                },
                {
                    model: Spot,
                    attributes: ['id', 'ownerId', 'address', 'city', 'state', 'country', 'lat', 'lng', 'name', 'price'],
                    include: [
                        {
                            model: SpotImage,
                            attributes: ['url'],
                            where: { preview: true },
                            required: false,
                        },
                    ],
                },
                {
                    model: ReviewImage,
                    attributes: ['id', 'url'],
                },
            ],
            attributes: ['id', 'userId', 'spotId', 'review', 'stars', 'createdAt', 'updatedAt'],
        });

        // Format reviews with previewImage
        const formattedReviews = reviews.map(review => {
            const reviewData = review.toJSON();
            if (reviewData.Spot && reviewData.Spot.previewImage) {
                reviewData.Spot.previewImage = reviewData.Spot.previewImage[0]?.url || null;
            }
            return reviewData;
        });

        // Respond with the reviews
        return res.status(200).json({ reviews: formattedReviews });
    } catch (error) {
        console.error('Error fetching current user reviews:', error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
});


//BUILD POST FOR REVIEW IMAGE

router.post('/reviews/:reviewId/images', requireAuth, async (req, res) => {
    const { reviewId } = req.params;
    const { url } = req.body;

    try {
        const review = await Review.findByPk(reviewId);

        if (!review) {
            return res.status(404).json({
                message: "Review couldn't be found",
            });
        }

        const imageCount = await ReviewImage.count({ where: { reviewId } });

        if (imageCount >= 10) {
            return res.status(403).json({
                message: "Maximum number of images for this resource was reached",
            });
        }

        const newImage = await ReviewImage.create({
            reviewId,
            url,
        });

        return res.status(201).json({
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

// Update and return an existing review
router.put('/:reviewId', requireAuth, async (req, res) => {
    const { reviewId } = req.params;
    const { review, stars } = req.body;

    try {
        // Find the review by ID
        const existingReview = await Review.findByPk(reviewId);

        // If the review does not exist, return a 404 error
        if (!existingReview) {
            return res.status(404).json({
                message: "Review couldn't be found",
            });
        }

        // Check if the logged-in user owns the review
        if (existingReview.userId !== req.user.id) {
            return res.status(403).json({
                message: "Forbidden",
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

        // Update the review
        existingReview.review = review;
        existingReview.stars = stars;
        await existingReview.save();

        // Respond with the updated review data
        return res.status(200).json({
            id: existingReview.id,
            userId: existingReview.userId,
            spotId: existingReview.spotId,
            review: existingReview.review,
            stars: existingReview.stars,
            createdAt: existingReview.createdAt,
            updatedAt: existingReview.updatedAt,
        });
    } catch (error) {
        console.error('Error updating review:', error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
});

// Delete an existing image for a Review
router.delete('/images/:imageId', requireAuth, async (req, res) => {
    const { imageId } = req.params;

    try {
        // Find the review image by ID
        const reviewImage = await ReviewImage.findByPk(imageId, {
            include: [
                {
                    model: Review,
                    attributes: ['userId'],
                },
            ],
        });

        // If the review image does not exist, return a 404 error
        if (!reviewImage) {
            return res.status(404).json({
                message: "Review Image couldn't be found",
            });
        }

        // Check if the logged-in user owns the review
        if (reviewImage.Review.userId !== req.user.id) {
            return res.status(403).json({
                message: "Forbidden",
            });
        }

        // Delete the review image
        await reviewImage.destroy();

        // Respond with a success message
        return res.status(200).json({
            message: "Successfully deleted",
        });
    } catch (error) {
        console.error('Error deleting review image:', error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
});


module.exports = router;
