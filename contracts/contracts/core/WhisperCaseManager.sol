// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {FHE, euint256, externalEuint256} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {IWhisperCaseManager, IAccessControlManager, IWhisperStats} from "../interfaces/IWhispererSystem.sol";
import {WhisperErrors} from "../libraries/WhisperErrors.sol";

/**
 * @title WhisperCaseManager
 * @notice Handles the creation and lifecycle of investigative cases with anonymity support.
 */
contract WhisperCaseManager is ZamaEthereumConfig, IWhisperCaseManager {
    IAccessControlManager public immutable accessControl;
    IWhisperStats public stats;

    uint256 public nextCaseId;
    mapping(uint256 => Case) public cases;
    address public vault;

    event CaseCreated(uint256 indexed caseId, address indexed journalist, string title);
    event CaseClosed(uint256 indexed caseId);

    modifier onlyJournalist() {
        if (!accessControl.isJournalist(msg.sender)) revert WhisperErrors.NotJournalist(msg.sender);
        _;
    }

    constructor(address _accessControl) {
        accessControl = IAccessControlManager(_accessControl);
        nextCaseId = 1;
    }

    function setVault(address _vault) external {
        if (!accessControl.isAdmin(msg.sender)) revert WhisperErrors.NotAdmin(msg.sender);
        vault = _vault;
    }

    function setStats(address _stats) external {
        if (!accessControl.isAdmin(msg.sender)) revert WhisperErrors.NotAdmin(msg.sender);
        stats = IWhisperStats(_stats);
    }

    /**
     * @notice Creates a new investigative case.
     */
    function createCase(
        string calldata title,
        string calldata description,
        externalEuint256 encryptedName,
        bytes calldata inputProof
    ) external override onlyJournalist returns (uint256) {
        uint256 caseId = nextCaseId++;

        euint256 nameEnc = FHE.fromExternal(encryptedName, inputProof);
        FHE.allowThis(nameEnc);

        cases[caseId] = Case({
            caseId: caseId,
            journalist: msg.sender,
            encryptedJournalistName: nameEnc,
            title: title,
            description: description,
            isOpen: true,
            createdAt: block.timestamp,
            whisperCount: 0
        });

        // Update Stats
        if (address(stats) != address(0)) {
            stats.incrementCases(msg.sender);
        }

        emit CaseCreated(caseId, msg.sender, title);
        return caseId;
    }

    // ... (rest of the functions remain the same or are overridden)

    function closeCase(uint256 caseId) external override {
        Case storage c = cases[caseId];
        if (c.caseId == 0) revert WhisperErrors.CaseNotFound(caseId);
        if (c.journalist != msg.sender && !accessControl.isAdmin(msg.sender)) {
            revert WhisperErrors.OnlyCaseJournalist(msg.sender, caseId);
        }
        c.isOpen = false;
        emit CaseClosed(caseId);
    }

    function incrementWhisperCount(uint256 caseId) external override {
        if (msg.sender != vault) revert WhisperErrors.Unauthorized(msg.sender);
        Case storage c = cases[caseId];
        if (c.caseId == 0) revert WhisperErrors.CaseNotFound(caseId);
        c.whisperCount++;
    }

    function getCase(uint256 caseId) external view override returns (Case memory) {
        Case memory c = cases[caseId];
        if (c.caseId == 0) revert WhisperErrors.CaseNotFound(caseId);
        return c;
    }
}
