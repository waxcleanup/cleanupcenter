import React, { useState, useEffect } from 'react';
import './ProposalModal.css';

function ProposalModal({
  templateId,
  proposalType = 'NFT Burn',
  initialTrashFee = '',
  initialCinderReward = '',
  setTrashFee,
  setCinderReward,
  handleProposalSubmit,
  onClose,
}) {
  const [errorMessage, setErrorMessage] = useState('');

  // Initialize local state or fallback to empty strings
  const [localTrashFee, setLocalTrashFee] = useState(initialTrashFee || '');
  const [localCinderReward, setLocalCinderReward] = useState(initialCinderReward || '');

  // Synchronize props if they change
  useEffect(() => {
    setLocalTrashFee(initialTrashFee || '');
    setLocalCinderReward(initialCinderReward || '');
  }, [initialTrashFee, initialCinderReward]);

  // Dynamic validation for asset decimals
  const isValidAsset = (value, decimals) => {
    const regex = new RegExp(`^(\\d+(\\.\\d{1,${decimals}})?)$`);
    return regex.test(value);
  };

  // Update Trash Fee with validation
  const handleTrashFeeChange = (e) => {
    const value = e.target.value;
    if (isValidAsset(value, 3) || value === '') {
      setLocalTrashFee(value);
      setTrashFee(value); // Update parent state
      setErrorMessage('');
    } else {
      setErrorMessage('Invalid format for Trash Fee. Use up to 3 decimals.');
    }
  };

  // Update Cinder Reward with validation
  const handleCinderRewardChange = (e) => {
    const value = e.target.value;
    if (isValidAsset(value, 6) || value === '') {
      setLocalCinderReward(value);
      setCinderReward(value); // Update parent state
      setErrorMessage('');
    } else {
      setErrorMessage('Invalid format for Cinder Reward. Use up to 6 decimals.');
    }
  };

  const onSubmit = () => {
    if (!localTrashFee || !localCinderReward) {
      setErrorMessage('Please enter values for Trash Fee and Cinder Reward.');
      return;
    }

    const trashFeeValue = parseFloat(localTrashFee);
    const cinderRewardValue = parseFloat(localCinderReward);

    if (trashFeeValue < 10) {
      setErrorMessage('Trash Fee must be at least 10 TRASH.');
      return;
    }

    if (cinderRewardValue > 5000) {
      setErrorMessage('Cinder Reward must not exceed 5,000.000000 CINDER.');
      return;
    }

    const formattedTrashFee = trashFeeValue.toFixed(3);
    const formattedCinderReward = cinderRewardValue.toFixed(6);

    setTrashFee(`${formattedTrashFee} TRASH`);
    setCinderReward(`${formattedCinderReward} CINDER`);

    handleProposalSubmit();
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Create a Proposal</h3>
        <p>Template ID: <strong>{templateId}</strong></p>
        <p className="proposal-fee-note">Note: A fee of 1,000 TRASH is required to create this proposal.</p>
        <p className="proposal-note">The TRASH fee for burning an NFT must be at least 10 TRASH.</p>
        <p className="proposal-note">The CINDER reward must not exceed the cap of 5,000.000000 CINDER.</p>

        <div className="modal-field">
          <label>Proposal Type:</label>
          <input type="text" value={proposalType} readOnly />
        </div>

        <div className="modal-field">
          <label>Trash Fee:</label>
          <input
            type="text"
            value={localTrashFee}
            onChange={handleTrashFeeChange}
            placeholder="Enter Trash Fee"
          />
        </div>

        <div className="modal-field">
          <label>Cinder Reward:</label>
          <input
            type="text"
            value={localCinderReward}
            onChange={handleCinderRewardChange}
            placeholder="Enter Cinder Reward"
          />
        </div>

        {errorMessage && <p className="error-message">{errorMessage}</p>}

        <button
          onClick={onSubmit}
          className="submit"
          disabled={!localTrashFee || !localCinderReward || !!errorMessage}
        >
          Submit Proposal
        </button>

        <button onClick={onClose} className="close">Close</button>
      </div>
    </div>
  );
}

export default ProposalModal;
