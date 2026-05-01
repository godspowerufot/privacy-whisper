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
        string description; // background
        string whisperBrief;
        string status;      // e.g. "urgent", "open", "reviewed"
        string priority;    // e.g. "High", "Medium", "Low"
        string[] tags;
        uint256 prizePool;  // in Wei
        bool isOpen;
        uint256 createdAt;
        uint256 whisperCount;
    }

    function createCase(
        string calldata title, 
        string calldata description, 
        string calldata whisperBrief,
        string calldata status,
        string calldata priority,
        string[] calldata tags,
        externalEuint256 encryptedName,
        bytes calldata inputProof
    ) external payable returns (uint256);
    
    function closeCase(uint256 caseId) external;
    function incrementWhisperCount(uint256 caseId) external;
    function getCase(uint256 caseId) external view returns (Case memory);
}

interface IWhisperVault {
    struct Attachment {
        string name;
        string fileType;
        string size;
    }

    struct Whisper {
        uint256 caseId;
        euint256 encryptedMessage;
        euint256 encryptedFileHash;
        eaddress encryptedSubmitter;
        euint8 priority;
        string status;      // e.g. "unread", "reviewed"
        bool isUrgent;
        Attachment[] attachments;
        uint256 timestamp;
        bytes32 senderHash;
    }

    function submitWhisper(
        uint256 caseId,
        string calldata status,
        bool isUrgent,
        Attachment[] calldata attachments,
        externalEuint256 encryptedMessage,
        externalEuint256 encryptedFileHash,
        externalEaddress encryptedSubmitter,
        externalEuint8 priority,
        bytes calldata inputProof
    ) external;

    function getWhisperCount(uint256 caseId) external view returns (uint256);
    function getWhisper(uint256 caseId, uint256 whisperIndex) external view returns (Whisper memory);
    function getAllWhispersCount() external view returns (uint256);
    function getGlobalWhisper(uint256 index) external view returns (Whisper memory);
}

interface IRewardManager {
    struct Reward {
        uint256 caseId;
        euint256 encryptedAmount;
        bool approved;
        bool paid;
        address recipient;
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
