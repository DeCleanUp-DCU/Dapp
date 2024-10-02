import { NFT, ThirdwebNftMedia } from "@thirdweb-dev/react";
import styles from "../styles/Home.module.css";
import { Link } from "react-router-dom";

type NFTCardProps = {
    nft: NFT;
};

export const NFTCard = ({ nft }: NFTCardProps) => {
    return (
        <div >
            <ThirdwebNftMedia
                metadata={nft.metadata}
            />
            <div className="lvls-wrap is-hide-mob">
                {nft.metadata.attributes && (
                    // @ts-ignore
                    nft.metadata.attributes.slice(3, 7).map((attribute, index) => (
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
                                className="text-size-l"
                            >
                                {attribute.value}
                            </p>
                        </div>
                    ))
                )}
            </div>
            <div className="button-wrap border">
                <Link className="button" to={`/proof/${nft.metadata.id}`}>
                    Upgrade
                </Link>
            </div>
        </div>
    );
};