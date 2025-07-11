import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { useMutation, useQuery } from '@tanstack/react-query'

// Contract ABI - you'll need to update this with the actual ABI after compilation
const LEADERBOARD_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "score",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "position",
        "type": "uint256"
      }
    ],
    "name": "LeaderboardUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "score",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "playerName",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "fid",
        "type": "uint256"
      }
    ],
    "name": "ScoreSubmitted",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_player",
        "type": "address"
      }
    ],
    "name": "getPlayerPosition",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_player",
        "type": "address"
      }
    ],
    "name": "getPlayerScore",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "score",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "playerName",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "fid",
            "type": "uint256"
          }
        ],
        "internalType": "struct RaptorRunLeaderboard.Score",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getLeaderboard",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "player",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "score",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "playerName",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "fid",
            "type": "uint256"
          }
        ],
        "internalType": "struct RaptorRunLeaderboard.LeaderboardEntry[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_score",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_playerName",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_fid",
        "type": "uint256"
      }
    ],
    "name": "submitScore",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const

// Update this with your deployed contract address
const LEADERBOARD_CONTRACT_ADDRESS = '0x...' // Replace with actual deployed address

export interface LeaderboardEntry {
  player: string
  score: bigint
  timestamp: bigint
  playerName: string
  fid: bigint
}

export interface PlayerScore {
  score: bigint
  timestamp: bigint
  playerName: string
  fid: bigint
}

export function useLeaderboard() {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  // Fetch leaderboard data
  const { data: leaderboard, isLoading: isLoadingLeaderboard, refetch: refetchLeaderboard } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      if (!publicClient) throw new Error('No public client')
      
      const data = await publicClient.readContract({
        address: LEADERBOARD_CONTRACT_ADDRESS as `0x${string}`,
        abi: LEADERBOARD_ABI,
        functionName: 'getLeaderboard',
      })
      
      return data as LeaderboardEntry[]
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  // Fetch player's score
  const { data: playerScore, isLoading: isLoadingPlayerScore } = useQuery({
    queryKey: ['playerScore', address],
    queryFn: async (): Promise<PlayerScore | null> => {
      if (!publicClient || !address) return null
      
      const data = await publicClient.readContract({
        address: LEADERBOARD_CONTRACT_ADDRESS as `0x${string}`,
        abi: LEADERBOARD_ABI,
        functionName: 'getPlayerScore',
        args: [address],
      })
      
      return data
    },
    enabled: !!address,
  })

  // Fetch player's position
  const { data: playerPosition } = useQuery({
    queryKey: ['playerPosition', address],
    queryFn: async (): Promise<number> => {
      if (!publicClient || !address) return 0
      
      const data = await publicClient.readContract({
        address: LEADERBOARD_CONTRACT_ADDRESS as `0x${string}`,
        abi: LEADERBOARD_ABI,
        functionName: 'getPlayerPosition',
        args: [address],
      })
      
      return Number(data)
    },
    enabled: !!address,
  })

  // Submit score mutation
  const submitScoreMutation = useMutation({
    mutationFn: async ({ score, playerName, fid }: { score: number; playerName: string; fid: number }) => {
      if (!walletClient || !address) throw new Error('No wallet client or address')
      
      const { request } = await publicClient!.simulateContract({
        address: LEADERBOARD_CONTRACT_ADDRESS as `0x${string}`,
        abi: LEADERBOARD_ABI,
        functionName: 'submitScore',
        args: [BigInt(score), playerName, BigInt(fid)],
        account: address,
      })
      
      const hash = await walletClient.writeContract(request)
      await publicClient!.waitForTransactionReceipt({ hash })
      
      return hash
    },
    onSuccess: () => {
      refetchLeaderboard()
    },
  })

  return {
    leaderboard: leaderboard || [],
    playerScore,
    playerPosition,
    isLoadingLeaderboard,
    isLoadingPlayerScore,
    submitScore: submitScoreMutation.mutate,
    isSubmittingScore: submitScoreMutation.isPending,
    submitScoreError: submitScoreMutation.error,
  }
} 