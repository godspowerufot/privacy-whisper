// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {ebytes32, euint8, euint256, eaddress, externalEuint8, externalEbytes32, externalEuint256, externalEaddress} from "@fhevm/solidity/lib/FHE.sol";

interface IAccessControlManager {
    function isJournalist(address user) external view returns (bool);
    function isReviewer(address user) external view returns (bool);
    function isAdmin(address user) external view returns (bool);
    function registerJournalist() external;
}

interface IWhisperCaseManager {
    struct Case {
        uint256 caseId;
        address journalist;
        euint256 encryptedJournalistName;
        string title;
        string description;
        bool isOpen;
        uint256 createdAt;
        uint256 whisperCount;
    }

    function createCase(
        string calldata title, 
        string calldata description, 
        externalEuint256 encryptedName,
        bytes calldata inputProof
    ) external returns (uint256);
    
    function closeCase(uint256 caseId) external;
    function incrementWhisperCount(uint256 caseId) external;
    function getCase(uint256 caseId) external view returns (Case memory);
}

interface IWhisperVault {
    struct Whisper {
        uint256 caseId;
        euint256 encryptedMessage;
        euint256 encryptedFileHash;
        eaddress encryptedSubmitter;
        euint8 priority;
        uint256 timestamp;
    }

    function submitWhisper(
        uint256 caseId,
        externalEuint256 encryptedMessage,
        externalEuint256 encryptedFileHash,
        externalEaddress encryptedSubmitter,
        externalEuint8 priority,
        bytes calldata inputProof
    ) external;

    function getWhisperCount(uint256 caseId) external view returns (uint256);
}

interface IRewardManager {
    struct Reward {
        uint256 caseId;
        euint256 encryptedAmount;
        bool approved;
        bool paid;
    }

    function approveReward(
        uint256 caseId,
        externalEuint256 encryptedAmount,
        bytes calldata inputProof
    ) external;

    function distributeReward(uint256 caseId, address whistleblower) external;
}

interface IWhisperStats {
    function incrementWhispers(address whisperer) external;
    function incrementCases(address journalist) external;
    function addEarnings(address whisperer, uint256 amount) external;
    function addBountiesPaid(address journalist, uint256 amount) external;
}
