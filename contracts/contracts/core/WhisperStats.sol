// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {IWhisperStats, IAccessControlManager} from "../interfaces/IWhispererSystem.sol";
import {WhisperErrors} from "../libraries/WhisperErrors.sol";

/**
 * @title WhisperStats
 * @notice Tracks metrics for the Whisperer platform, providing data for dashboards.
 */
contract WhisperStats is IWhisperStats {
    IAccessControlManager public immutable accessControl;

    struct UserStats {
        uint256 totalWhispers;
        uint256 totalEarned;
        uint256 managedCases;
        uint256 totalBountiesPaid;
        uint256 impactScore;
    }

    mapping(address => UserStats) public userStats;
    uint256 public totalPlatformWhispers;
    uint256 public totalPlatformCases;

    event StatsUpdated(address indexed user, string category, uint256 newValue);

    modifier onlySystem() {
        if (!accessControl.isAdmin(msg.sender)) {
            revert WhisperErrors.NotAdmin(msg.sender);
        }
        _;
    }

    constructor(address _accessControl) {
        accessControl = IAccessControlManager(_accessControl);
    }

    function incrementWhispers(address whisperer) external override onlySystem {
        userStats[whisperer].totalWhispers++;
        totalPlatformWhispers++;
        userStats[whisperer].impactScore += 10; // Simple score increment
        emit StatsUpdated(whisperer, "whispers", userStats[whisperer].totalWhispers);
    }

    function incrementCases(address journalist) external override onlySystem {
        userStats[journalist].managedCases++;
        totalPlatformCases++;
        emit StatsUpdated(journalist, "cases", userStats[journalist].managedCases);
    }

    function addEarnings(address whisperer, uint256 amount) external override onlySystem {
        userStats[whisperer].totalEarned += amount;
        userStats[whisperer].impactScore += (amount / 100); // Higher earnings = Higher impact
        emit StatsUpdated(whisperer, "earnings", userStats[whisperer].totalEarned);
    }

    function addBountiesPaid(address journalist, uint256 amount) external override onlySystem {
        userStats[journalist].totalBountiesPaid += amount;
        emit StatsUpdated(journalist, "bounties", userStats[journalist].totalBountiesPaid);
    }
}
