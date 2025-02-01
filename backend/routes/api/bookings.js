// Import required modules and utilities
const express = require('express');
const { requireAuth } = require('../../utils/auth');
const { Booking, Spot, SpotImage } = require('../../db/models');
const {Op} = require('sequelize')
const router = express.Router();

// Return all bookings made by the current user
router.get('/current', requireAuth, async (req, res) => {
    try {
        // Retrieve bookings created by the current user
        const bookings = await Booking.findAll({
            where: { userId: req.user.id },
            include: [
                {
                    model: Spot,
                    attributes: [
                        'id', 'ownerId', 'address', 'city', 'state', 'country', 'lat', 'lng', 'name', 'price'
                    ],
                    include: [
                        {
                            model: SpotImage,
                            as: 'SpotImages',
                            attributes: ['url'],
                            where: { preview: true },
                            required: false,
                        },
                    ],
                },
            ],
            attributes: [
                'id', 'spotId', 'userId', 'startDate', 'endDate', 'createdAt', 'updatedAt'
            ],
        });

        // Format bookings with previewImage
        const formattedBookings = bookings.map(booking => {
            const bookingData = booking.toJSON();
            if (bookingData.Spot && bookingData.Spot.previewImage) {
                bookingData.Spot.previewImage = bookingData.Spot.previewImage[0]?.url || null;
            }
            return bookingData;
        });

        // Respond with the bookings
        return res.status(200).json({ bookings: formattedBookings });
    } catch (error) {
        console.error('Error fetching current user bookings:', error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
});

// Update and return an existing booking
// router.put('/:bookingId', requireAuth, async (req, res) => {
//     const { bookingId } = req.params;
//     const { startDate, endDate } = req.body;

//     try {
//         // Find the booking by ID
//         const booking = await Booking.findByPk(bookingId);

//         // If the booking does not exist, return a 404 error
//         if (!booking) {
//             return res.status(404).json({
//                 message: "Booking couldn't be found",
//             });
//         }

//         // Check if the logged-in user owns the booking
//         if (booking.userId !== req.user.id) {
//             return res.status(403).json({
//                 message: "Forbidden",
//             });
//         }

//         // Check if the booking's end date is in the past
//         const currentDate = new Date();
//         if (new Date(booking.endDate) < currentDate) {
//             return res.status(400).json({
//                 message: "Past bookings can't be modified",
//             });
//         }

//         // Check for conflicting bookings
//         const conflictingBooking = await Booking.findOne({
//             where: {
//                 spotId: booking.spotId,
//                 id: { [Op.ne]: bookingId },
//                 [Op.or]: [
//                     {
//                         startDate: {
//                             [Op.between]: [startDate, endDate],
//                         },
//                     },
//                     {
//                         endDate: {
//                             [Op.between]: [startDate, endDate],
//                         },
//                     },
//                     {
//                         startDate: {
//                             [Op.lte]: startDate,
//                         },
//                         endDate: {
//                             [Op.gte]: endDate,
//                         },
//                     },
//                 ],
//             },
//         });

//         if (conflictingBooking) {
//             return res.status(403).json({
//                 message: "Spot is already booked for the specified dates",
//             });
//         }

//         // Update the booking
//         booking.startDate = startDate;
//         booking.endDate = endDate;
//         await booking.save();

//         // Respond with the updated booking data
//         return res.status(200).json({
//             id: booking.id,
//             userId: booking.userId,
//             spotId: booking.spotId,
//             startDate: booking.startDate,
//             endDate: booking.endDate,
//             createdAt: booking.createdAt,
//             updatedAt: booking.updatedAt,
//         });
//     } catch (error) {
//         console.error('Error updating booking:', error);
//         return res.status(500).json({
//             message: "Internal server error",
//         });
//     }
// });

// Delete an existing booking
router.delete('/:bookingId', requireAuth, async (req, res) => {
    const { bookingId } = req.params;

    try {
        // Find the booking by ID
        const booking = await Booking.findByPk(bookingId, {
            include: [
                {
                    model: Spot,
                    attributes: ['ownerId'],
                },
            ],
        });

        // If the booking does not exist, return a 404 error
        if (!booking) {
            return res.status(404).json({
                message: "Booking couldn't be found",
            });
        }

        // Check if the logged-in user is authorized (owner of the booking or the spot)
        if (booking.userId !== req.user.id && booking.Spot.ownerId !== req.user.id) {
            return res.status(403).json({
                message: "Forbidden",
            });
        }

        // Check if the booking's start date is in the past or current
        const currentDate = new Date();
        if (new Date(booking.startDate) <= currentDate) {
            return res.status(400).json({
                message: "Bookings that have started can't be deleted",
            });
        }

        // Delete the booking
        await booking.destroy();

        // Respond with a success message
        return res.status(200).json({
            message: "Successfully deleted",
        });
    } catch (error) {
        console.error('Error deleting booking:', error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
});

// GET /api/bookings/current - Get all bookings for current user
router.get('/bookings/current', requireAuth, async (req, res) => {
    const userId = req.user.id;

    const bookings = await Booking.findAll({
        where: { userId },
        include: {
            model: Spot,
            attributes: ['id', 'ownerId', 'address', 'city', 'state', 'country', 'lat', 'lng', 'name', 'price'],
            include: [{ model: SpotImage, attributes: ['url'], limit: 1 }]
        }
    });

    const formattedBookings = bookings.map(booking => {
        return {
            ...booking.get(),
            Spot: {
                ...booking.Spot.get(),
                previewImage: booking.Spot.SpotImages.length ? booking.Spot.SpotImages[0].url : null
            }
        };
    });

    return res.status(200).json({ Bookings: formattedBookings });
});

// PUT /api/bookings/:bookingId - Edit a Booking
router.put('/:bookingId', requireAuth, async (req, res) => {
    const { bookingId } = req.params;
    const { startDate, endDate } = req.body;
    const userId = req.user.id;

    if (!startDate || !endDate){
        return res.status(400).json({
            message: "Bad Request",
            errors: { message: "Must have both startDate and endDate." }
        });
    } 

    // Find the booking
    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
        return res.status(404).json({ message: "Booking couldn't be found" });
    }

    // Ensure the user owns the booking
    if (booking.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized to edit this booking" });
    }

    // Validate dates
    if (new Date(endDate) <= new Date(startDate)) {
        return res.status(400).json({
            message: "Bad Request",
            errors: { endDate: "endDate cannot come before startDate" }
        });
    }

    // Check for booking conflicts
    const existingBookings = await Booking.findAll({
        where: {
            spotId: booking.spotId,
            id: { [Op.ne]: bookingId }, // Exclude the current booking
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

    // Update booking
    booking.startDate = startDate;
    booking.endDate = endDate;
    await booking.save();

    return res.status(200).json(booking);
});

// DELETE /api/bookings/:bookingId - Delete a Booking
router.delete('/bookings/:bookingId', requireAuth, async (req, res) => {
    const { bookingId } = req.params;
    const userId = req.user.id;

    // Find the booking
    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
        return res.status(404).json({ message: "Booking couldn't be found" });
    }

    // Ensure the user owns the booking
    if (booking.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized to delete this booking" });
    }

    // Delete booking
    await booking.destroy();

    return res.status(200).json({ message: "Successfully deleted" });
});

module.exports = router;
