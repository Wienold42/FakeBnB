// Import required modules and utilities
const express = require('express');
const { requireAuth } = require('../../utils/auth');
const { Review, ReviewImage, Spot, SpotImage, User } = require('../../db/models');
const reviewimages = require('../../db/models/reviewimages');
const router = express.Router();

// DELETE /api/review-images/:imageId - Delete a Review Image
router.delete('/:imageId', requireAuth, async (req, res) => {
    const { imageId } = req.params;
    const userId = req.user.id;

    // Find the review image
    const reviewImage = await ReviewImage.findByPk(imageId, {
        include: { model: Review, attributes: ['userId'] }
    });
console.log(reviewImage)
    if (!reviewImage) {
        return res.status(404).json({
            message: "Review Image couldn't be found"
        });
    }

    // Check if the logged-in user owns the review
    if (reviewImage.dataValues.Review.userId !== userId) {
        return res.status(403).json({
            message: "Unauthorized to delete this review image"
        });
    }

    // Delete the review image
    await reviewImage.destroy();

    return res.status(200).json({
        message: "Successfully deleted"
    });
});


module.exports = router;