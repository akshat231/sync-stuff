import api from './api';
import axios from 'axios';

export const connectDevice = async (deviceId) => {
  const response = await api.post('/sync/connect', {
    device_id: deviceId,
  });
  return response.data;
};

const syncthingClient = axios.create({
  baseURL: '/syncthing',
  headers: {
    'X-API-Key': import.meta.env.VITE_SYNCTHING_API_KEY,
  },
});

export const fetchSyncthingDeviceId = async () => {
  const { data } = await syncthingClient.get('/rest/system/status');
  return data.myID;
};

export const fetchSyncthingFolders = async () => {
  const { data } = await syncthingClient.get('/rest/config/folders');
  return data;
};