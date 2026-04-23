'use client';

import { toast } from 'react-toastify';
import { type TransactionResponse } from 'ethers';

interface ToastOptions {
    loading?: string;
    success?: string;
    error?: string;
    explorerUrl?: string;
}

const DEFAULT_EXPLORER = 'https://sepolia.etherscan.io';

/**
 * Handles blockchain transaction notifications with processing, success, and error states.
 * Includes a link to the block explorer on success.
 * 
 * @param txPromise A promise that resolves to an Ethers TransactionResponse
 * @param options Custom messages for each state
 * @returns The TransactionReceipt after the transaction is mined
 */
export async function toastTransaction(
    txPromise: Promise<TransactionResponse>,
    options: ToastOptions = {}
) {
    const {
        loading = 'Processing transaction...',
        success = 'Transaction successful!',
        error = 'Transaction failed',
        explorerUrl = DEFAULT_EXPLORER
    } = options;

    const id = toast.loading(loading);

    try {
        const tx = await txPromise;
        
        // Wait for the transaction to be mined
        const receipt = await tx.wait();

        if (receipt && receipt.status === 1) {
            toast.update(id, {
                render: (
                    <div className="flex flex-col gap-1">
                        <span>{success}</span>
                        <a
                            href={`${explorerUrl}/tx/${tx.hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs underline opacity-80 hover:opacity-100 transition-opacity"
                        >
                            View on Explorer
                        </a>
                    </div>
                ),
                type: 'success',
                isLoading: false,
                autoClose: 5000,
            });
        } else {
             throw new Error('Transaction reverted');
        }

        return receipt;
    } catch (err: any) {
        console.error('Transaction Error:', err);
        
        toast.update(id, {
            render: err.reason || err.message || error,
            type: 'error',
            isLoading: false,
            autoClose: 5000,
        });
        
        throw err;
    }
}

/**
 * Hook-style wrapper if needed, though the function above is usually sufficient.
 */
export function useTransactionToast() {
    return { toastTransaction };
}
