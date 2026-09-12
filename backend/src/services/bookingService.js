const bookingRepository = require('../repositories/bookingRepository');
const studioRepository = require('../repositories/studioRepository');

function parseId(id, label = 'id') {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    const err = new Error(`Invalid ${label}`);
    err.statusCode = 400;
    throw err;
  }
  return numericId;
}

async function getBookingOr404(id) {
  const booking = await bookingRepository.findById(id);
  if (!booking) {
    const err = new Error('Booking not found');
    err.statusCode = 404;
    throw err;
  }
  return booking;
}

// Throws 403 unless the given user is allowed to manage (view/modify) this booking:
// admins manage everything, engineers only bookings for studios they own.
async function assertCanManageBooking(booking, user) {
  if (user.role === 'admin') return;
  if (user.role === 'engineer') {
    const studio = await studioRepository.findById(booking.studio_id);
    if (studio && studio.engineer_id === user.id) return;
  }
  const err = new Error('Not authorized to manage this booking');
  err.statusCode = 403;
  throw err;
}

class BookingService {
  async createBooking(artistId, { studioId, startTime, endTime }) {
    const numericStudioId = parseId(studioId, 'studioId');

    const studio = await studioRepository.findById(numericStudioId);
    if (!studio) {
      const err = new Error('Studio not found');
      err.statusCode = 404;
      throw err;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      const err = new Error('startTime and endTime must be valid dates');
      err.statusCode = 400;
      throw err;
    }
    if (end <= start) {
      const err = new Error('endTime must be after startTime');
      err.statusCode = 400;
      throw err;
    }
    if (start < new Date()) {
      const err = new Error('startTime must be in the future');
      err.statusCode = 400;
      throw err;
    }

    const overlaps = await bookingRepository.findOverlapping(numericStudioId, start, end);
    if (overlaps.length > 0) {
      const err = new Error('Studio already booked for that time slot');
      err.statusCode = 409;
      throw err;
    }

    const hours = (end - start) / (1000 * 60 * 60);
    const totalPrice = Number((hours * studio.hourly_rate).toFixed(2));

    return bookingRepository.create({ studioId: numericStudioId, artistId, startTime: start, endTime: end, totalPrice });
  }

  async listMyBookings(artistId) {
    return bookingRepository.findByArtist(artistId);
  }

  // Admins see every booking; engineers see only bookings for studios they own.
  async listAllBookings(user) {
    if (user.role === 'admin') {
      return bookingRepository.findAll();
    }
    return bookingRepository.findByEngineer(user.id);
  }

  // Admin/engineer status changes (pending/confirmed/completed/cancelled),
  // scoped so an engineer can only touch bookings for studios they own.
  async updateStatus(id, status, user) {
    const allowed = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!allowed.includes(status)) {
      const err = new Error('Invalid status');
      err.statusCode = 400;
      throw err;
    }
    const numericId = parseId(id, 'booking id');
    const booking = await getBookingOr404(numericId);
    await assertCanManageBooking(booking, user);

    return bookingRepository.updateStatus(numericId, status);
  }

  // Self-service cancellation: an artist may only cancel their own booking,
  // and only ever set it to 'cancelled' (never confirm/complete other bookings).
  async cancelOwnBooking(id, artistId) {
    const numericId = parseId(id, 'booking id');
    const booking = await getBookingOr404(numericId);
    if (booking.artist_id !== artistId) {
      const err = new Error('Not authorized to cancel this booking');
      err.statusCode = 403;
      throw err;
    }
    return bookingRepository.updateStatus(numericId, 'cancelled');
  }
}

module.exports = new BookingService();
