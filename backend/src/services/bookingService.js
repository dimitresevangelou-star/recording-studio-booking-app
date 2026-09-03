const bookingRepository = require('../repositories/bookingRepository');
const studioRepository = require('../repositories/studioRepository');

class BookingService {
  async createBooking(artistId, { studioId, startTime, endTime }) {
    const studio = await studioRepository.findById(studioId);
    if (!studio) {
      const err = new Error('Studio not found');
      err.statusCode = 404;
      throw err;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (end <= start) {
      const err = new Error('endTime must be after startTime');
      err.statusCode = 400;
      throw err;
    }

    const overlaps = await bookingRepository.findOverlapping(studioId, start, end);
    if (overlaps.length > 0) {
      const err = new Error('Studio already booked for that time slot');
      err.statusCode = 409;
      throw err;
    }

    const hours = (end - start) / (1000 * 60 * 60);
    const totalPrice = Number((hours * studio.hourly_rate).toFixed(2));

    return bookingRepository.create({ studioId, artistId, startTime: start, endTime: end, totalPrice });
  }

  async listMyBookings(artistId) {
    return bookingRepository.findByArtist(artistId);
  }

  async listAllBookings() {
    return bookingRepository.findAll();
  }

  async updateStatus(id, status) {
    const allowed = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!allowed.includes(status)) {
      const err = new Error('Invalid status');
      err.statusCode = 400;
      throw err;
    }
    const booking = await bookingRepository.updateStatus(id, status);
    if (!booking) {
      const err = new Error('Booking not found');
      err.statusCode = 404;
      throw err;
    }
    return booking;
  }
}

module.exports = new BookingService();
