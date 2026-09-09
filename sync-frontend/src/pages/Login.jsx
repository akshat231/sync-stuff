import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        scope: 'email profile',
        callback: async (tokenResponse) => {
          try {
            await login(tokenResponse.access_token);
            navigate('/dashboard');
          } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
          } finally {
            setLoading(false);
          }
        },
        error_callback: () => {
          setError('Google login failed');
          setLoading(false);
        },
      });
      client.requestAccessToken();
    } catch {
      setError('Failed to initialize Google login');
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Sync</h1>
        <p>Sign in to sync your files</p>
        {error && <div className="error-message">{error}</div>}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="btn btn-google"
        >
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </button>
      </div>
    </div>
  );
};

export default Login;
