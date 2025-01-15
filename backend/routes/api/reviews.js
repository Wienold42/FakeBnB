// Import required modules and utilities
const express = require('express');
const { requireAuth } = require('../../utils/auth');
const { Review, ReviewImage, Spot, SpotImage, User } = require('../../db/models');
const router = express.Router();

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
                            as: 'previewImage',
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
