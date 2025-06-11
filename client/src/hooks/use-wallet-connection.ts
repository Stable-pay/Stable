import { useState, useEffect } from 'react';
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';

export function useWalletConnection() {
  const { address, isConnected, status } = useAppKitAccount();
  const { caipNetwork } = useAppKitNetwork();
  
  const [chainId, setChainId] = useState<number>(1);
  
  useEffect(() => {
    if (caipNetwork?.id) {
      const id = typeof caipNetwork.id === 'string' ? parseInt(caipNetwork.id) : caipNetwork.id;
      setChainId(id);
    }
  }, [caipNetwork]);
  
  return {
    address,
    isConnected,
    status,
    chainId,
    chainName: getChainName(chainId)
  };
}

function getChainName(chainId: number): string {
  const names: Record<number, string> = {
    1: 'Ethereum',
    137: 'Polygon',
    56: 'BNB Chain',
    42161: 'Arbitrum',
    10: 'Optimism',
    43114: 'Avalanche',
    1337: 'Hardhat'
  };
  return names[chainId] || 'Unknown';
}