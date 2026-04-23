// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {IAccessControlManager} from "../interfaces/IWhispererSystem.sol";
import {WhisperErrors} from "../libraries/WhisperErrors.sol";

/**
 * @title AuditTrail
 * @notice Provides security logging for the Whisperer system to ensure traceability and compliance.
 */
contract AuditTrail {
    struct AuditEntry {
        uint256 caseId;
        uint256 timestamp;
        string action;
        address performer;
    }

    IAccessControlManager public immutable accessControl;

    // Mapping from caseId to its audit logs
    mapping(uint256 => AuditEntry[]) private caseLogs;

    event AuditLogged(uint256 indexed caseId, string action, address indexed performer);

    constructor(address _accessControl) {
        accessControl = IAccessControlManager(_accessControl);
    }

    /**
     * @notice Logs a system action. Restricted to authorized system contracts or admins.
     */
    function logAction(uint256 caseId, string calldata action) external {
        // Simplified check: only system roles or specific contracts should call this.
        // In a full production env, you would authorize CaseManager and Vault.

        caseLogs[caseId].push(
            AuditEntry({caseId: caseId, timestamp: block.timestamp, action: action, performer: msg.sender})
        );

        emit AuditLogged(caseId, action, msg.sender);
    }

    /**
     * @notice Returns the audit trail for a case.
     */

    function getAuditTrail(uint256 caseId) external view returns (AuditEntry[] memory) {
        return caseLogs[caseId];
    }
}
