import api from './api';

export const login = async (googleAccessToken) => {
  const response = await api.post('/login', {}, {
    headers: {
      auth_token: googleAccessToken,
    },
  });
  return response.data;
};
