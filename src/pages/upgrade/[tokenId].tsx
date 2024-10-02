import { ConnectWallet, Web3Button, useContract, useNFT, useSDK, useAddress } from "@thirdweb-dev/react";
import { useEffect, useState } from "react";
import {
    contractConst,
    admin1,
    admin2,
    admin3,
} from "../../consts/parameters";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import "../../styles/globals.css?inline";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from '../../lib/firebase';

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

export default function Upgrade() {
    const urlParams = new URL(window.location.toString()).searchParams;
    const contractAddress = urlParams.get("contract") || contractConst || "";
    const { tokenId } = useParams<{ tokenId: string }>();
    const walletAddress = useAddress();
    const address = walletAddress?.toLowerCase();
    const navigate = useNavigate();
    const sdk = useSDK();
    const [status, setStatus] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);
    const { contract } = useContract(contractAddress);

    const [ipfslevel, setIpfslevel] = useState("");
    const {
        data: nft,
        isLoading: isNFTLoading,
    } = useNFT(contract, tokenId?.toString());

    useEffect(() => {
        if (nft && nft.metadata && Array.isArray(nft.metadata.attributes)) {
            const impactAttribute = nft.metadata.attributes.find(attribute => attribute.trait_type === "Impact Value") as Attribute | undefined;
            let impactValue = impactAttribute ? parseInt(impactAttribute.value, 10) : 0;

            let newLevel = "";
            if (impactValue === 1) {
                newLevel = "ipfs://Qmbe5SwCqeeFv3UGLSEbaTyWX6u4zqkArNdws8wCjxT1G8";
            } else if (impactValue === 2) {
                newLevel = "ipfs://QmbVAWUm1aNxhHYu3AaGymXgDFc4FP93qB3zW5NFxCN1jY";
            } else if (impactValue === 3) {
                newLevel = "ipfs://QmYxPYqFiYbL6Zx3ouPKjUUkdpu49Ce4x79dwnM9GxLUek";
            } else if (impactValue === 4) {
                newLevel = "ipfs://QmedByuVBN3EZGmCxU2zXGne4P2AMZo36s4QhDztkEAb8b";
            } else if (impactValue === 5) {
                newLevel = "ipfs://QmYsyXPhjkwLCtcZ4UvwZAVviSxuJFJ89uTkBM98wHyPho";
            } else if (impactValue === 6) {
                newLevel = "ipfs://QmdzAhQJWSpbhz2juJXetoG6TsynvqoeVL9ywxHKGCiur8";
            } else if (impactValue === 7) {
                newLevel = "ipfs://QmPNQy9575mLp2briyQcP165hzs5xMYS4EfPBLZ3Btf7h2";
            } else if (impactValue === 8) {
                newLevel = "ipfs://QmNWSM2dLYTwnEF6eNrBY6AiY6mizDZWA7BEMSXBpZLb5a";
            } else if (impactValue === 9) {
                newLevel = "ipfs://Qmc4JWtnL2Ta8J8PPsC5bNQPwDYaWegqF7gqJfePnjs1sP";
            } else if (impactValue === 10) {
                newLevel = "ipfs://Qmc4JWtnL2Ta8J8PPsC5bNQPwDYaWegqF7gqJfePnjs1sP";
            }
            setIpfslevel(newLevel);
        }
    }, [nft]);

    const newUri = `${ipfslevel}/${tokenId}.json`;
    const adminWallets = [admin1, admin2, admin3].map(wallet => wallet.toLowerCase());

    useEffect(() => {
        if (address && adminWallets.includes(address.toLowerCase())) {
            setIsAdmin(true);
        }
    }, [address]);

    const removeproof = async () => {
        if (!tokenId) {
            toast('try again', { type: 'warning' });
            return;
        }
        try {
            const userDocRef = doc(db, 'upgrade-proof', tokenId.toString());
            await deleteDoc(userDocRef);
        } catch (error) {
            toast('Failed to delete proof', { type: 'error' });
        }
    };

    if (isNFTLoading) {
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

                <div className="nft-wrap">

                    <div className="text-wrap">
                        <p className="paragraph-s"> </p>
                    </div>

                    <div className="nft-card">
                        <img
                            src=""
                            loading="lazy"
                            alt=""
                            className="nft-img"
                        />
                    </div>

                    <div className="lvls-wrap is-hide-mob is-in-review hide-mo">
                        <div
                            id="w-node-_3c7c7431-5b3f-3ca3-f859-7a5558a3da1b-51c2bcea"
                            className="lvl"
                        >
                            <p
                                id="w-node-_6e9087bb-ca87-3a26-c99f-2796d17c4d61-51c2bcea"
                                className="text-size-l"
                            >
                                Rarity
                            </p>
                            <p
                                id="w-node-_3be52719-ff4c-2d23-0f67-8d9151dac7ce-51c2bcea"
                                className="text-size-l  yellow-text"
                            >
                                0
                            </p>

                        </div>

                        <div
                            id="w-node-_3c7c7431-5b3f-3ca3-f859-7a5558a3da1b-51c2bcea"
                            className="lvl"
                        >
                            <p
                                id="w-node-_6e9087bb-ca87-3a26-c99f-2796d17c4d61-51c2bcea"
                                className="text-size-l"
                            >
                                Impact Value
                            </p>
                            <p
                                id="w-node-_3be52719-ff4c-2d23-0f67-8d9151dac7ce-51c2bcea"
                                className="text-size-l  yellow-text"
                            >
                                0
                            </p>

                        </div>

                        <div
                            id="w-node-_3c7c7431-5b3f-3ca3-f859-7a5558a3da1b-51c2bcea"
                            className="lvl"
                        >
                            <p
                                id="w-node-_6e9087bb-ca87-3a26-c99f-2796d17c4d61-51c2bcea"
                                className="text-size-l"
                            >
                                $DCU
                            </p>
                            <p
                                id="w-node-_3be52719-ff4c-2d23-0f67-8d9151dac7ce-51c2bcea"
                                className="text-size-l  yellow-text"
                            >
                                0
                            </p>

                        </div>

                        <div
                            id="w-node-_3c7c7431-5b3f-3ca3-f859-7a5558a3da1b-51c2bcea"
                            className="lvl"
                        >
                            <p
                                id="w-node-_6e9087bb-ca87-3a26-c99f-2796d17c4d61-51c2bcea"
                                className="text-size-l"
                            >
                                Level
                            </p>
                            <p
                                id="w-node-_3be52719-ff4c-2d23-0f67-8d9151dac7ce-51c2bcea"
                                className="text-size-l  yellow-text"
                            >
                                0
                            </p>

                        </div>

                    </div>
                </div>


                <div className="button-wrap border">
                    <a className="loadbutton"
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

                <div className="heading-wraps">
                    <h1 className="text-h1 is-hide-mobile">DeCleanup&nbsp;Rewards</h1>
                    <h1 className="is-mob is-hide-mob">De Cleanup Rewards</h1>
                </div>

                <div className="admin">
                    <h1 className="panel-title">Only for admin</h1>
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
            <div className="heading-wraps">
                <h1 className="text-h1 is-hide-mobile">DeCleanup&nbsp;Rewards</h1>
                <h1 className="is-mob is-hide-mob">De Cleanup Rewards</h1>
            </div>

            <div className="nft-wrap">

                <div className="text-wrap">
                    <p className="paragraph-s"> </p>
                </div>

                <div className="nft-card">
                    <img
                        src={`${nft?.metadata.image}`}
                        loading="lazy"
                        alt=""
                        className="nft-img"
                    />
                </div>

                <div className="lvls-wrap is-hide-mob hide-mo  is-hide-mobile">
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
                <Web3Button className="button"
                    contractAddress={contractConst}
                    action={(contract) => contract.call("setTokenURI", [tokenId!.toString(), newUri])}
                    onError={(err) => {
                        console.error(err);
                        console.log({ err });
                        toast("Sorry, something went wrong please try again.", { type: 'error' });
                    }}
                    onSuccess={() => {
                        toast("Congrats! Your Upgrade was successful!", { type: 'success' });
                        removeproof();
                    }}
                    theme={"light"}
                    type={"button"}
                >
                    Upgrade
                </Web3Button>
            </div>

            <div className="footer">
                <img src="https://cdn.prod.website-files.com/669132d0a567fe2c543eb7cf/66914178dbf243a16af65b8a_2024%C2%A9.svg" loading="lazy" alt="" />
                <p className="logo-a">ARBITRUM</p>
            </div>
        </div>
    );
};