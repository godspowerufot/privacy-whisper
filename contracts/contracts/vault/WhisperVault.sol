// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {FHE, euint8, euint32, euint256, eaddress, externalEuint8, externalEuint256, externalEaddress} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {IWhisperVault, IWhisperCaseManager, IAccessControlManager, IWhisperStats} from "../interfaces/IWhispererSystem.sol";
import {WhisperErrors} from "../libraries/WhisperErrors.sol";

/**
 * @title WhisperVault
 * @notice Stores confidential tips with encrypted submitter protection.
 */
contract WhisperVault is ZamaEthereumConfig, IWhisperVault {
    IWhisperCaseManager public immutable caseManager;
    IAccessControlManager public immutable accessControl;
    IWhisperStats public stats;

    struct GlobalRef {
        uint256 caseId;
        uint256 index;
    }

    mapping(uint256 => Whisper[]) private caseWhispers;
    GlobalRef[] private allWhispers;

    event WhisperSubmitted(uint256 indexed caseId, uint256 whisperIndex);
    event WhisperRevealRequested(uint256 indexed caseId, uint256 whisperIndex, bytes32 messageHandle);
    event SubmitterRevealRequested(uint256 indexed caseId, uint256 whisperIndex, bytes32 submitterHandle);

    constructor(address _caseManager, address _accessControl) {
        caseManager = IWhisperCaseManager(_caseManager);
        accessControl = IAccessControlManager(_accessControl);
    }

    function setStats(address _stats) external {
        if (!accessControl.isAdmin(msg.sender)) revert WhisperErrors.NotAdmin(msg.sender);
        stats = IWhisperStats(_stats);
    }

    /**
     * @notice Submits an encrypted whisper for a case or for the platform (caseId 0).
     */
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
    ) external override {
        // Validation: If caseId > 0, case must exist and be open
        if (caseId > 0) {
            IWhisperCaseManager.Case memory c = caseManager.getCase(caseId);
            if (!c.isOpen) revert WhisperErrors.CaseAlreadyClosed(caseId);
            caseManager.incrementWhisperCount(caseId);
        }

        euint256 msgEnc = FHE.fromExternal(encryptedMessage, inputProof);
        euint256 hashEnc = FHE.fromExternal(encryptedFileHash, inputProof);
        eaddress submitterEnc = FHE.fromExternal(encryptedSubmitter, inputProof);
        euint8 priorityEnc = FHE.fromExternal(priority, inputProof);

        FHE.allowThis(msgEnc);
        FHE.allowThis(hashEnc);
        FHE.allowThis(submitterEnc);
        FHE.allowThis(priorityEnc);

        // Add to case-specific mapping
        uint256 whisperIndex = caseWhispers[caseId].length;
        Whisper storage newWhisper = caseWhispers[caseId].push();
        
        // Populate base data
        newWhisper.caseId = caseId;
        newWhisper.encryptedMessage = msgEnc;
        newWhisper.encryptedFileHash = hashEnc;
        newWhisper.encryptedSubmitter = submitterEnc;
        newWhisper.priority = priorityEnc;
        newWhisper.status = status;
        newWhisper.isUrgent = isUrgent;
        newWhisper.timestamp = block.timestamp;
        newWhisper.senderHash = keccak256(abi.encodePacked(msg.sender));
        
        for (uint i = 0; i < attachments.length; i++) {
            newWhisper.attachments.push(attachments[i]);
        }

        // Add to platform-wide list for global feed (as a reference)
        allWhispers.push(GlobalRef({
            caseId: caseId,
            index: whisperIndex
        }));

        // Update Stats
        if (address(stats) != address(0)) {
            stats.incrementWhispers(msg.sender);
        }

        emit WhisperSubmitted(caseId, whisperIndex);
    }

    /**
     * @notice Requests a reveal of a whisper's content.
     */
    function requestWhisperReveal(uint256 caseId, uint256 whisperIndex) external {
        if (caseId > 0) {
            IWhisperCaseManager.Case memory c = caseManager.getCase(caseId);
            if (c.journalist != msg.sender && !accessControl.isAdmin(msg.sender)) {
                revert WhisperErrors.OnlyCaseJournalist(msg.sender, caseId);
            }
        }

        Whisper storage w = caseWhispers[caseId][whisperIndex];
        
        // Create new publicly decryptable handle
        euint256 revealed = FHE.makePubliclyDecryptable(w.encryptedMessage);
        
        // Store new handle back in storage
        w.encryptedMessage = revealed;
        w.status = "reviewed"; // Automatically update status

        // Grant permissions on the NEW handle
        FHE.allowThis(revealed);
        FHE.allow(revealed, msg.sender);

        emit WhisperRevealRequested(caseId, whisperIndex, FHE.toBytes32(revealed));
    }

    /**
     * @notice Requests a reveal of the whistleblower's address (for payment).
     */
    function requestSubmitterReveal(uint256 caseId, uint256 whisperIndex) external {
        if (caseId > 0) {
            IWhisperCaseManager.Case memory c = caseManager.getCase(caseId);
            if (c.journalist != msg.sender && !accessControl.isAdmin(msg.sender)) {
                revert WhisperErrors.OnlyCaseJournalist(msg.sender, caseId);
            }
        } else {
            if (!accessControl.isAdmin(msg.sender)) revert WhisperErrors.NotAdmin(msg.sender);
        }

        Whisper storage w = caseWhispers[caseId][whisperIndex];
        
        // Create new publicly decryptable handle
        eaddress revealed = FHE.makePubliclyDecryptable(w.encryptedSubmitter);
        
        // Store new handle back in storage
        w.encryptedSubmitter = revealed;

        // Grant permissions on the NEW handle
        FHE.allowThis(revealed);
        FHE.allow(revealed, msg.sender);

        emit SubmitterRevealRequested(caseId, whisperIndex, FHE.toBytes32(revealed));
    }

    function getWhisperCount(uint256 caseId) external view override returns (uint256) {
        return caseWhispers[caseId].length;
    }

    function getWhisper(uint256 caseId, uint256 whisperIndex) external view override returns (Whisper memory) {
        return caseWhispers[caseId][whisperIndex];
    }

    function getAllWhispersCount() external view override returns (uint256) {
        return allWhispers.length;
    }

    function getGlobalWhisper(uint256 index) external view override returns (Whisper memory) {
        GlobalRef memory ref = allWhispers[index];
        return caseWhispers[ref.caseId][ref.index];
    }
}
