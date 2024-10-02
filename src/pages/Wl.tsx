import React, { useState, useEffect } from 'react';
import { Web3Button, ConnectWallet, useAddress } from "@thirdweb-dev/react";
import { collection, getDocs, addDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from '../lib/firebase';
import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';
import { toast } from 'react-toastify';
import { contractConst, admin1, admin2, admin3 } from "../consts/parameters";

const Wl: React.FC = () => {
  const [allowList, setAllowList] = useState<string[]>([]);
  const [newAddress, setNewAddress] = useState('');
  const [merkleRoot, setMerkleRoot] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [buttonText, setButtonText] = useState('update WL');
  const [buttonAdd, setButtontAdd] = useState('Add Address');
  const address = useAddress();
  const [addressAdded, setAddressAdded] = useState(false);
  const adminWallets = [admin1, admin2, admin3].map(wallet => wallet.toLowerCase());
  useEffect(() => {
    if (address && adminWallets.includes(address.toLowerCase())) {
      setIsAdmin(true);
    }
  }, [address]);

  useEffect(() => {
    const fetchAllowList = async () => {
      const allowListRef = collection(db, 'allowList');
      const allowListSnapshot = await getDocs(allowListRef);
      const addresses = allowListSnapshot.docs.map(doc => doc.data().address.toLowerCase());
      setAllowList(addresses);
      generateMerkleRoot(addresses);
    };

    fetchAllowList();
  }, []);

  const generateMerkleRoot = (addresses: string[]) => {
    const leafNodes = addresses.map(addr => keccak256(addr));
    const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
    const rootHash = `0x${merkleTree.getRoot().toString('hex')}`;
    setMerkleRoot(rootHash);
  };

  const addAddressToAllowList = async () => {
    if (!newAddress) {
      toast('Please enter a valid address', { type: 'warning' });

      return;
    }

    const lowerCaseAddress = newAddress.toLowerCase();

    setButtontAdd('Adding...');
    try {
      await addDoc(collection(db, 'allowList'), { address: lowerCaseAddress });
      const userDocRef = doc(db, 'WL', lowerCaseAddress);
      await deleteDoc(userDocRef);

      const updatedAllowList = [...allowList, lowerCaseAddress];
      setAllowList(updatedAllowList);
      generateMerkleRoot(updatedAllowList);

      toast('Address added successfully!', { type: 'success' });
      setNewAddress('');
      setButtontAdd('Address Added');
      setAddressAdded(true);
      window.location.reload();
    } catch (error) {
      toast('Failed to add address', { type: 'error' });
    }
  };

  if (!isAdmin) {
    return (
      <div className="page-wrap">
        <div className="navbar border">
          <a href="/" className="logotype w-inline-block w--current">
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

        <div className="heading-wrap">
          <div className="heading-wraps">
            <h1 className="text-h1 is-hide-mobile">DeCleanup&nbsp;Rewards</h1>
            <h1 className="is-mob is-hide-mob">De Cleanup Rewards</h1>
          </div>
        </div>

        <div className="admin">
          <h1 className="panel-title">Only for admin</h1>
        </div>

      </div>
    );
  }

  return (
    <div className="page-wrap">
      <div className="navbar border">
        <a href="/" className="logotype w-inline-block w--current">
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
        <h1 className="panel-titles">WL Panel</h1>
      </div>

      <div className="add-panels-container">
        <div className="add-panel">
          <h2>Add Address to Whitelist</h2>
          <input
            type="text"
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            placeholder="Enter address"
          />
          <button className='web3-button' onClick={addAddressToAllowList}>
            {buttonAdd}
          </button>
          <Web3Button
            className="web3-button"
            contractAddress={contractConst}
            onSubmit={() => setButtonText('updating...')}
            action={(contract) => contract.call("setWhitelistMerkleRoot", [merkleRoot])}
            onError={(err) => {
              console.error(err);
              setButtonText('TRY AGAIN');
              toast("Sorry, something went wrong please try again.", { type: 'error' });
            }}
            onSuccess={() => {
              setButtonText('update DONE');
              toast("Congrats! Your update was successful!", { type: 'success' });
            }}
          >
            {buttonText}
          </Web3Button>
        </div>
      </div>
    </div>
  );
};

export default Wl;