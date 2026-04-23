// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

/**
 * @title WhisperErrors
 * @notice Centralized library for all system-wide errors to optimize gas and improve maintainability.
 */
library WhisperErrors {
    // Access Control Errors
    error NotJournalist(address caller);
    error NotReviewer(address caller);
    error NotAdmin(address caller);
    error Unauthorized(address caller);

    // Case Management Errors
    error CaseNotFound(uint256 caseId);
    error CaseAlreadyClosed(uint256 caseId);
    error OnlyCaseJournalist(address caller, uint256 caseId);

    // Vault/Whisper Errors
    error WhisperNotFound(uint256 caseId, uint256 whisperIndex);
    error PriorityOutOfRange(uint8 priority);

    // Reward Errors
    error RewardAlreadyPaid(uint256 caseId);
    error RewardAlreadyApproved(uint256 caseId);
    error NoRewardConfigured(uint256 caseId);
    error InsufficientBalance(uint256 requested, uint256 available);
}
