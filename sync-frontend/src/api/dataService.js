import api from './api';

export const getData = async () => {
  const response = await api.get('/data');
  return response.data;
};

export const fetchMediaBlob = async (filename) => {
  const response = await api.get(`/data/play/${encodeURIComponent(filename)}`, {
    responseType: 'blob',
  });
  return response.data;
};