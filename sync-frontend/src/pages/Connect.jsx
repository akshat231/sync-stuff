import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { connectDevice, fetchSyncthingDeviceId } from '../api/syncService';

const Connect = () => {
  const [deviceId, setDeviceId] = useState('');
  const [folderName, setFolderName] = useState('');
  const [fileCount, setFileCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const folderInputRef = useRef(null);
  const navigate = useNavigate();

  const loadSyncthingInfo = async () => {
    setLoading(true);
    setError('');
    try {
      const id = await fetchSyncthingDeviceId();
      setDeviceId(id);
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

  const pickFolder = async () => {
    try {
      if (window.showDirectoryPicker) {
        const handle = await window.showDirectoryPicker();
        setFolderName(handle.name);
        setFileCount(0);
        setError('');
      } else {
        folderInputRef.current?.click();
      }
    } catch (err) {
      if (err?.name === 'AbortError') return;
      setError('Folder picker not supported in this browser');
    }
  };

  const handleFolderPicked = (event) => {
    const input = event.target;
    const files = Array.from(input.files || []);
    let name = '';

    if (files.length > 0) {
      const firstPath = files[0].webkitRelativePath || files[0].name;
      name = firstPath.split('/')[0];
    } else {
      const fakePath = input.value || '';
      const parts = fakePath.split(/[\\/]/);
      name = parts[parts.length - 1];
    }

    if (!name) return;

    setFolderName(name);
    setFileCount(files.length);
    setError('');

    event.target.value = '';
  };

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
                <label>Folder to sync</label>
                <input
                  ref={folderInputRef}
                  type="file"
                  webkitdirectory=""
                  directory=""
                  style={{ display: 'none' }}
                  onChange={handleFolderPicked}
                />
                <button
                  type="button"
                  onClick={pickFolder}
                  className="btn btn-secondary"
                >
                  Pick folder from computer
                </button>
                {folderName && (
                  <p className="folder-picked">
                    <strong>{folderName}</strong>
                    {fileCount > 0 && ` — ${fileCount} files detected`}
                  </p>
                )}
                <p className="text-secondary">
                  Tip: choose the folder already shared by client Syncthing.
                </p>
              </div>

              <button
                type="submit"
                disabled={!deviceId || !folderName || submitting}
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
            <p>Folder: {folderName}</p>
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