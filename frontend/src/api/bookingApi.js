import api from './axios';

export const createBooking = (data) => api.post('/bookings', data);
export const getMyBookings = () => api.get('/bookings/me');
export const getAllBookings = () => api.get('/bookings');
export const updateBookingStatus = (id, status) =>
  api.patch(`/bookings/${id}/status`, { status });
export const cancelBooking = (id) => api.patch(`/bookings/${id}/cancel`);
