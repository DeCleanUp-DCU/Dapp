import {
  ConnectWallet,
  useAddress,
  useContract,
  Web3Button,
  useContractRead,
  useOwnedNFTs,
  useNFT,
} from "@thirdweb-dev/react";
import { utils } from "ethers";
import { useState, useEffect } from "react";
import {
  clientIdConst,
  contractConst,
} from "../consts/parameters";
import imageCompression from 'browser-image-compression';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, getDocs, getDoc, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { storage, db } from '../lib/firebase';
import { getAuth, TwitterAuthProvider, signInWithPopup, getAdditionalUserInfo } from 'firebase/auth';
import { useParams } from "react-router-dom";
import Modal from 'react-modal';
import { Link } from "react-router-dom";
import "../styles/globals.css?inline";
import { toast } from 'react-toastify';
import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';
import TwitterNewShareModal from "./TwitteNew";
import TwitterProShareModal from "./TwittePro";


Modal.setAppElement('#root');

const urlParams = new URL(window.location.toString()).searchParams;
const contractAddress = urlParams.get("contract") || contractConst || "";


export default function Mint() {
  const { contract } = useContract(contractAddress);
  const walletAddress = useAddress();
  const address = walletAddress?.toLowerCase();
  const [quantity, setQuantity] = useState(1);
  const [buttonText, setButtonText] = useState('SEND PROOF');
  const [merkleRoot, setMerkleRoot] = useState<string | null>(null);
  const [proof, setProof] = useState<string[] | null>(null);
  const { tokenId } = useParams<{ tokenId: string }>();
  const { data: nft, isLoading: isNFTLoading } = useNFT(contract, tokenId?.toString());
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [isAgreed, setIsAgreed] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [displayName, setDisplayName] = useState<string>("");
  const [twitteruser, setTwitteruser] = useState<string>("");
  const [twitterusername, setTwitterusername] = useState<string>("");
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [tokenImage, setTokenImage] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isInReview, setIsInReview] = useState<boolean>(false);
  const [allowList, setAllowList] = useState<string[]>([]);

  const leafNodes = allowList.map((addr: string | number | Buffer | import("bn.js")) => keccak256(addr));
  const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
  const rootHash = merkleTree.getRoot();

  useEffect(() => {
    const fetchAllowList = async () => {
      const allowListRef = collection(db, 'allowList');
      const allowListSnapshot = await getDocs(allowListRef);
      const addresses = allowListSnapshot.docs.map(doc => doc.data().address);
      setAllowList(addresses);
    };

    fetchAllowList();
  }, []);

  const handleLogin = async () => {
    const auth = getAuth();
    const provider = new TwitterAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const twitterData = user.providerData.find((provider) => provider.providerId === 'twitter.com');
      const displayName = twitterData?.displayName;
      const twitterHandles = await getAdditionalUserInfo(result);
      const twitteruser = twitterHandles?.username;
      const twitterusername = `@${twitteruser}`;
      setDisplayName(displayName || '');
      setTwitteruser(twitteruser || '');
      setTwitterusername(twitterusername || '');
      setIsLoggedIn(true);
    } catch (error) {
      console.error('Error during login:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTwitterusername(e.target.value);
  };

  const clearImage = () => {
    setProofImage(null);
    setImagePreview(null);
    setIsInReview(true);
  };

  useEffect(() => {
    setIsActive(true);
  }, []);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];

      try {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1024,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);
        const extension = file.name.split('.').pop();
        const renamedFile = new File([compressedFile], `proof.${extension}`, { type: compressedFile.type });
        setProofImage(renamedFile);
      } catch (error) {
        console.error('Error during image compression:', error);
      }
    }
  };

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsAgreed(event.target.checked);
  };

  useEffect(() => {
    if (proofImage) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(proofImage);
    } else {
      setImagePreview(null);
    }
  }, [proofImage]);

  const handleSubmit = async () => {
    if (!proofImage) {
      setStatus('No image selected');
      toast("No image selected", { type: 'error' });
      return;
    }
    if (!address) {
      setStatus('No wallet address provided');
      toast('No wallet address provided', { type: 'error' });
      return;
    }

    setButtonText('Uploading...');

    const storageRef = ref(storage, `proofs/${address}/${proofImage.name}`);
    const uploadTask = uploadBytesResumable(storageRef, proofImage);

    const handleUploadError = () => {
      setStatus('Failed to upload proof. Try again.');
      toast("Failed to upload proof. Try again.", { type: 'error' });
      setButtonText('Send proof');
    };

    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      },
      handleUploadError,
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
          console.log('File available at', downloadURL);
          try {
            console.log('Attempting to save URL to Firestore...');
            await setDoc(doc(db, 'WL', address), {
              address: address,
              twitter: twitterusername,
              aggre: isAgreed,
              time: serverTimestamp(),
              imageUrl: downloadURL
            }, { merge: true });
            setStatus('Cleanup proof was uploaded and will be reviewed soon.');
            setButtonText('Uploaded');
            toast("Cleanup proof was uploaded and will be reviewed soon.", { type: 'success' });
            setUploadComplete(true);
            const telegramBotToken = '7415453321:AAHQWPViANAHyqtWfKMzaHXaQeqmcX7c9yc';
            const chatId = '-1002240752988';
            const message = `WL - New Cleanup proof was uploaded.\nWallet Address: \`${address}\` \nTwitter: \`${twitterusername}\` \nAggre to share: ${isAgreed}\nCleanUp Proof: ${downloadURL}`;

            const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown'
              })
            });

            const data = await response.json();
            if (!data.ok) {
              console.error('Error sending message to Telegram:', data.description);
            } else {
              console.log('Message sent to Telegram channel successfully.');
            }
          } catch (error) {
            handleUploadError();
          }
        }).catch(handleUploadError);
      }
    );
  };

  const {
    data: ownedNFTs,
    isLoading: isOwnedNFTsLoading,
  } = useOwnedNFTs(contract, address);

  const newimg = "https://5329c0cdcfc1c51568708d09a3af8095.ipfscdn.io/ipfs/bafybeicgdbkujs3oziojmc7rioyiqtdbk54uf6qas2mx4ihsykbcf4meoa/newbie1.png";

  const gasLimit = "600000";
  const maxPriority = "300000";
  const maxFeePer = "500000000";

  let cost = '';
  let DisplayPRICE = '';

  const { data: PRICE, isLoading: loadingPRICE } = useContractRead(
    contract,
    "PRICE",
  );

  const getProof = () => {
    if (address) {
      const claimingAddress = keccak256(address);
      const hexProof = merkleTree.getHexProof(claimingAddress);
      setProof(hexProof);
      console.log(hexProof)
    }
  };

  const { data: isWL, isLoading: loadingWL, error: wlError } = useContractRead(
    contract,
    "isWhitelisted",
    address && proof ? [address, proof] : undefined
  );

  useEffect(() => {
    getProof();
  }, [address]);

  useEffect(() => {
    if (loadingWL) {
      console.log("Checking whitelist status...");
    } else if (wlError) {
      console.error("Error checking whitelist status:", wlError);
    } else if (isWL !== undefined) {
      console.log("Whitelist status:", isWL);
    }
  }, [isWL, loadingWL, wlError]);


  const checkUserStatus = async (
    address: string,
    setImagePreview: (url: string | null) => void,
    setUploadComplete: (complete: boolean) => void
  ) => {
    try {
      const userDocRef = doc(db, 'WL', address);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const imageUrl = userData.imageUrl;
        if (imageUrl) {
          setImagePreview(imageUrl);
          setUploadComplete(true);
        } else {
          setUploadComplete(false);
        }
      } else {
        console.log('User has not submitted proof yet.');
        setUploadComplete(false);
      }
    } catch (error) {
      console.error('Error fetching user proof or image:', error);
    }
  };


  useEffect(() => {
    if (address) {
      checkUserStatus(address, setImagePreview, setUploadComplete);
    }
  }, [address]);


  if (!loadingPRICE && PRICE) {
    DisplayPRICE = utils.formatUnits(PRICE.toString());
    cost = PRICE.toString();
  }


  const clientId = urlParams.get("clientId") || clientIdConst || "";
  if (!clientId) {
    return (
      <div className="flex items-center justify-center h-full">
        Client ID is required.
      </div>
    );
  }

  if (!contractAddress) {
    return (
      <div className="flex items-center justify-center h-full">
        Contract address is required.
      </div>
    );
  }

  if (isOwnedNFTsLoading && address) {
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
              <ConnectWallet style={{ gap: "2px" }} className="wallet-connect" />
            </a>
          </div>
        </div>
        <div className="heading-wraps">
          <h1 className="text-h1 is-hide-mobile">DeCleanup&nbsp;Rewards</h1>
          <h1 className="is-mob is-hide-mob">De Cleanup Rewards</h1>
        </div>
        <div className="about-wrap">
          <p className="text-size-m">
            <span className="is-line-text">Clean Up, Snap, Earn </span>
            <br />
            <br />
            We recognize and reward your efforts to clean up nature around you. Simply
            snap a photo of&nbsp;result, upload the proof, and receive digital rewards
            as you level up. Each action you take provides permanent validation of
            your positive impact. Together, we can make the world a&nbsp;cleaner
            place, one action at a time.
          </p>
        </div>
        <div className="button-wrap border">
          <a className="loadbutton">
            LOADING...
          </a>
        </div>
        <div className="footer">
          <img src="https://cdn.prod.website-files.com/669132d0a567fe2c543eb7cf/66914178dbf243a16af65b8a_2024%C2%A9.svg" loading="lazy" alt="" />
          <p className="logo-a">ARBITRUM</p>
        </div>
      </div>

    );
  }



  return (
    <>
      <div>
        {address == "" || address == null ? (
          <>
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
                </div>
              </div>
              <div className="heading-wraps">
                <h1 className="text-h1 is-hide-mobile">DeCleanup&nbsp;Rewards</h1>
                <h1 className="is-mob is-hide-mob">De Cleanup Rewards</h1>
              </div>
              <div className="about-wrap">
                <p className="text-size-m">
                  <span className="is-line-text">Clean Up, Snap, Earn </span>
                  <br />
                  <br />
                  We recognize and reward your efforts to clean up nature around you. Simply
                  snap a photo of&nbsp;result, upload the proof, and receive digital rewards
                  as you level up. Each action you take provides permanent validation of
                  your positive impact. Together, we can make the world a&nbsp;cleaner
                  place, one action at a time.
                </p>
              </div>
              <div className="button-wrap border">
                <ConnectWallet className="button" />
              </div>
              <div className="footer">
                <img src="https://cdn.prod.website-files.com/669132d0a567fe2c543eb7cf/66914178dbf243a16af65b8a_2024%C2%A9.svg" loading="lazy" alt="" />
                <p className="logo-a">ARBITRUM</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <div>
              {!isOwnedNFTsLoading && (
                ownedNFTs && ownedNFTs.length > 0 ? (
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
                          <ConnectWallet style={{ gap: "2px" }} className="wallet-connect" />
                        </a>
                      </div>
                    </div>
                    <div className="heading-wrap">
                      <div className="heading-wraps">
                        <h1 className="text-h1 is-hide-mobile">DeCleanup&nbsp;Rewards</h1>
                        <h1 className="is-mob is-hide-mob">De Cleanupn Rewards</h1>
                        <div className={`nft-card ${isActive ? 'is-active' : ''}`}>
                          <img
                            src={`${ownedNFTs[0].metadata.image}`}
                            loading="lazy"
                            alt=""
                            className="nft-img"
                          />
                        </div>
                      </div>
                    </div>
                    <>
                      <div className="nft-wrap">
                        <div className="text-wrap wrap-center">
                          <p className="paragraph-s">thanks for your support &lt;3</p>
                          <button className="twitter-login-button" style={{ marginTop: "1rem" }}
                            onClick={() => {
                              if (ownedNFTs && ownedNFTs.length > 0) {
                                setTokenImage(`${ownedNFTs[0].metadata.image}`);
                                setIsProModalOpen(true);
                              } else {
                                console.error("No NFTs available to set the token image.");
                              }
                            }}>
                            Share on X</button>
                        </div>
                        <div className="lvls-wrap is-hide-mob hide-mo is-hide-mobile">
                          {ownedNFTs[0].metadata.attributes && (
                            // @ts-ignore
                            ownedNFTs[0].metadata.attributes.slice(3, 7).map((attribute, index) => (
                              <div key={index}
                                id="w-node-_3c7c7431-5b3f-3ca3-f859-7a5558a3da1b-51c2bcea"
                                className="lvl"
                              >
                                <p
                                  id="w-node-_6e9087bb-ca87-3a26-c99f-2796d17c4d61-51c2bcea"
                                  className="text-size-l"
                                >
                                  {attribute.trait_type}
                                </p>
                                <p
                                  id="w-node-_3be52719-ff4c-2d23-0f67-8d9151dac7ce-51c2bcea"
                                  className="text-size-l is-yellow"
                                >
                                  {attribute.value}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                      <div className="button-wrap border">
                        <Link className="button" to={`/proof/${ownedNFTs[0].metadata.id}`}>
                          Upgrade
                        </Link>
                      </div>
                      <div className="footer">
                        <img src="https://cdn.prod.website-files.com/669132d0a567fe2c543eb7cf/66914178dbf243a16af65b8a_2024%C2%A9.svg" loading="lazy" alt="" />
                        <p className="logo-a">ARBITRUM</p>
                      </div>
                    </>
                  </div>
                ) : (
                  <>
                    {loadingWL ? (
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
                              <ConnectWallet style={{ gap: "2px" }} className="wallet-connect" />
                            </a>
                          </div>
                        </div>
                        <div className="heading-wraps">
                          <h1 className="text-h1 is-hide-mobile">DeCleanup&nbsp;Rewards</h1>
                          <h1 className="is-mob is-hide-mob">De Cleanup Rewards</h1>
                        </div>
                        <div className="about-wrap">
                          <p className="text-size-m">
                            <span className="is-line-text">Clean Up, Snap, Earn </span>
                            <br />
                            <br />
                            We recognize and reward your efforts to clean up nature around you. Simply
                            snap a photo of&nbsp;result, upload the proof, and receive digital rewards
                            as you level up. Each action you take provides permanent validation of
                            your positive impact. Together, we can make the world a&nbsp;cleaner
                            place, one action at a time.
                          </p>
                        </div>
                        <div className="button-wrap border">
                          <a className="loadbutton">
                            LOADING...
                          </a>
                        </div>
                        <div className="footer">
                          <img src="https://cdn.prod.website-files.com/669132d0a567fe2c543eb7cf/66914178dbf243a16af65b8a_2024%C2%A9.svg" loading="lazy" alt="" />
                          <p className="logo-a">ARBITRUM</p>
                        </div>
                      </div>
                    ) : isWL ? (
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
                              <ConnectWallet style={{ gap: "2px" }} className="wallet-connect" />
                            </a>
                          </div>
                        </div>
                        <div className="heading-wraps">
                          <h1 className="text-h1 is-hide-mobile">DeCleanup&nbsp;Rewards</h1>
                          <h1 className="is-mob is-hide-mob">De Cleanup Rewards</h1>
                        </div>
                        <div className="about-wrap">
                          <p className="text-size-m">
                            <span className="is-line-text">Clean Up, Snap, Earn </span>
                            <br />
                            <br />
                            We recognize and reward your efforts to clean up nature around you. Simply
                            snap a photo of&nbsp;result, upload the proof, and receive digital rewards
                            as you level up. Each action you take provides permanent validation of
                            your positive impact. Together, we can make the world a&nbsp;cleaner
                            place, one action at a time.
                          </p>
                        </div>
                        <div className="button-wrap border">
                          <Web3Button className="button"
                            contractAddress={contractConst}
                            onSubmit={() => setButtonText('Minting...')}
                            action={(contract) => contract.call("mintWL", [quantity, proof], { gasLimit: gasLimit, value: cost, maxPriorityFeePerGas: maxPriority, maxFeePerGas: maxFeePer })}
                            onError={(err) => {
                              console.error(err);
                              console.log({ err });
                              setButtonText('TRY AGAIN');
                              toast("Sorry, something went wrong please try again.", { type: 'error' });
                            }}
                            onSuccess={() => {
                              {
                                setTokenImage(newimg)
                                setIsNewModalOpen(true)
                              }
                            }
                            }
                          >
                            claim
                          </Web3Button>
                        </div>
                        <div >

                        </div>
                        <div className="footer">
                          <img src="https://cdn.prod.website-files.com/669132d0a567fe2c543eb7cf/66914178dbf243a16af65b8a_2024%C2%A9.svg" loading="lazy" alt="" />
                          <p className="logo-a">ARBITRUM</p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {uploadComplete ? (
                          <>

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
                                    <ConnectWallet style={{ gap: "2px" }} className="wallet-connect" />
                                  </a>
                                </div>
                              </div>
                              <div className="heading-wrap">
                                <div className="heading-wraps">
                                  <h1 className="text-h1 is-hide-mobile">DeCleanup&nbsp;Rewards</h1>
                                  <h1 className="is-mob is-hide-mob">De Cleanup Rewards</h1>
                                </div>
                                <div className="nft-card is-active">
                                  {!imagePreview ? (
                                    <label htmlFor="file-upload" className="upload-icon-containe">
                                      <img
                                        src="https://cdn.prod.website-files.com/669132d0a567fe2c543eb7cf/669141790b6d1ddc88cac542_Group%20116.png"
                                        loading="lazy"
                                        alt="Upload Icon"
                                        className="upload-icon"
                                      />
                                    </label>
                                  ) : (
                                    <div className="image-preview-container">
                                      <div onClick={clearImage} className="delete-button">
                                        <img src="https://cdn.prod.website-files.com/669132d0a567fe2c543eb7cf/66ec2e99804f43b52d56f1df_delete.svg" loading="lazy" alt="" className="DELETE" />
                                      </div>
                                      <img

                                        src={imagePreview}
                                        alt="Selected"
                                        className="nft-img"
                                      />
                                    </div>
                                  )}
                                  <input
                                    id="file-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    style={{ display: 'none' }}
                                  />
                                </div>
                              </div>

                              <div className="nft-wrap">
                                {isInReview ? (
                                  <div className="text-wrap">

                                  </div>
                                ) : (
                                  <div className="text-wrap">
                                    <p className="paragraph-s">
                                      After the team review the proof of&nbsp;cleanup, check back the website to
                                      claim your NFT.{" "}
                                      <span className="is-yellow">
                                        Usually the process takes from 2 to 12 hours. Contact Decleanup&nbsp;
                                        <a target="_blank" rel="noopener noreferrer" href="https://t.me/DecentralizedCleanup" className="" style={{ color: "black" }}>
                                          Telegram&nbsp;
                                        </a>
                                        <a target="_blank" rel="noopener noreferrer" href="https://t.me/DecentralizedCleanup" className="" style={{ color: "black" }}>
                                          Discord&nbsp;
                                        </a>
                                        if you have questions or for troubleshooting
                                      </span>
                                    </p>
                                  </div>
                                )}
                              </div>
                              <div className="button-wrap border">
                                {isInReview ? (
                                  <a className="button"
                                    onClick={handleSubmit}
                                  >
                                    SEND PROOF
                                  </a>
                                ) : (
                                  <a className="button is-in-review-button">
                                    IN REVIEW
                                  </a>
                                )}
                              </div>
                              <div className="footer">
                                <img src="https://cdn.prod.website-files.com/669132d0a567fe2c543eb7cf/66914178dbf243a16af65b8a_2024%C2%A9.svg" loading="lazy" alt="" />
                                <p className="logo-a">ARBITRUM</p>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
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
                                    <ConnectWallet style={{ gap: "2px" }} className="wallet-connect" />
                                  </a>
                                </div>
                              </div>
                              <div className="heading-wrap">
                                <div className="heading-wraps">
                                  <h1 className="text-h1 is-hide-mobile">DeCleanup&nbsp;Rewards</h1>
                                  <h1 className="is-mob is-hide-mob">De Cleanup Rewards</h1>
                                </div>
                                <div className={`nft-card ${isActive ? 'is-active' : ''}`}>
                                  {!imagePreview ? (
                                    <label htmlFor="file-upload" className="upload-icon-container">
                                      <img
                                        src="https://cdn.prod.website-files.com/669132d0a567fe2c543eb7cf/669141790b6d1ddc88cac542_Group%20116.png"
                                        loading="lazy"
                                        alt="Upload Icon"
                                        className="upload-icon"
                                      />
                                    </label>
                                  ) : (
                                    <>
                                      <div onClick={clearImage} className="delete-button">
                                        <img src="https://cdn.prod.website-files.com/669132d0a567fe2c543eb7cf/66ec2e99804f43b52d56f1df_delete.svg" loading="lazy" alt="" className="DELETE" />
                                      </div>
                                      <img
                                        src={imagePreview}
                                        alt="Selected"
                                        className="nft-img"
                                      />
                                    </>
                                  )}
                                  <input
                                    id="file-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    style={{ display: 'none' }}
                                  />
                                </div>
                              </div>
                              <div className="nft-wrap">
                                <div className="confirm-wrap" style={{ flexDirection: "column" }}>
                                  <div className="login-container">
                                    {isLoggedIn ? (
                                      <h2>Welcome {displayName}!</h2>
                                    ) : (
                                      <>
                                        <button onClick={handleLogin} className="twitter-login-button">
                                          CONNECT X
                                        </button>
                                        <div style={{ display: "flex", gap: "0.7rem" }}>
                                          <label>
                                            <input
                                              type="checkbox"
                                              checked={isAgreed}
                                              onChange={handleCheckboxChange}
                                              className="checkbox"
                                            />
                                            <span className="checkmark"></span>
                                          </label>

                                          <p className="paragraph-s">
                                            Agree if you allow us to post your<br />
                                            pictures on social platforms like X, <br />
                                            Discord and Telegram
                                          </p>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="button-wrap border">
                                <a className="button"
                                  onClick={handleSubmit}
                                >
                                  {buttonText}
                                </a>
                              </div>
                              <div className="footer">
                                <img src="https://cdn.prod.website-files.com/669132d0a567fe2c543eb7cf/66914178dbf243a16af65b8a_2024%C2%A9.svg" loading="lazy" alt="" />
                                <p className="logo-a">ARBITRUM</p>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </>
                )
              )}
            </div>
          </>
        )}
      </div>
      <TwitterNewShareModal
        isOpen={isNewModalOpen}
        onRequestClose={() => setIsNewModalOpen(false)}
        tokenImage={tokenImage}
      />
      <TwitterProShareModal
        isOpen={isProModalOpen}
        onRequestClose={() => setIsProModalOpen(false)}
        tokenImage={tokenImage}
      />
    </>
  );
}
