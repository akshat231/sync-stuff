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
  const { data: devicesRes } = await syncthingClient.get('/rest/config/devices');
  const devices = Array.isArray(devicesRes)
    ? devicesRes
    : devicesRes?.devices || [];
  const exists = devices.some((d) => d.deviceID === serverDeviceId);

  let addresses = undefined;
  try {
    const { hostname } = new URL(
      import.meta.env.VITE_API_URL || 'http://localhost:5000'
    );
    addresses = [`tcp://${hostname}:22000`];
  } catch {
    addresses = undefined;
  }

  if (exists) {
    if (addresses) {
      try {
        await syncthingClient.patch(
          `/rest/config/devices/${serverDeviceId}`,
          { addresses }
        );
      } catch {
        // version may not support patch; dynamic discovery still applies
      }
    }
  } else {
    await syncthingClient.post('/rest/config/devices', {
      deviceID: serverDeviceId,
      name: 'sync-server',
      addresses: addresses || [],
      paused: false,
      autoAcceptFolders: true,
    });
  }

  await syncthingClient.post('/rest/config/folders', {
    id: folderId,
    label: folderId,
    path: folderPath,
    type: 'sendreceive',
    devices: [{ deviceID: serverDeviceId }],
    fsWatcherEnabled: true,
  });
};