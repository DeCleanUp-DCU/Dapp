import React, { useEffect, useState } from 'react';
import { ConnectWallet, useContract, useNFT, useAddress, useContractRead } from "@thirdweb-dev/react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { storage, db } from '../../lib/firebase';
import { useParams, useNavigate } from "react-router-dom";
import "../../styles/globals.css?inline";
import { toast } from 'react-toastify';
import {
    contractConst,
} from "../../consts/parameters";
import { getAuth, TwitterAuthProvider, signInWithPopup, getAdditionalUserInfo } from 'firebase/auth';
import imageCompression from 'browser-image-compression';

type Attribute = {
    trait_type: string;
    value: string;
};

type Metadata = {
    name: string;
    id: string;
    attributes: Attribute[];
};

type NFT = {
    metadata: Metadata;
};

export default function Proof() {
    const urlParams = new URL(window.location.toString()).searchParams;
    const contractAddress = urlParams.get("contract") || contractConst || "";
    const walletAddress = useAddress();
    const address = walletAddress?.toLowerCase();
    const { tokenId } = useParams<{ tokenId: string }>();
    const navigate = useNavigate();
    const { contract } = useContract(contractAddress);
    const { data: nft, isLoading: isNFTLoading } = useNFT(contract, tokenId?.toString());
    const [proofImage, setProofImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [status, setStatus] = useState('');
    const [buttonText, setButtonText] = useState('Send proof');
    const [isAgreed, setIsAgreed] = useState(false);
    const [uploadComplete, setUploadComplete] = useState(false);
    const [displayName, setDisplayName] = useState<string>("");
    const [twitterHandle, setTwitterHandle] = useState<string>("");
    const [twitteruser, setTwitteruser] = useState<string>("");
    const [twitterusername, setTwitterusername] = useState<string>("");
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isInReview, setIsInReview] = useState<boolean>(false);


    const clearImage = () => {
        setProofImage(null);
        setImagePreview(null);
        setIsInReview(true);
    };

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


    const { data: ownerAddress, isLoading: isOwnerLoading } = useContractRead(
        contract,
        "ownerOf",
        tokenId ? [tokenId.toString()] : undefined
    );


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
        setButtonText('Uploading...');

        const storageRef = ref(storage, `upgrade-proof/${tokenId}/${proofImage.name}`);
        const uploadTask = uploadBytesResumable(storageRef, proofImage);

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                switch (snapshot.state) {
                    case 'paused':
                        break;
                    case 'running':
                        break;
                }
            },
            (error) => {
                setStatus('Upload failed');
                toast("Upload failed", { type: 'error' });
                setButtonText('Send proof');
            },
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
                    console.log('File available at', downloadURL);
                    try {
                        if (!tokenId) {
                            return;
                        }
                        console.log('Attempting to save URL to Firestore...');
                        const proofDocRef = doc(db, 'upgrade-proof', tokenId.toString());
                        await setDoc(proofDocRef, {
                            address: address,
                            twitter: twitterusername,
                            tokenId: tokenId,
                            agreed: isAgreed ? 'yes' : 'no',
                            imageUrl: downloadURL
                        }, { merge: true });

                        setStatus('Cleanup proof was uploaded and will be reviewed soon.');
                        setButtonText('Uploaded');
                        toast("Cleanup proof was uploaded and will be reviewed soon.", { type: 'success' });
                        setUploadComplete(true);

                        const telegramBotToken = '7415453321:AAHQWPViANAHyqtWfKMzaHXaQeqmcX7c9yc';
                        const chatId = '-1002240752988';
                        const message = `New Cleanup proof was uploaded.\nWallet Address: \`${address}\`\nToken ID: \`${tokenId}\`\nTwitter: \`${twitterusername}\`\nAgree to share: ${isAgreed}\nImage Proof: ${downloadURL}`;

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
                        setStatus('Failed to upload proof try again.');
                    }
                }).catch((error) => {
                    setStatus('Failed to upload proof try again.');
                });
            }
        );
    };


    const checkUserStatus = async (
        address: string,
        setImagePreview: (url: string | null) => void,
        setUploadComplete: (complete: boolean) => void
    ) => {
        if (!tokenId) {
            console.error('tokenId is undefined');
            return;
        }
        try {
            const userDocRef = doc(db, 'upgrade-proof', tokenId);
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

    if (isNFTLoading || isOwnerLoading) {
        return (
            <div className='page-wrap'>

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
                <div className="heading-wrap">
                    <div className="heading-wraps">
                        <h1 className="text-h1 is-hide-mobile">DeCleanup&nbsp;Rewards</h1>
                        <h1 className="is-mob is-hide-mob">De Cleanup Rewards</h1>
                    </div>
                    <div className="nft-card is-active">
                        <label htmlFor="file-upload" className="upload-icon-container">
                            <img
                                src="https://cdn.prod.website-files.com/669132d0a567fe2c543eb7cf/669141790b6d1ddc88cac542_Group%20116.png"
                                loading="lazy"
                                alt="Upload Icon"
                                className="upload-icon"
                            />
                        </label>
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

                        <p className="paragraph-s" style={{ margin: "0" }}>
                            Agree if you allow us to post your<br />
                            pictures on social platforms like X, <br />
                            Discord and Telegram
                        </p>
                    </div>

                </div>
                <div className="button-wrap border">
                    <a className="button is-in-review-button"
                    >
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
            <div className="heading-wrap">
                <div className="heading-wraps">
                    <h1 className="text-h1 is-hide-mobile">DeCleanup&nbsp;Rewards</h1>
                    <h1 className="is-mob is-hide-mob">De Cleanup Rewards</h1>
                </div>
                <div className="nft-card is-active">
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
            {uploadComplete ? (
                <>
                    <div className="nft-wrap">
                        {isInReview ? (
                            <div className="text-wrap">

                            </div>
                        ) : (
                            <div className="text-wrap">
                                <p className="paragraph-s">
                                    After the team review the proof of&nbsp;cleanup, check back your wallet for
                                    the updated NFT.{" "}
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


                        <div className="lvls-wrap is-hide-mob is-in-review hide-mo is-hide-mobile">
                            {nft?.metadata.attributes && (
                                // @ts-ignore
                                nft?.metadata.attributes.slice(3, 7).map((attribute, index) => (
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
                                            className="text-size-l  yellow-text"
                                        >
                                            {attribute.value}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>

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
                </>
            ) : (
                <>
                    <div className="nft-wrap">
                        <div className="confirm-wrap" style={{ flexDirection: "column" }}>
                            <div className="login-container">
                                {isLoggedIn ? (
                                    <h2>Welcome {displayName}!</h2>
                                ) : (
                                    <>
                                        <button onClick={handleLogin} className="twitter-login-button" style={{ fontWeight: "bold" }}>
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

                                            <p className="paragraph-s" style={{ margin: "0" }}>
                                                Agree if you allow us to post your<br />
                                                pictures on social platforms like X, <br />
                                                Discord and Telegram
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="lvls-wrap is-hide-mob hide-mo is-hide-mobile">
                            {nft?.metadata.attributes && (
                                // @ts-ignore
                                nft?.metadata.attributes.slice(3, 7).map((attribute, index) => (
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
                                            className="text-size-l yellow-text"
                                        >
                                            {attribute.value}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>

                    </div>
                    <div className="button-wrap border">
                        <a className="button"
                            type='button'
                            onClick={handleSubmit}
                        >
                            {buttonText}
                        </a>
                    </div>
                </>
            )}
            <div className="footer">
                <img src="https://cdn.prod.website-files.com/669132d0a567fe2c543eb7cf/66914178dbf243a16af65b8a_2024%C2%A9.svg" loading="lazy" alt="" />
                <p className="logo-a">ARBITRUM</p>
            </div>
        </div>
    );
}
