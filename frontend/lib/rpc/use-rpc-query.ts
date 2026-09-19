"use client";

import { useCallback, useEffect, useState } from "react";
import { getRpcErrorMessage } from "./errors";

type QueryState<T> =
  | { data: undefined; error: null; isLoading: true }
  | { data: T; error: null; isLoading: false }
  | { data: undefined; error: string; isLoading: false };

export function useRpcQuery<T>(load: (signal: AbortSignal) => Promise<T>) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<QueryState<T>>({
    data: undefined,
    error: null,
    isLoading: true,
  });
  const refetch = useCallback(() => setAttempt((value) => value + 1), []);

  // A retry starts a new request; cleanup prevents stale requests replacing it.
  // biome-ignore lint/correctness/useExhaustiveDependencies: attempt explicitly triggers a retry of the same loader.
  useEffect(() => {
    const controller = new AbortController();
    setState({ data: undefined, error: null, isLoading: true });
    void load(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) {
          setState({ data, error: null, isLoading: false });
        }
      },
      (error: unknown) => {
        if (!controller.signal.aborted) {
          setState({
            data: undefined,
            error: getRpcErrorMessage(error),
            isLoading: false,
          });
        }
      },
    );
    return () => controller.abort();
  }, [load, attempt]);

  return { ...state, refetch };
}
