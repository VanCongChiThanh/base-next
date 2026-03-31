"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import apiClient from "@/lib/api-client";
import { ApiError, PaginationMeta } from "@/types";

interface UsePaginatedDataOptions<T> {
  endpoint: string;
  limit?: number;
  initialPage?: number;
  enabled?: boolean;
  transformResponse?: (data: T[], meta: PaginationMeta) => T[];
}

interface UsePaginatedDataReturn<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: ApiError | null;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  setPage: (page: number) => void;
}

export function usePaginatedData<T>(
  options: UsePaginatedDataOptions<T>,
): UsePaginatedDataReturn<T> {
  const {
    endpoint,
    limit = 20,
    initialPage = 1,
    enabled = true,
    transformResponse,
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const isMounted = useRef(true);

  const fetchData = useCallback(
    async (pageNum: number, append = false) => {
      if (!enabled) return;

      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const response = await apiClient.getFull<T[]>(
          `${endpoint}?page=${pageNum}&limit=${limit}`,
        );

        let responseData = response.data;
        const pagination = response.meta?.pagination;

        if (transformResponse && pagination) {
          responseData = transformResponse(responseData, pagination);
        }

        if (isMounted.current) {
          if (append) {
            setData((prev) => [...prev, ...responseData]);
          } else {
            setData(responseData);
          }
          setTotal(pagination?.total || 0);
          setPage(pageNum);
        }
      } catch (err) {
        if (isMounted.current) {
          setError(err as ApiError);
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      }
    },
    [endpoint, limit, enabled, transformResponse],
  );

  const loadMore = useCallback(async () => {
    if (data.length < total && !isLoading && !isLoadingMore) {
      await fetchData(page + 1, true);
    }
  }, [data.length, total, isLoading, isLoadingMore, page, fetchData]);

  const refresh = useCallback(async () => {
    setData([]);
    await fetchData(1);
  }, [fetchData]);

  useEffect(() => {
    isMounted.current = true;
    fetchData(initialPage);

    return () => {
      isMounted.current = false;
    };
  }, [fetchData, initialPage]);

  const hasMore = useMemo(() => data.length < total, [data.length, total]);

  return {
    data,
    total,
    page,
    limit,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    loadMore,
    refresh,
    setPage,
  };
}

export default usePaginatedData;
