import { useContext } from 'react';
import { FhevmContext } from './FhevmContext';

export function useFhevm() {
  return useContext(FhevmContext);
}
