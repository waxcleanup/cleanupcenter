// src/components/BurnRoom.js
import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { fetchBurnableNFTs, fetchProposals } from '../services/api';
import { fetchUnstakedIncinerators, fetchStakedIncinerators } from '../services/incinerators';
import { stakeIncinerator, burnNFT } from '../services/transactionActions';
import { getBurnRecordsByAssetId } from '../services/burnRecordsApi'; // Updated to use asset ID API
import './BurnRoom.css';
import NFTGrid from './NFTGrid';
import NFTSlots from './NFTSlots';
import IncineratorModal from './IncineratorModal';
import IncineratorDetails from './IncineratorDetails';

const BurnRoom = ({ accountName, onClose }) => {
  const [burnableNFTs, setBurnableNFTs] = useState([]);
  const [slots, setSlots] = useState([null, null, null]); // Incinerator slots start empty
  const [nftSlots, setNftSlots] = useState([null, null, null]); // NFT selection slots
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState([]);
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [stakedIncinerators, setStakedIncinerators] = useState([]);
  const [unstakedIncinerators, setUnstakedIncinerators] = useState([]);
  const [showIncineratorModal, setShowIncineratorModal] = useState(false);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(null);
  const [burnMessage, setBurnMessage] = useState('');
  const [messageVisible, setMessageVisible] = useState(false); // Track message visibility

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [nfts, fetchedProposals, unstaked, staked] = await Promise.all([
        fetchBurnableNFTs(accountName),
        fetchProposals(),
        fetchUnstakedIncinerators(accountName),
        fetchStakedIncinerators(accountName),
      ]);
      console.log('Fetched NFTs:', nfts);  // Debug log to verify multiple NFTs are returned
      setBurnableNFTs(nfts);
      setProposals(fetchedProposals.filter((proposal) => proposal.status === 'approved'));
      setUnstakedIncinerators(unstaked);
      setStakedIncinerators(staked);
      console.log('Data fetched successfully');
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [accountName]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSlotClick = (slotIndex) => {
    setSelectedSlotIndex(slotIndex);
    setShowIncineratorModal(true);
  };

  const handleModalClose = () => {
    setSelectedSlotIndex(null);
    setShowIncineratorModal(false);
  };

  const handleRemoveIncinerator = (slotIndex) => {
    const updatedSlots = [...slots];
    const removedIncinerator = updatedSlots[slotIndex];
    updatedSlots[slotIndex] = null;
    setSlots(updatedSlots);

    if (removedIncinerator) {
      setStakedIncinerators((prev) => [...prev, removedIncinerator]);
    }
  };

  const handleStakedIncineratorSelect = (incinerator) => {
    const updatedSlots = [...slots];
    updatedSlots[selectedSlotIndex] = incinerator;
    setSlots(updatedSlots);

    setStakedIncinerators((prev) =>
      prev.filter((i) => i.asset_id !== incinerator.asset_id)
    );

    setShowIncineratorModal(false);
    setSelectedSlotIndex(null);
  };

  const handleStakeUnstakedIncinerator = async (incinerator) => {
    try {
      if (!accountName) {
        console.error('Account name is missing. User must log in.');
        alert('Please log in to stake an incinerator.');
        return;
      }
      console.log('Staking incinerator:', incinerator);
      const transactionId = await stakeIncinerator(accountName, incinerator);
      console.log('Staked successfully. Transaction ID:', transactionId);
      await fetchData();
    } catch (error) {
      console.error('Error staking incinerator:', error);
    }
  };

  const pollBurnStatus = (assetId, timeout = 6000, interval = 2000) => {
    const startTime = Date.now();

    const poll = async () => {
      try {
        const records = await getBurnRecordsByAssetId(assetId);
        const burnRecord = records.find((record) => record.asset_id === assetId);

        if (burnRecord) {
          if (burnRecord.status === 'burned') {
            showMessage(`Burn successful! Reward: ${burnRecord.cinder_reward}`);
            clearInterval(pollInterval);
            return;
          } else if (burnRecord.status === 'failed') {
            showMessage('Burn failed. Please try again.');
            clearInterval(pollInterval);
            return;
          }
        }

        if (Date.now() - startTime > timeout) {
          showMessage('Burn process timed out. Please check later.');
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('Error polling burn status:', error);
        showMessage('Error fetching burn status.');
        clearInterval(pollInterval);
      }
    };

    const pollInterval = setInterval(poll, interval);
  };

  const showMessage = (message) => {
    setBurnMessage(message);
    setMessageVisible(true);

    // Clear message after 10 seconds
    setTimeout(() => {
      setMessageVisible(false);
      setBurnMessage('');
    }, 10000);
  };

  const handleBurnNFT = async (slotIndex) => {
    try {
      const incinerator = slots[slotIndex];
      const nft = nftSlots[slotIndex];

      if (!nft || !incinerator) {
        alert('Please assign both an NFT and an incinerator to the slot.');
        return;
      }

      console.log('Burning NFT:', { nft, incinerator });
      showMessage('Burn process initiated...');
      await burnNFT(accountName, nft, incinerator);

      pollBurnStatus(nft.asset_id); // Poll based on asset ID

      await fetchData();

      const updatedNFTSlots = [...nftSlots];
      updatedNFTSlots[slotIndex] = null;
      setNftSlots(updatedNFTSlots);
    } catch (error) {
      console.error('Error during burn transaction:', error);
      showMessage('Failed to burn NFT. Please try again later.');
    }
  };

  return (
    <div className="burn-room">
      <button className="close-button" onClick={onClose}>
        &times;
      </button>
      <h2>Burn Room</h2>

      {loading && <p>Loading...</p>}

      <NFTGrid
        burnableNFTs={burnableNFTs}
        proposals={proposals}
        selectedNFT={selectedNFT}
        onNFTClick={(nft) => setSelectedNFT(nft)}
        onAssignNFT={(nft, index) => {
          const updatedSlots = [...nftSlots];
          updatedSlots[index] = nft;
          setNftSlots(updatedSlots);
        }}
        nftSlots={nftSlots}
      />

      {messageVisible && (
        <div className="burn-message">
          {burnMessage}
        </div>
      )}

      <div className="selected-nfts-container">
        <h3>Selected NFTs to Burn</h3>
        <NFTSlots
          nftSlots={nftSlots}
          slots={slots}
          onBurn={handleBurnNFT}
        />
      </div>

      <h3>Incinerator Slots</h3>
      <div className="incinerator-grid">
        {slots.map((slot, index) => (
          <div
            key={index}
            className={`incinerator-card ${slot ? '' : 'empty-incinerator'}`}
            onClick={() => handleSlotClick(index)}
          >
            {slot ? (
              <IncineratorDetails
                incinerator={slot}
                fetchIncineratorData={fetchData}
                onRepair={() => console.log('Repair durability triggered')}
                onRemove={() => handleRemoveIncinerator(index)}
                showButtons
              />
            ) : (
              <p>Empty Slot</p>
            )}
          </div>
        ))}
      </div>

      {showIncineratorModal && (
        <IncineratorModal
          accountName={accountName}
          stakedIncinerators={stakedIncinerators}
          unstakedIncinerators={unstakedIncinerators}
          assignedSlots={slots}
          onIncineratorSelect={handleStakedIncineratorSelect}
          onUnstakedStake={handleStakeUnstakedIncinerator}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

BurnRoom.propTypes = {
  accountName: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default BurnRoom;
