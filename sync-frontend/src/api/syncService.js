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

export const savePickedFolder = async (hostPath, name) => {
  const params = new URLSearchParams({ path: hostPath, name });
  const { data } = await axios.get(`/set-folder?${params.toString()}`);
  return data;
};

export const configureClientSyncthing = async (
  serverDeviceId,
  folderId,
  folderPath
) => {
  await syncthingClient.post('/rest/config/devices', {
    deviceID: serverDeviceId,
    name: 'sync-server',
    autoAcceptFolders: true,
  });
  await syncthingClient.post('/rest/config/folders', {
    id: folderId,
    label: folderId,
    path: folderPath,
    type: 'sendreceive',
    devices: [serverDeviceId],
    fsWatcherEnabled: true,
  });
};