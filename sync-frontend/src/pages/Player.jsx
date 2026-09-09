import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchMediaBlob } from '../api/dataService';

const Player = () => {
  const { filename } = useParams();
  const navigate = useNavigate();
  const [mediaUrl, setMediaUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const decodedFilename = decodeURIComponent(filename);
  const ext = decodedFilename.split('.').pop()?.toLowerCase();

  const isVideo = ['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(ext);
  const isAudio = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'].includes(ext);
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);

  useEffect(() => {
    let objectUrl = null;

    const loadMedia = async () => {
      try {
        setLoading(true);
        const blob = await fetchMediaBlob(decodedFilename);
        objectUrl = URL.createObjectURL(blob);
        setMediaUrl(objectUrl);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load media');
      } finally {
        setLoading(false);
      }
    };

    loadMedia();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [decodedFilename]);

  if (loading) {
    return <div className="loading">Loading media...</div>;
  }

  if (error) {
    return (
      <div className="player-container">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="player-container">
      <div className="player-header">
        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">
          ← Back to Dashboard
        </button>
        <h2>{decodedFilename}</h2>
      </div>

      <div className="player-content">
        {isVideo && (
          <video controls autoPlay className="video-player" src={mediaUrl}>
            Your browser does not support the video tag.
          </video>
        )}

        {isAudio && (
          <div className="audio-player">
            <div className="audio-icon">🎵</div>
            <audio controls autoPlay src={mediaUrl}>
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        {isImage && <img src={mediaUrl} alt={decodedFilename} className="image-player" />}

        {!isVideo && !isAudio && !isImage && (
          <div className="unsupported-file">
            <p>Preview not available for this file type.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Player;