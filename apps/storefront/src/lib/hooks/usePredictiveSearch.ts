"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { SuggestResponse } from "@/lib/search/types";

const DEBOUNCE_MS = 250;
const MIN_QUERY_LENGTH = 3;

export type PredictiveSearchState = {
  loading: boolean;
  error: string | null;
  data: SuggestResponse | null;
};

export function usePredictiveSearch(query: string): PredictiveSearchState {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SuggestResponse | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSuggest = useCallback(async (q: string, signal: AbortSignal) => {
    const res = await fetch("/api/search/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ q }),
      signal,
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error ?? `Suggest failed (${res.status})`);
    }

    return (await res.json()) as SuggestResponse;
  }, []);

  useEffect(() => {
    const trimmed = query.trim();

    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();

    if (trimmed.length < MIN_QUERY_LENGTH) {
      setLoading(false);
      setError(null);
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    debounceRef.current = setTimeout(() => {
      const controller = new AbortController();
      abortRef.current = controller;

      fetchSuggest(trimmed, controller.signal)
        .then((result) => {
          if (!controller.signal.aborted) {
            setData(result);
            setError(null);
          }
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted) return;
          setData(null);
          setError(err instanceof Error ? err.message : "Error de búsqueda");
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, [query, fetchSuggest]);

  return { loading, error, data };
}

export { MIN_QUERY_LENGTH };
