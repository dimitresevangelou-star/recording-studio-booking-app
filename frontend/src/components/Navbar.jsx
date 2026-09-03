import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">Studio Booking</Link>
      <div className="navbar-links">
        <Link to="/studios">Studios</Link>
        {user?.role === 'artist' && <Link to="/my-bookings">My Bookings</Link>}
        {(user?.role === 'admin' || user?.role === 'engineer') && (
          <Link to="/admin">Admin</Link>
        )}
        {user ? (
          <>
            <span className="navbar-user">{user.full_name || user.fullName}</span>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
