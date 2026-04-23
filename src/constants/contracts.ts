import AuditTrailABI from '../../abi/AuditTrail.json';
import AccessControlManagerABI from '../../abi/AccessControlManager.json';
import WhisperCaseManagerABI from '../../abi/WhisperCaseManager.json';
import WhisperStatsABI from '../../abi/WhisperStats.json';
import WhisperVaultABI from '../../abi/WhisperVault.json';
import RewardManagerABI from '../../abi/RewardManager.json';

export const ADDRESSES = {
    AccessControlManager: '0x1F51688649f01818Fc86f2B158084E6257618c37',
    WhisperCaseManager:   '0x020aB90d68eA3a7FD6dC7E17d3ada66e76A6367c',
    AuditTrail:           '0xa2712892B12197c5C05fD8b4a6a80713C6Ea1225',
    WhisperStats:         '0x5530c0270a4404e6c964af718dd49e2F340eeDec',
    WhisperVault:         '0xB3db74E12792A47085eFB01e737Edb96f0CdE8FF',
    RewardManager:        '0x95f0aA956D6F0c27848fF82c8082ed7BcA373Fac',
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
