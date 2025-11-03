// ========================================
// OPTIMIZED API HOOK TESTS - TESTS DU HOOK API OPTIMISÉ
// ========================================

import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { useOptimizedApi, useOptimizedMutation, useOptimizedPagination } from '../../hooks/useOptimizedApi';
import { apiCache } from '../../utils/performance/cache';

// Mock de fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

// Mock du cache
jest.mock('../../utils/performance/cache', () => ({
  apiCache: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    has: jest.fn(),
    clear: jest.fn()
  },
  generateApiKey: jest.fn((endpoint, params) => `${endpoint}:${JSON.stringify(params)}`)
}));

// Mock de react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

const mockApiCache = apiCache as jest.Mocked<typeof apiCache>;

describe('useOptimizedApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    mockApiCache.get.mockReturnValue(null);
    mockApiCache.has.mockReturnValue(false);
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Fonctionnalité de base', () => {
    it('devrait faire une requête API et retourner les données', async () => {
      const mockData = { id: 1, name: 'Test Data' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

      const { result } = renderHook(() => 
        useOptimizedApi('/test', {}, { debounceDelay: 0 })
      );

      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBe(null);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBe(null);
      expect(result.current.fromCache).toBe(false);
    });

    it('devrait gérer les erreurs API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      const { result } = renderHook(() => 
        useOptimizedApi('/test', {}, { debounceDelay: 0 })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBe(null);
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toContain('404');
    });

    it('devrait utiliser les paramètres dans l\'URL', async () => {
      const mockData = { results: [] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

      const params = { page: 1, limit: 10 };
      renderHook(() => 
        useOptimizedApi('/test', params, { debounceDelay: 0 })
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/test?page=1&limit=10',
          expect.any(Object)
        );
      });
    });
  });

  describe('Fonctionnalité de cache', () => {
    it('devrait utiliser les données du cache si disponibles', async () => {
      const cachedData = { id: 1, name: 'Cached Data' };
      mockApiCache.get.mockReturnValue(cachedData);

      const { result } = renderHook(() => 
        useOptimizedApi('/test', {}, { enableCache: true, debounceDelay: 0 })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(cachedData);
      expect(result.current.fromCache).toBe(true);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('devrait mettre les données en cache après une requête réussie', async () => {
      const mockData = { id: 1, name: 'Fresh Data' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

      renderHook(() => 
        useOptimizedApi('/test', {}, { enableCache: true, debounceDelay: 0 })
      );

      await waitFor(() => {
        expect(mockApiCache.set).toHaveBeenCalledWith(
          expect.any(String),
          mockData,
          expect.any(Number)
        );
      });
    });

    it('devrait invalider le cache', async () => {
      const { result } = renderHook(() => 
        useOptimizedApi('/test', {}, { enableCache: true })
      );

      act(() => {
        result.current.invalidateCache();
      });

      expect(mockApiCache.delete).toHaveBeenCalled();
    });
  });

  describe('Fonctionnalité de retry', () => {
    it('devrait retry en cas d\'échec réseau', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });

      const { result } = renderHook(() => 
        useOptimizedApi('/test', {}, { 
          debounceDelay: 0, 
          retryCount: 3, 
          retryDelay: 10 
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 5000 });

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result.current.data).toEqual({ success: true });
      expect(result.current.error).toBe(null);
    });

    it('devrait échouer après le nombre maximum de tentatives', async () => {
      mockFetch.mockRejectedValue(new Error('Persistent Error'));

      const { result } = renderHook(() => 
        useOptimizedApi('/test', {}, { 
          debounceDelay: 0, 
          retryCount: 2, 
          retryDelay: 10 
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 5000 });

      expect(mockFetch).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.data).toBe(null);
    });
  });

  describe('Méthodes de contrôle', () => {
    it('devrait permettre de refetch les données', async () => {
      const mockData = { id: 1, name: 'Test Data' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

      const { result } = renderHook(() => 
        useOptimizedApi('/test', {}, { debounceDelay: 0 })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);

      act(() => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });

    it('devrait permettre de refresh (forcer le rechargement)', async () => {
      const cachedData = { id: 1, name: 'Cached Data' };
      const freshData = { id: 1, name: 'Fresh Data' };
      
      mockApiCache.get.mockReturnValue(cachedData);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(freshData)
      });

      const { result } = renderHook(() => 
        useOptimizedApi('/test', {}, { enableCache: true, debounceDelay: 0 })
      );

      await waitFor(() => {
        expect(result.current.data).toEqual(cachedData);
      });

      act(() => {
        result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(freshData);
      });

      expect(mockFetch).toHaveBeenCalled();
    });

    it('devrait permettre d\'annuler une requête', async () => {
      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      );

      const { result } = renderHook(() => 
        useOptimizedApi('/test', {}, { debounceDelay: 0 })
      );

      expect(result.current.loading).toBe(true);

      act(() => {
        result.current.cancel();
      });

      // La requête devrait être annulée
      expect(result.current.loading).toBe(false);
    });
  });

  describe('Transformation des données', () => {
    it('devrait transformer les données avec la fonction fournie', async () => {
      const mockData = { value: 10 };
      const transformedData = { value: 20 };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

      const transform = jest.fn().mockReturnValue(transformedData);

      const { result } = renderHook(() => 
        useOptimizedApi('/test', {}, { 
          debounceDelay: 0, 
          transform 
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(transform).toHaveBeenCalledWith(mockData);
      expect(result.current.data).toEqual(transformedData);
    });
  });

  describe('Callbacks', () => {
    it('devrait appeler onSuccess en cas de succès', async () => {
      const mockData = { success: true };
      const onSuccess = jest.fn();
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

      renderHook(() => 
        useOptimizedApi('/test', {}, { 
          debounceDelay: 0, 
          onSuccess 
        })
      );

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(mockData);
      });
    });

    it('devrait appeler onError en cas d\'erreur', async () => {
      const onError = jest.fn();
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      renderHook(() => 
        useOptimizedApi('/test', {}, { 
          debounceDelay: 0, 
          onError 
        })
      );

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.any(Error));
      });
    });
  });
});

describe('useOptimizedMutation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  it('devrait effectuer une mutation POST', async () => {
    const mockResponse = { id: 1, created: true };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const { result } = renderHook(() => 
      useOptimizedMutation('/create', { method: 'POST' })
    );

    expect(result.current.loading).toBe(false);

    const mutationData = { name: 'Test Item' };
    let mutationResult: any;

    await act(async () => {
      mutationResult = await result.current.mutate(mutationData);
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mutationData)
    });

    expect(mutationResult).toEqual(mockResponse);
    expect(result.current.data).toEqual(mockResponse);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('devrait invalider les clés de cache spécifiées', async () => {
    const mockResponse = { success: true };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const invalidateKeys = ['key1', 'key2'];
    const { result } = renderHook(() => 
      useOptimizedMutation('/update', { 
        method: 'PUT',
        invalidateKeys 
      })
    );

    await act(async () => {
      await result.current.mutate({ id: 1, name: 'Updated' });
    });

    expect(mockApiCache.delete).toHaveBeenCalledTimes(2);
    expect(mockApiCache.delete).toHaveBeenCalledWith('key1');
    expect(mockApiCache.delete).toHaveBeenCalledWith('key2');
  });

  it('devrait gérer les erreurs de mutation', async () => {
    const onError = jest.fn();
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request'
    });

    const { result } = renderHook(() => 
      useOptimizedMutation('/create', { onError })
    );

    await act(async () => {
      try {
        await result.current.mutate({ invalid: 'data' });
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.loading).toBe(false);
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it('devrait permettre de reset l\'état', async () => {
    const { result } = renderHook(() => 
      useOptimizedMutation('/create')
    );

    // Simuler un état avec des données
    act(() => {
      (result.current as any).setState({
        loading: false,
        error: new Error('Test error'),
        data: { test: true }
      });
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.data).toBe(null);
  });
});

describe('useOptimizedPagination', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  it('devrait charger la première page', async () => {
    const mockResponse = {
      items: [{ id: 1 }, { id: 2 }],
      total: 100,
      hasMore: true
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const { result } = renderHook(() => 
      useOptimizedPagination('/items', { 
        debounceDelay: 0,
        pageSize: 20 
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockResponse.items);
    expect(result.current.totalItems).toBe(100);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.currentPage).toBe(1);
  });

  it('devrait charger plus de données', async () => {
    const page1Response = {
      items: [{ id: 1 }, { id: 2 }],
      total: 100,
      hasMore: true
    };

    const page2Response = {
      items: [{ id: 3 }, { id: 4 }],
      total: 100,
      hasMore: true
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(page1Response)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(page2Response)
      });

    const { result } = renderHook(() => 
      useOptimizedPagination('/items', { 
        debounceDelay: 0,
        pageSize: 2 
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual([{ id: 1 }, { id: 2 }]);

    act(() => {
      result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual([
      { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }
    ]);
    expect(result.current.currentPage).toBe(2);
  });

  it('devrait reset la pagination', async () => {
    const mockResponse = {
      items: [{ id: 1 }],
      total: 1,
      hasMore: false
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const { result } = renderHook(() => 
      useOptimizedPagination('/items', { debounceDelay: 0 })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Simuler le chargement de plusieurs pages
    act(() => {
      result.current.loadMore();
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.currentPage).toBe(1);
    expect(result.current.data).toEqual([]);
  });

  it('ne devrait pas charger plus si hasMore est false', async () => {
    const mockResponse = {
      items: [{ id: 1 }],
      total: 1,
      hasMore: false
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const { result } = renderHook(() => 
      useOptimizedPagination('/items', { debounceDelay: 0 })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const initialCallCount = mockFetch.mock.calls.length;

    act(() => {
      result.current.loadMore();
    });

    // Ne devrait pas faire d'appel supplémentaire
    expect(mockFetch.mock.calls.length).toBe(initialCallCount);
  });
});
