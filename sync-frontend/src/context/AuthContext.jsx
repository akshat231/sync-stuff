import { createContext, useContext, useState } from 'react';
import { login as loginApi } from '../api/authService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [jwtToken, setJwtToken] = useState(() => localStorage.getItem('jwt_token'));
  const [user, setUser] = useState(null);
  const [loading] = useState(false);

  const login = async (googleAccessToken) => {
    const response = await loginApi(googleAccessToken);
    const token = response.data;
    localStorage.setItem('jwt_token', token);
    setJwtToken(token);
    setUser({ email: parseJwt(token)?.email });
    return response;
  };

  const logout = () => {
    localStorage.removeItem('jwt_token');
    setJwtToken(null);
    setUser(null);
  };

  const isAuthenticated = !!jwtToken;

  const value = {
    jwtToken,
    user,
    loading,
    login,
    logout,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}
