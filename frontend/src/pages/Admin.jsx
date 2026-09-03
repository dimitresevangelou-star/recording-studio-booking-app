import { useEffect, useState } from 'react';
import { getAllBookings, updateBookingStatus } from '../api/bookingApi';
import { createStudio, getStudios } from '../api/studioApi';
import { useAuth } from '../context/AuthContext';

export default function Admin() {
  const [bookings, setBookings] = useState([]);
  const [studios, setStudios] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', location: '', hourlyRate: '' });
  const [message, setMessage] = useState('');
  const { user } = useAuth();

  function loadData() {
    getAllBookings().then(({ data }) => setBookings(data));
    getStudios().then(({ data }) => setStudios(data.filter((s) => s.engineer_id === user.id)));
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleStatusChange(id, status) {
    await updateBookingStatus(id, status);
    loadData();
  }

  function handleFormChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleCreateStudio(e) {
    e.preventDefault();
    setMessage('');
    try {
      await createStudio({ ...form, hourlyRate: Number(form.hourlyRate) });
      setForm({ name: '', description: '', location: '', hourlyRate: '' });
      setMessage('Studio created!');
      loadData();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to create studio');
    }
  }

  return (
    <div className="page">
      <h2>Admin Dashboard</h2>

      {user?.role === 'engineer' && (
        <section>
          <h3>Create a new studio</h3>
          <form onSubmit={handleCreateStudio} className="booking-form">
            <label>
              Name
              <input name="name" value={form.name} onChange={handleFormChange} required />
            </label>
            <label>
              Description
              <input name="description" value={form.description} onChange={handleFormChange} />
            </label>
            <label>
              Location
              <input name="location" value={form.location} onChange={handleFormChange} />
            </label>
            <label>
              Hourly rate (€)
              <input
                name="hourlyRate"
                type="number"
                min="0"
                step="0.01"
                value={form.hourlyRate}
                onChange={handleFormChange}
                required
              />
            </label>
            {message && <p>{message}</p>}
            <button type="submit">Create Studio</button>
          </form>

          <h3>My Studios</h3>
          <ul>
            {studios.map((s) => (
              <li key={s.id}>{s.name} — €{s.hourly_rate}/hour</li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h3>All Bookings</h3>
        <table className="bookings-table">
          <thead>
            <tr>
              <th>Artist</th>
              <th>Studio</th>
              <th>Start</th>
              <th>End</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id}>
                <td>{b.artist_name}</td>
                <td>{b.studio_name}</td>
                <td>{new Date(b.start_time).toLocaleString()}</td>
                <td>{new Date(b.end_time).toLocaleString()}</td>
                <td>
                  <span className={`status status-${b.status}`}>{b.status}</span>
                </td>
                <td>
                  <select
                    value={b.status}
                    onChange={(e) => handleStatusChange(b.id, e.target.value)}
                  >
                    <option value="pending">pending</option>
                    <option value="confirmed">confirmed</option>
                    <option value="completed">completed</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
