const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');
const express = require('express')
//Every route file must import its model.
const { Spot, Review, User, ReviewImage } = require('../../db/models');
const {SpotImage} = require('../../db/models');
const router = express.Router();
const {requireAuth} = require('../../utils/auth');
const { where } = require('sequelize');
const { validationResult } = require('express-validator');



// Delete an existing image for a Spot
router.delete('/:imageId', requireAuth, async (req, res) => {
    const { imageId } = req.params;
  
    try {
        // Find the image by ID
        const image = await SpotImage.findByPk(imageId, {
            include: [
                {
                    model: Spot,
                    attributes: ['ownerId'],
                },
            ],
        });
  
        // If the image does not exist, return a 404 error
        if (!image) {
            return res.status(404).json({
                message: "Spot Image couldn't be found",
            });
        }
  
        // Check if the logged-in user owns the spot
        if (image.Spot.ownerId !== req.user.id) {
            return res.status(403).json({
                message: "Forbidden",
            });
        }
  
        // Delete the image
        await image.destroy();
  
        // Respond with a success message
        return res.status(200).json({
            message: "Successfully deleted",
        });
    } catch (error) {
        console.error('Error deleting spot image:', error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
  });

module.exports = router;