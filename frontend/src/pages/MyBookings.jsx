import { useEffect, useState } from 'react';
import { getMyBookings, cancelBooking } from '../api/bookingApi';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function loadBookings() {
    setLoading(true);
    return getMyBookings()
      .then(({ data }) => setBookings(data))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadBookings();
  }, []);

  async function handleCancel(id) {
    setError('');
    try {
      await cancelBooking(id);
      await loadBookings();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel booking');
    }
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div className="page">
      <h2>My Bookings</h2>
      {error && <p className="error">{error}</p>}
      {bookings.length === 0 && <p>No bookings yet.</p>}
      <table className="bookings-table">
        <thead>
          <tr>
            <th>Studio</th>
            <th>Start</th>
            <th>End</th>
            <th>Status</th>
            <th>Price</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id}>
              <td>{b.studio_name}</td>
              <td>{new Date(b.start_time).toLocaleString()}</td>
              <td>{new Date(b.end_time).toLocaleString()}</td>
              <td>
                <span className={`status status-${b.status}`}>{b.status}</span>
              </td>
              <td>€{b.total_price}</td>
              <td>
                {b.status !== 'cancelled' && b.status !== 'completed' && (
                  <button type="button" onClick={() => handleCancel(b.id)}>
                    Cancel
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
