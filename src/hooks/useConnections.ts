'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export interface Connections {
  google: boolean;
  microsoft: boolean;
  apple: boolean;
  appleEmail: string | null;
}

export function useConnections() {
  const { data, error, isLoading, mutate } = useSWR<Connections>('/api/connections', fetcher);
  return {
    connections: data ?? { google: false, microsoft: false, apple: false, appleEmail: null },
    error,
    isLoading,
    mutate,
  };
}
