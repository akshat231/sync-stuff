import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const jwtToken = localStorage.getItem('jwt_token');
  if (jwtToken) {
    config.headers['jwt_token'] = jwtToken;
  }
  return config;
});

export default api;
