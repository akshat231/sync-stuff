import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  connectDevice,
  fetchSyncthingDeviceId,
  fetchSyncthingFolders,
} from '../api/syncService';

const Connect = () => {
  const [deviceId, setDeviceId] = useState('');
  const [folders, setFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  const loadSyncthingInfo = async () => {
    setLoading(true);
    setError('');
    try {
      const [id, folderList] = await Promise.all([
        fetchSyncthingDeviceId(),
        fetchSyncthingFolders(),
      ]);
      setDeviceId(id);
      setFolders(Array.isArray(folderList) ? folderList : []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to reach the client Syncthing. Is it running?'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSyncthingInfo();
  }, []);

  const selectedFolder = folders.find(
    (folder) => folder.id === selectedFolderId
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await connectDevice(deviceId);
      setSuccess(response);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to connect device');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">Reading Syncthing info...</div>;
  }

  return (
    <div className="connect-container">
      <div className="connect-card">
        <h2>Connect Device</h2>

        {error && (
          <>
            <div className="error-message">{error}</div>
            <button onClick={loadSyncthingInfo} className="btn btn-secondary">
              Retry
            </button>
          </>
        )}

        {!success ? (
          <>
            <div className="form-group">
              <label>Syncthing Device ID</label>
              {deviceId ? (
                <p className="device-id-display">{deviceId}</p>
              ) : (
                <p className="text-secondary">Not available</p>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="folder">Folder to sync</label>
                {folders.length === 0 ? (
                  <p className="text-secondary">
                    No folders configured on this Syncthing. Add one in the
                    Syncthing web UI first.
                  </p>
                ) : (
                  <select
                    id="folder"
                    value={selectedFolderId}
                    onChange={(e) => setSelectedFolderId(e.target.value)}
                    required
                  >
                    <option value="" disabled>
                      Select a folder...
                    </option>
                    {folders.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {folder.label || folder.id} ({folder.path})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <button
                type="submit"
                disabled={!deviceId || !selectedFolderId || submitting}
                className="btn btn-primary"
              >
                {submitting ? 'Connecting...' : 'Connect'}
              </button>
            </form>
          </>
        ) : (
          <div className="success-message">
            <h3>Device Connected!</h3>
            <p>Email: {success.data?.email}</p>
            <p>Device ID: {success.data?.deviceId}</p>
            <p>Folder ID: {success.data?.folderId}</p>
            <p>Server path: {success.data?.path}</p>
            {selectedFolder && <p>Client folder: {selectedFolder.path}</p>}
            <button
              onClick={() => navigate('/dashboard')}
              className="btn btn-primary"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Connect;