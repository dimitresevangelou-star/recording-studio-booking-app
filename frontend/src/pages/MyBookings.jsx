import { useEffect, useState } from 'react';
import { getMyBookings } from '../api/bookingApi';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyBookings()
      .then(({ data }) => setBookings(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="page">
      <h2>My Bookings</h2>
      {bookings.length === 0 && <p>No bookings yet.</p>}
      <table className="bookings-table">
        <thead>
          <tr>
            <th>Studio</th>
            <th>Start</th>
            <th>End</th>
            <th>Status</th>
            <th>Price</th>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
