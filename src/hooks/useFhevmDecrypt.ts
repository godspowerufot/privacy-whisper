/**
 * FHEVM Decryption Hook
 * Provides functions to decrypt encrypted values using signature-based authentication
 * Updated to use the new useFhe pattern
 */

import { useCallback, useState } from 'react';
import { useAccount, useSignTypedData } from 'wagmi';
import { useFhe } from '@/providers/FhevmProvider';
import { ethers } from 'ethers';

export interface HandleContractPair {
  handle: string;
  contractAddress: string;
}

export function useFhevmDecrypt() {
  const instance = useFhe();
  const { address, isConnected } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptError, setDecryptError] = useState<Error | null>(null);

  /**
   * Decrypt a publicly decryptable handle (no signature required)
   */
  const publicDecrypt = useCallback(
    async (
      handle: string | Uint8Array | bigint,
      contractAddress: string
    ): Promise<bigint | null> => {
      if (!instance) {
        setDecryptError(new Error('FHEVM not ready'));
        return null;
      }

      const isFalsyHandle = !handle || (typeof handle === 'string' && handle === '0x' + '0'.repeat(64));
      if (isFalsyHandle) return BigInt(0);

      setIsDecrypting(true);
      setDecryptError(null);

      try {
        // Ensure handle is in the format relayer-sdk expects (often Uint8Array)
        let handleValue: Uint8Array | string = handle as any;
        if (typeof handle === 'bigint') {
          handleValue = ethers.getBytes("0x" + handle.toString(16).padStart(64, '0'));
        } else if (typeof handle === 'string' && handle.startsWith('0x')) {
          handleValue = ethers.getBytes(handle);
        }

        console.log("[FHEVM] Public Decrypt Attempt:", { contractAddress, handle: typeof handle === 'string' ? handle : typeof handle === 'bigint' ? 'bigint' : 'Uint8Array' });

        // Use redecrypt (relayer-sdk standard) or publicDecrypt if available
        const decryptFn = instance.redecrypt || instance.publicDecrypt;
        if (!decryptFn) throw new Error("SDK does not support public decryption methods.");

        const result = await decryptFn.call(instance, [
          { handle: handleValue, contractAddress }
        ]);

        // The result mapping might use the original handle string or the hex version as key
        const key = typeof handle === 'string' ? handle : 
                    typeof handle === 'bigint' ? "0x" + handle.toString(16).padStart(64, '0') : 
                    ethers.hexlify(handle);
        const value = result[key] || Object.values(result)[0]; // Fallback to first value if key mismatch

        return typeof value === 'bigint' ? value : BigInt(value ?? 0);
      } catch (err) {
        console.error('[FHEVM] Public decryption failed:', err);
        setDecryptError(err instanceof Error ? err : new Error('Public decryption failed'));
        return null;
      } finally {
        setIsDecrypting(false);
      }
    },
    [instance]
  );

  /**
   * Decrypt a single encrypted handle using signature (legacy/private)
   */
  const decryptHandle = useCallback(
    async (
      handle: string | bigint | Uint8Array,
      contractAddress: string
    ): Promise<bigint | null> => {
      // First attempt public decryption (since ZamaPlay usually reveals content on-chain first)
      const publicValue = await publicDecrypt(handle, contractAddress);
      if (publicValue !== null && publicValue !== BigInt(0)) return publicValue;

      if (!instance || !address || !isConnected) {
        setDecryptError(new Error('FHEVM not ready or wallet not connected'));
        return null;
      }

      // ... rest of private decryption ...
      setIsDecrypting(true);
      try {
        const handleStr = typeof handle === 'bigint'
          ? "0x" + handle.toString(16).padStart(64, '0')
          : typeof handle === 'string'
            ? handle
            : ethers.hexlify(handle);

        const keypair = instance.generateKeypair();
        const startTimestamp = Math.floor(Date.now() / 1000);
        const durationDays = 10;
        const contractAddresses = [contractAddress];

        const eip712 = instance.createEIP712(
          keypair.publicKey,
          contractAddresses,
          startTimestamp,
          durationDays
        );

        const signature = await signTypedDataAsync({
          domain: eip712.domain as Record<string, unknown>,
          types: {
            UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification
          } as Record<string, unknown>,
          message: eip712.message as Record<string, unknown>,
          primaryType: 'UserDecryptRequestVerification',
        });

        const result = await instance.userDecrypt(
          [{ handle: handleStr, contractAddress }],
          keypair.privateKey,
          keypair.publicKey,
          signature.replace('0x', ''),
          contractAddresses,
          address,
          startTimestamp,
          durationDays
        );

        const value = result[handleStr] || Object.values(result)[0];
        return typeof value === 'bigint' ? value : BigInt(value ?? 0);
      } catch (err) {
        console.error('[FHEVM] Private decryption failed:', err);
        setDecryptError(err instanceof Error ? err : new Error('Private decryption failed'));
        return null;
      } finally {
        setIsDecrypting(false);
      }
    },
    [instance, address, isConnected, signTypedDataAsync, publicDecrypt]
  );

  return {
    decryptHandle,
    publicDecrypt,
    isDecrypting,
    error: decryptError,
    isReady: !!instance,
  };
}

export default useFhevmDecrypt;
