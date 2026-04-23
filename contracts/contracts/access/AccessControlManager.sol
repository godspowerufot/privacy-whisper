// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IAccessControlManager} from "../interfaces/IWhispererSystem.sol";
import {WhisperErrors} from "../libraries/WhisperErrors.sol";

/**
 * @title AccessControlManager
 * @notice Manages roles and permissions for the Whisperer system.
 */
contract AccessControlManager is AccessControl, IAccessControlManager {
    bytes32 public constant JOURNALIST_ROLE = keccak256("JOURNALIST_ROLE");
    bytes32 public constant REVIEWER_ROLE = keccak256("REVIEWER_ROLE");

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    /**
     * @notice Grants the journalist role to an address.
     * @param user The address to grant the role to.
     */
    function addJournalist(address user) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(JOURNALIST_ROLE, user);
    }

    /**
     * @notice Removes the journalist role from an address.
     * @param user The address to remove the role from.
     */
    function removeJournalist(address user) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(JOURNALIST_ROLE, user);
    }

    /**
     * @notice Checks if an address is a journalist.
     */
    function isJournalist(address user) public view override returns (bool) {
        return hasRole(JOURNALIST_ROLE, user);
    }

    /**
     * @notice Checks if an address is a reviewer.
     */
    function isReviewer(address user) public view override returns (bool) {
        return hasRole(REVIEWER_ROLE, user);
    }

    /**
     * @notice Checks if an address is an admin.
     */
    function isAdmin(address user) public view override returns (bool) {
        return hasRole(DEFAULT_ADMIN_ROLE, user);
    }

    /**
     * @notice Allows a user to self-register as a journalist.
     */
    function registerJournalist() external override {
        _grantRole(JOURNALIST_ROLE, msg.sender);
    }
}
