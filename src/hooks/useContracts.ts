'use client';

import { useMemo } from 'react';
import { Contract, BrowserProvider, JsonRpcSigner } from 'ethers';
import { usePublicClient, useWalletClient } from 'wagmi';
import { CONTRACT_CONFIGS, ContractName } from '@/constants/contracts';
import { toastTransaction } from '@/lib/notifications';

export { toastTransaction };

/**
 * Utility to convert a Wagmi/Viem Wallet Client to an Ethers Signer
 */
export async function getSigner(walletClient: any): Promise<JsonRpcSigner> {
    const { account, chain, transport } = walletClient;
    const network = {
        chainId: chain.id,
        name: chain.name,
    };
    const provider = new BrowserProvider(transport, network);
    const signer = await provider.getSigner(account.address);
    return signer;
}

/**
 * Custom hook to get an initialized contract instance.
 *
 * For WRITE operations: uses window.ethereum directly (most reliable for MetaMask/RainbowKit).
 * For READ operations: falls back to the public JSON-RPC transport.
 */
export function useContractInstance(name: ContractName) {
    const { address, abi } = CONTRACT_CONFIGS[name];
    const { data: walletClient } = useWalletClient();
    const publicClient = usePublicClient();

    return useMemo(() => {
        if (!address || !abi) return null;

        // --- WRITE path: use window.ethereum directly ---
        // Wagmi's viem transport wraps the provider but can drop calldata when bridged
        // to Ethers BrowserProvider. window.ethereum is the raw EIP-1193 provider and
        // is always reliable for MetaMask / injected wallets.
        if (walletClient && typeof window !== 'undefined' && (window as any).ethereum) {
            const provider = new BrowserProvider((window as any).ethereum);
            const signer = new JsonRpcSigner(provider, walletClient.account.address);
            return new Contract(address, abi, signer);
        }

        // --- READ path: use public client transport ---
        if (publicClient) {
            const { transport, chain } = publicClient;
            const provider = new BrowserProvider(transport, {
                chainId: chain?.id || 1,
                name: chain?.name || 'mainnet',
            });
            return new Contract(address, abi, provider);
        }

        return null;
    }, [address, abi, walletClient, publicClient]);
}

/**
 * Specialized hooks for each contract for even easier access
 */
export const useAuditTrail = () => useContractInstance('AuditTrail');
export const useWhisperCaseManager = () => useContractInstance('WhisperCaseManager');
export const useWhisperStats = () => useContractInstance('WhisperStats');
export const useWhisperVault = () => useContractInstance('WhisperVault');
export const useRewardManager = () => useContractInstance('RewardManager');
export const useAccessControlManager = () => useContractInstance('AccessControlManager');
