import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStudios } from '../api/studioApi';

export default function Studios() {
  const [studios, setStudios] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStudios()
      .then(({ data }) => setStudios(data))
      .catch(() => setError('Could not load studios'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading studios...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="page">
      <h2>Studios</h2>
      {studios.length === 0 && <p>No studios yet.</p>}
      <div className="studio-grid">
        {studios.map((studio) => (
          <Link to={`/studios/${studio.id}`} key={studio.id} className="studio-card">
            <h3>{studio.name}</h3>
            <p>{studio.location}</p>
            <p className="price">€{studio.hourly_rate}/hour</p>
            <p className="engineer">by {studio.engineer_name}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
