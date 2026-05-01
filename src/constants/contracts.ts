import AuditTrailABI from '../../abi/AuditTrail.json';
import AccessControlManagerABI from '../../abi/AccessControlManager.json';
import WhisperCaseManagerABI from '../../abi/WhisperCaseManager.json';
import WhisperStatsABI from '../../abi/WhisperStats.json';
import WhisperVaultABI from '../../abi/WhisperVault.json';
import RewardManagerABI from '../../abi/RewardManager.json';

export const ADDRESSES = {
    AccessControlManager: '0x5fa76f93b7A869e065c842FffA7e1D48641b7721',
    WhisperCaseManager:   '0xFc5161AF020e9BDbe43e63e2623daBB66DA3496E',
    AuditTrail:           '0x175CB366fE729a1F24949B50477bca9aDBaF9c58',
    WhisperStats:         '0x7ab37E894ef821544f2b339fc9eb6793d8170660',
    WhisperVault:         '0x12d0CEEee07F6d6E1512e6B22d100EAC000Df58a',
    RewardManager:        '0xB4C5d17A24Abaa3274CFA4AF1d55C84e260e2f39',
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
