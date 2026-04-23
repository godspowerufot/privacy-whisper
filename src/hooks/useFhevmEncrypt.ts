/**
 * FHEVM Encryption Hook
 * Provides functions to encrypt values for confidential transactions
 */

import { useCallback, useState } from 'react';
import { useAccount } from 'wagmi';
import { toHex } from 'viem';
import { useFhevm } from '../providers/useFhevmContext';

export interface EncryptedResult {
  handles: `0x${string}`[];
  inputProof: `0x${string}`;
}

/**
 * Convert Uint8Array to hex string
 */
function uint8ArrayToHex(arr: Uint8Array): `0x${string}` {
  return typeof arr === 'string' && (arr as string).startsWith('0x') 
    ? arr as `0x${string}` 
    : toHex(arr);
}

export function useFhevmEncrypt() {
  const { instance, isReady, error } = useFhevm();
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
      if (!instance || !address || !isReady || !isConnected) {
        setEncryptError(new Error('FHEVM not ready or wallet not connected'));
        return null;
      }

      setIsEncrypting(true);
      setEncryptError(null);

      try {
        console.log('[FHEVM] Encrypting 256 value...');
        
        const encryptedInput = instance.createEncryptedInput(
          contractAddress,
          address
        );
        
        const result = await encryptedInput.add256(value).encrypt();
        
        const { handles, inputProof } = result;
        
        // Convert handles array to hex strings
        const hexHandles = handles.map((h: unknown) => {
          if (typeof h === 'string' && h.startsWith('0x')) {
            return h as `0x${string}`;
          }
          return uint8ArrayToHex(h as Uint8Array);
        });
        
        // Convert inputProof to hex string
        const hexProof = typeof inputProof === 'string' && inputProof.startsWith('0x')
          ? inputProof as `0x${string}`
          : uint8ArrayToHex(inputProof as unknown as Uint8Array);
        
        return { handles: hexHandles, inputProof: hexProof };
      } catch (err) {
        console.error('[FHEVM] Encryption failed:', err);
        setEncryptError(err instanceof Error ? err : new Error('Encryption failed'));
        return null;
      } finally {
        setIsEncrypting(false);
      }
    },
    [instance, address, isReady, isConnected]
  );

  return {
    encrypt256,
    isEncrypting,
    error: error || encryptError,
    isReady,
  };
}

export default useFhevmEncrypt;
