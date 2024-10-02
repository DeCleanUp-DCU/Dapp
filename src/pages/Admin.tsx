import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/Home.module.css';
import { ConnectWallet } from "@thirdweb-dev/react";

const Admin: React.FC = () => {
  const [tokenId, setTokenId] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTokenId(event.target.value);
  };

  const handleButtonClick = () => {
    if (tokenId) {
      navigate(`/upgrade/${tokenId}`);
    }
  };

  return (
    <div className="page-wrap">
      <div className="navbar border">
        <a
          href="/"
          className="logotype w-inline-block w--current"
        >
          <p className="logo">DECLEANUP NETWORK</p>
        </a>
        <div className="wallet-social">
          <a href="https://t.me/DecentralizedCleanup" className="icon w-inline-block">
            <img src="https://cdn.prod.website-files.com/669132d0a567fe2c543eb7cf/6691417859fc8bc2dd146976_Group%20117.svg" loading="lazy" alt="" />
          </a>
          <a href="https://x.com/decentracleanup" className="icon is-last w-inline-block" style={{ marginRight: "8px" }}>
            <img src="https://cdn.prod.website-files.com/669132d0a567fe2c543eb7cf/6691417892f6d310297f569b_icon%20x.svg" loading="lazy" alt="" />
          </a>
          <a className="icon is-last w-inline-block">
            <ConnectWallet className="wallet-connect" />
          </a>
        </div>
      </div>
      <div className="heading-wraps">
        <h1 className="text-h1 is-hide-mobile">DeCleanup&nbsp;Rewards</h1>
        <h1 className="is-mob is-hide-mob">De Cleanup Rewards</h1>
      </div>
      <div className="admin">
        <h1 className="panel-title">Admin Panel</h1>
        <input
          type="text"
          value={tokenId}
          onChange={handleInputChange}
          placeholder="Enter Token ID"
          style={{
            padding: '10px',
            fontSize: '16px',
            marginBottom: '20px',
            borderRadius: '5px',
            border: '3px solid #000',
            color: 'black',
            width: '80%',
            maxWidth: '400px',
            marginLeft: 'auto',
            marginRight: 'auto',
            display: 'block',
            textAlign: 'center'
          }}
        />
      </div>
      <div className="button-wrap border">
        <a
          onClick={handleButtonClick}
          className="button"
        >
          upgrade
        </a>
      </div>

    </div>
  );
};

export default Admin;
