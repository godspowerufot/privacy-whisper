/**
 * FHEVM Encryption Hook
 * Provides functions to encrypt values for confidential transactions
 * Updated to use the new useFhe pattern
 */

import { useCallback, useState } from 'react';
import { useAccount } from 'wagmi';
import { toHex } from 'viem';
import { useFhe } from '@/providers/FhevmProvider';

export interface EncryptedResult {
  handles: `0x${string}`[];
  inputProof: `0x${string}`;
}

/**
 * Convert Uint8Array to hex string
 */
function uint8ArrayToHex(arr: Uint8Array): `0x${string}` {
  return typeof arr === 'string' && (arr as string).startsWith('0x') 
    ? (arr as string) as `0x${string}` 
    : toHex(arr);
}

export function useFhevmEncrypt() {
  const instance = useFhe();
  const { address, isConnected } = useAccount();
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [encryptError, setEncryptError] = useState<Error | null>(null);

  /**
   * Encrypt a 256-bit value (e.g. for strings/names)
   */
  const encrypt256 = useCallback(
    async (
      value: bigint,
      contractAddress: string
    ): Promise<EncryptedResult | null> => {
      if (!instance || !address || !isConnected) {
        setEncryptError(new Error('FHEVM not ready or wallet not connected'));
        return null;
      }

      setIsEncrypting(true);
      setEncryptError(null);

      try {
        const encryptedInput = await instance.createEncryptedInput(contractAddress, address);
        const result = await encryptedInput.add256(value).encrypt();
        
        return { 
          handles: result.handles.map(h => uint8ArrayToHex(h as Uint8Array)), 
          inputProof: uint8ArrayToHex(result.inputProof as unknown as Uint8Array) 
        };
      } catch (err) {
        console.error('[FHEVM] Encryption failed:', err);
        setEncryptError(err instanceof Error ? err : new Error('Encryption failed'));
        return null;
      } finally {
        setIsEncrypting(false);
      }
    },
    [instance, address, isConnected]
  );

  /**
   * Specialized encryption for Whisper submission
   */
  const encryptWhisper = useCallback(
    async (
      message: bigint,
      fileHash: bigint,
      submitter: `0x${string}`,
      priority: number,
      vaultAddress: string
    ): Promise<EncryptedResult | null> => {
      if (!instance || !address || !isConnected) return null;
      setIsEncrypting(true);

      try {
        const input = await instance.createEncryptedInput(vaultAddress, address);
        const result = await input
          .add256(message)
          .add256(fileHash)
          .addAddress(submitter)
          .add8(priority)
          .encrypt();

        return { 
          handles: result.handles.map(h => uint8ArrayToHex(h as Uint8Array)), 
          inputProof: uint8ArrayToHex(result.inputProof as unknown as Uint8Array) 
        };
      } catch (err) {
        console.error('[FHEVM] Whisper encryption failed:', err);
        return null;
      } finally {
        setIsEncrypting(false);
      }
    },
    [instance, address, isConnected]
  );

  return {
    encrypt256,
    encryptWhisper,
    isEncrypting,
    error: encryptError,
    isReady: !!instance,
  };
}

export default useFhevmEncrypt;
