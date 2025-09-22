/**
 * Tests for bulk chunks functionality
 */

import { renderHook, act } from '@testing-library/react'
import { useBulkChunks } from '@/hooks/use-bulk-chunks'
import { fetchBulkChunks } from '@/lib/bulk-chunks-client'

// Mock the fetch function
global.fetch = jest.fn()

// Mock the bulk chunks client
jest.mock('@/lib/bulk-chunks-client')
const mockFetchBulkChunks = fetchBulkChunks as jest.MockedFunction<typeof fetchBulkChunks>

describe('useBulkChunks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should fetch chunks successfully', async () => {
    const mockResponse = {
      chunks: {
        'e_12345': {
          id: 'e_12345',
          source_type: 'earnings_call',
          text: 'Sample earnings call text',
          company_name: 'Test Company'
        },
        'k_67890': {
          id: 'k_67890',
          source_type: 'expert_interview',
          title: 'Sample expert interview',
          industry: 'Technology'
        }
      },
      errors: {},
      summary: {
        total_requested: 2,
        successful: 2,
        failed: 0
      }
    }

    mockFetchBulkChunks.mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useBulkChunks())

    await act(async () => {
      await result.current.fetchChunks(['e_12345', 'k_67890'])
    })

    expect(mockFetchBulkChunks).toHaveBeenCalledWith(['e_12345', 'k_67890'])
    expect(result.current.chunks).toEqual(mockResponse.chunks)
    expect(result.current.errors).toEqual({})
    expect(result.current.loading).toBe(false)
  })

  it('should handle errors correctly', async () => {
    const mockResponse = {
      chunks: {
        'e_12345': {
          id: 'e_12345',
          source_type: 'earnings_call',
          text: 'Sample earnings call text'
        }
      },
      errors: {
        'e_99999': 'Chunk not found'
      },
      summary: {
        total_requested: 2,
        successful: 1,
        failed: 1
      }
    }

    mockFetchBulkChunks.mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useBulkChunks())

    await act(async () => {
      await result.current.fetchChunks(['e_12345', 'e_99999'])
    })

    expect(result.current.chunks).toEqual(mockResponse.chunks)
    expect(result.current.errors).toEqual(mockResponse.errors)
  })

  it('should not fetch already loaded chunks', async () => {
    const mockResponse = {
      chunks: {
        'e_12345': {
          id: 'e_12345',
          source_type: 'earnings_call',
          text: 'Sample earnings call text'
        }
      },
      errors: {},
      summary: {
        total_requested: 1,
        successful: 1,
        failed: 0
      }
    }

    mockFetchBulkChunks.mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useBulkChunks())

    // First fetch
    await act(async () => {
      await result.current.fetchChunks(['e_12345'])
    })

    expect(mockFetchBulkChunks).toHaveBeenCalledTimes(1)

    // Second fetch with same chunk - should not call API again
    await act(async () => {
      await result.current.fetchChunks(['e_12345'])
    })

    expect(mockFetchBulkChunks).toHaveBeenCalledTimes(1) // Still only called once
  })

  it('should get chunk by ID', async () => {
    const mockResponse = {
      chunks: {
        'e_12345': {
          id: 'e_12345',
          source_type: 'earnings_call',
          text: 'Sample earnings call text'
        }
      },
      errors: {},
      summary: {
        total_requested: 1,
        successful: 1,
        failed: 0
      }
    }

    mockFetchBulkChunks.mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useBulkChunks())

    await act(async () => {
      await result.current.fetchChunks(['e_12345'])
    })

    const chunk = result.current.getChunk('e_12345')
    expect(chunk).toEqual(mockResponse.chunks['e_12345'])

    const nonExistentChunk = result.current.getChunk('e_99999')
    expect(nonExistentChunk).toBeNull()
  })

  it('should clear cache', async () => {
    const mockResponse = {
      chunks: {
        'e_12345': {
          id: 'e_12345',
          source_type: 'earnings_call',
          text: 'Sample earnings call text'
        }
      },
      errors: {},
      summary: {
        total_requested: 1,
        successful: 1,
        failed: 0
      }
    }

    mockFetchBulkChunks.mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useBulkChunks())

    await act(async () => {
      await result.current.fetchChunks(['e_12345'])
    })

    expect(Object.keys(result.current.chunks)).toHaveLength(1)

    act(() => {
      result.current.clearCache()
    })

    expect(Object.keys(result.current.chunks)).toHaveLength(0)
    expect(Object.keys(result.current.errors)).toHaveLength(0)
  })
})

describe('fetchBulkChunks client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should handle empty chunk list', async () => {
    // Remove mock to test actual implementation
    jest.unmock('@/lib/bulk-chunks-client')
    const { fetchBulkChunks: actualFetchBulkChunks } = await import('@/lib/bulk-chunks-client')

    const result = await actualFetchBulkChunks([])

    expect(result).toEqual({
      chunks: {},
      errors: {},
      summary: {
        total_requested: 0,
        successful: 0,
        failed: 0
      }
    })
  })
})
