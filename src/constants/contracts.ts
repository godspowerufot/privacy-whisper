import AuditTrailABI from '../../abi/AuditTrail.json';
import AccessControlManagerABI from '../../abi/AccessControlManager.json';
import WhisperCaseManagerABI from '../../abi/WhisperCaseManager.json';
import WhisperStatsABI from '../../abi/WhisperStats.json';
import WhisperVaultABI from '../../abi/WhisperVault.json';
import RewardManagerABI from '../../abi/RewardManager.json';

export const ADDRESSES = {
    AccessControlManager:   '0x86C9C9C183B9856E38F6e321509E5DFdC5b1Bcad',
    WhisperCaseManager:   '0x67F370Df17370FB1e26Fb5aEEE16E51Be67D4f0A',
    AuditTrail:   '0xF3a1881F4dCC925b1fEc73973217E399b11597A3',
    WhisperStats:   '0x4cC637F1054926F54eb348eC6CBFaf2790E372cb',
    WhisperVault:   '0x8A39730C6260aE1E78E7F9b575A65a6a7501cedD',
    RewardManager:   '0x9c50A63A3c0EA47a371c73B53A6A1F3C2F599Ce7',
} as const;

export const ABIS = {
    AccessControlManager: AccessControlManagerABI.abi,
    WhisperCaseManager: WhisperCaseManagerABI.abi,
    AuditTrail: AuditTrailABI.abi,
    WhisperStats: WhisperStatsABI.abi,
    WhisperVault: WhisperVaultABI.abi,
    RewardManager: RewardManagerABI.abi,
} as const;

export const CONTRACT_CONFIGS = {
    AccessControlManager: {
        address: ADDRESSES.AccessControlManager,
        abi: ABIS.AccessControlManager,
    },
    WhisperCaseManager: {
        address: ADDRESSES.WhisperCaseManager,
        abi: ABIS.WhisperCaseManager,
    },
    AuditTrail: {
        address: ADDRESSES.AuditTrail,
        abi: ABIS.AuditTrail,
    },
    WhisperStats: {
        address: ADDRESSES.WhisperStats,
        abi: ABIS.WhisperStats,
    },
    WhisperVault: {
        address: ADDRESSES.WhisperVault,
        abi: ABIS.WhisperVault,
    },
    RewardManager: {
        address: ADDRESSES.RewardManager,
        abi: ABIS.RewardManager,
    },
} as const;

export type ContractName = keyof typeof CONTRACT_CONFIGS;
