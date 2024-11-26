import React from 'react';
import './BurnRoom.css';

const NFTSlots = ({ nftSlots = [null, null, null], slots, onBurn }) => (
  <div className="nft-slots">
    {nftSlots.map((nft, index) => (
      <div key={index} className="nft-slot">
        {nft ? (
          <>
            <img
              src={`https://ipfs.io/ipfs/${nft.img}`}
              alt={nft.template_name || 'Unnamed NFT'}
              className="nft-image"
            />
            <p className="nft-name">{nft.template_name || 'Unnamed NFT'}</p>
            <p className="asset-id">Asset ID: {nft.asset_id}</p>
            {slots[index] ? (
              <button
                className="burn-button"
                onClick={() => onBurn(index)} // Pass the slot index instead of NFT and incinerator
              >
                Burn NFT
              </button>
            ) : (
              <p className="warning-text">Assign an incinerator to burn</p>
            )}
          </>
        ) : (
          <p className="empty-slot-text">Empty Slot</p>
        )}
      </div>
    ))}
  </div>
);

export default NFTSlots;
