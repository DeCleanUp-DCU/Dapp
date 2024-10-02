import React from 'react';
import Modal from 'react-modal';

interface TwitterNewShareModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  tokenImage: string;
}

const TwitterNewShareModal: React.FC<TwitterNewShareModalProps> = ({ isOpen, onRequestClose, tokenImage }) => {
  const twitterTemplate = encodeURIComponent(
    "I’ve just minted my first rewards by @DeCleanupNet ! 🗑️🌍\n\nWant the same? Do a cleanup, submit proof, and mint your rewards! Reach new levels of impact with bigger Impact Value and DCU points 🍃💪"
  );

  const handleTweet = () => {
    const tweetUrl = `https://twitter.com/intent/tweet?text=${twitterTemplate}&url=${encodeURIComponent(tokenImage)}`;
    window.open(tweetUrl, '_blank');
  };


  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Twitter Share Modal"
      style={{
        content: {
          maxWidth: '500px',
          margin: 'auto',
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#58b12f',
          zIndex: '1000',
          borderColor: 'transparent',
        },
        overlay: {
          zIndex: '999',
          backgroundColor: 'rgba(0, 0, 0, 1)',
        },
      }}
    >
      <div onClick={onRequestClose} className="delete-button">
        <img src="https://cdn.prod.website-files.com/669132d0a567fe2c543eb7cf/66ec2e99804f43b52d56f1df_delete.svg" loading="lazy" alt="" className="DELETE" />
      </div>
      <h3 style={{ margin: "0", fontSize: "1rem" }}>Share Your First Minted NFT!</h3>
      <img src={tokenImage} alt="Minted Token" style={{ maxWidth: '70%', marginBottom: '20px' }} />
      <button onClick={handleTweet} className="twitter-login-button mr">
        SHARE ON X
      </button>
      <h4>I’ve just minted my first rewards by @DeCleanupNet ! 🗑️🌍</h4>
      <h4>
        Want the same? Do a cleanup, submit proof, and mint your rewards! Reach new levels of impact with bigger Impact Value and DCU points 🍃💪
      </h4>
    </Modal>
  );
};

export default TwitterNewShareModal;
