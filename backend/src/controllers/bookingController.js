const bookingService = require('../services/bookingService');

async function createBooking(req, res, next) {
  try {
    const booking = await bookingService.createBooking(req.user.id, req.body);
    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
}

async function listMyBookings(req, res, next) {
  try {
    const bookings = await bookingService.listMyBookings(req.user.id);
    res.json(bookings);
  } catch (err) {
    next(err);
  }
}

async function listAllBookings(req, res, next) {
  try {
    const bookings = await bookingService.listAllBookings(req.user);
    res.json(bookings);
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const booking = await bookingService.updateStatus(req.params.id, req.body.status, req.user);
    res.json(booking);
  } catch (err) {
    next(err);
  }
}

async function cancelBooking(req, res, next) {
  try {
    const booking = await bookingService.cancelOwnBooking(req.params.id, req.user.id);
    res.json(booking);
  } catch (err) {
    next(err);
  }
}

module.exports = { createBooking, listMyBookings, listAllBookings, updateStatus, cancelBooking };
