import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStudio } from '../api/studioApi';
import { createBooking } from '../api/bookingApi';
import { useAuth } from '../context/AuthContext';

export default function StudioDetail() {
  const { id } = useParams();
  const [studio, setStudio] = useState(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    getStudio(id).then(({ data }) => setStudio(data));
  }, [id]);

  async function handleBooking(e) {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const { data } = await createBooking({ studioId: id, startTime, endTime });
      setMessage(`Booking created! Total price: €${data.total_price}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed');
    }
  }

  if (!studio) return <p>Loading...</p>;

  return (
    <div className="page">
      <h2>{studio.name}</h2>
      <p>{studio.description}</p>
      <p>Location: {studio.location}</p>
      <p>Rate: €{studio.hourly_rate}/hour</p>

      {user?.role === 'artist' && (
        <form onSubmit={handleBooking} className="booking-form">
          <h3>Book this studio</h3>
          <label>
            Start time
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </label>
          <label>
            End time
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </label>
          {message && <p className="success">{message}</p>}
          {error && <p className="error">{error}</p>}
          <button type="submit">Book Session</button>
        </form>
      )}
    </div>
  );
}
