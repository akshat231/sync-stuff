import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getData } from '../api/dataService';

const Dashboard = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchFiles = async () => {
    try {
      const response = await getData();
      setFiles(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleFileClick = (file) => {
    if (file.type === 'file') {
      navigate(`/play/${encodeURIComponent(file.name)}`);
    }
  };

  const getFileIcon = (file) => {
    if (file.type === 'directory') return '📁';
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (['mp4', 'mkv', 'avi', 'mov'].includes(ext)) return '🎬';
    if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) return '🎵';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '🖼️';
    if (['pdf'].includes(ext)) return '📄';
    return '📄';
  };

  if (loading) {
    return <div className="loading">Loading files...</div>;
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="empty-state">
          <h3>No sync connection yet</h3>
          <p>
            It looks like your device isn't connected, so there's nothing to
            show here yet.
          </p>
          <button
            onClick={() => navigate('/connect')}
            className="btn btn-primary"
          >
            Connect Device
          </button>
          <button onClick={fetchFiles} className="btn btn-secondary">
            Retry
          </button>
          {error && <p className="error-detail">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Your Files</h2>
        <button onClick={fetchFiles} className="btn btn-secondary">
          Refresh
        </button>
      </div>

      {files.length === 0 ? (
        <div className="empty-state">
          <p>No files found. Connect a device first.</p>
          <button onClick={() => navigate('/connect')} className="btn btn-primary">
            Connect Device
          </button>
        </div>
      ) : (
        <div className="file-grid">
          {files.map((file) => (
            <div
              key={file.name}
              className={`file-card ${file.type === 'file' ? 'clickable' : ''}`}
              onClick={() => handleFileClick(file)}
            >
              <span className="file-icon">{getFileIcon(file)}</span>
              <span className="file-name">{file.name}</span>
              <span className="file-type">{file.type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
