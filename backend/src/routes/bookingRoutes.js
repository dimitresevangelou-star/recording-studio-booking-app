const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  createBooking,
  listMyBookings,
  listAllBookings,
  updateStatus,
  cancelBooking,
} = require('../controllers/bookingController');

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a booking (artist)
 *     tags: [Bookings]
 *     security: [{ bearerAuth: [] }]
 *   get:
 *     summary: List all bookings (admin/engineer)
 *     tags: [Bookings]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/', authenticate, authorize('artist'), createBooking);
router.get('/', authenticate, authorize('admin', 'engineer'), listAllBookings);

/**
 * @swagger
 * /api/bookings/me:
 *   get:
 *     summary: List the logged-in artist's bookings
 *     tags: [Bookings]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/me', authenticate, authorize('artist'), listMyBookings);

/**
 * @swagger
 * /api/bookings/{id}/status:
 *   patch:
 *     summary: Update booking status (admin/engineer)
 *     tags: [Bookings]
 *     security: [{ bearerAuth: [] }]
 */
router.patch('/:id/status', authenticate, authorize('admin', 'engineer'), updateStatus);

/**
 * @swagger
 * /api/bookings/{id}/cancel:
 *   patch:
 *     summary: Cancel your own booking (artist)
 *     tags: [Bookings]
 *     security: [{ bearerAuth: [] }]
 */
router.patch('/:id/cancel', authenticate, authorize('artist'), cancelBooking);

module.exports = router;
