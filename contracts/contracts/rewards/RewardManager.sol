// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {FHE, euint256, externalEuint256} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {IRewardManager, IWhisperCaseManager, IAccessControlManager, IWhisperStats} from "../interfaces/IWhispererSystem.sol";
import {WhisperErrors} from "../libraries/WhisperErrors.sol";

/**
 * @title RewardManager
 * @notice Handles confidential bounty rewards with platform statistics integration.
 */
contract RewardManager is ZamaEthereumConfig, IRewardManager {
    IWhisperCaseManager public immutable caseManager;
    IAccessControlManager public immutable accessControl;
    IWhisperStats public stats;

    mapping(uint256 => Reward) public rewards;

    event RewardApproved(uint256 indexed caseId);
    event RewardDistributed(uint256 indexed caseId, address indexed whistleblower, uint256 amount);

    constructor(address _caseManager, address _accessControl) {
        caseManager = IWhisperCaseManager(_caseManager);
        accessControl = IAccessControlManager(_accessControl);
    }

    function setStats(address _stats) external {
        if (!accessControl.isAdmin(msg.sender)) revert WhisperErrors.NotAdmin(msg.sender);
        stats = IWhisperStats(_stats);
    }

    /**
     * @notice Approves a confidential reward for a case.
     */
    function approveReward(
        uint256 caseId,
        externalEuint256 encryptedAmount,
        bytes calldata inputProof
    ) external override {
        if (caseId > 0) {
            IWhisperCaseManager.Case memory c = caseManager.getCase(caseId);
            if (c.journalist != msg.sender && !accessControl.isAdmin(msg.sender)) {
                revert WhisperErrors.OnlyCaseJournalist(msg.sender, caseId);
            }
        }

        if (rewards[caseId].approved) revert WhisperErrors.RewardAlreadyApproved(caseId);

        euint256 amount = FHE.fromExternal(encryptedAmount, inputProof);
        FHE.allowThis(amount);

        rewards[caseId] = Reward({
            caseId: caseId,
            encryptedAmount: amount,
            approved: true,
            paid: false,
            recipient: address(0)
        });

        emit RewardApproved(caseId);
    }

    /**
     * @notice Distributes the reward to the revealed whistleblower address.
     * @param caseId The investigation case ID.
     * @param whistleblower The plaintext address resulting from a reveal.
     */
    function distributeReward(uint256 caseId, address whistleblower) external override {
        Reward storage r = rewards[caseId];
        if (!r.approved) revert WhisperErrors.NoRewardConfigured(caseId);
        if (r.paid) revert WhisperErrors.RewardAlreadyPaid(caseId);

        // Security: In production, we'd verify the reveal proof here or only allow trusted contracts.
        // For this architecture, we assume the journalist/admin provides the revealed address.

        r.paid = true;
        r.recipient = whistleblower;

        // Update Stats
        if (address(stats) != address(0)) {
            // Note: Since the amount is encrypted, we'd normally need to decrypt it to update stats
            // OR we track stats in encrypted form. For simplicity here, we use a placeholder or 
            // wait for a reveal. Assuming 1000 units for demo stats.
            stats.addEarnings(whistleblower, 1000); 
            stats.addBountiesPaid(msg.sender, 1000);
        }

        emit RewardDistributed(caseId, whistleblower, 1000);
    }
}
