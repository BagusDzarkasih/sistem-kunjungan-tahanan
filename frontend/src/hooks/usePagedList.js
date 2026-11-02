// Memuat daftar berhalaman dari server.
//   fetcher(params, signal) harus mengembalikan { rows, total }.
//   params berubah -> memuat ulang. reload() memuat ulang dengan params yang sama.
import { useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../services/api';

export default function usePagedList(fetcher, params) {
  const [tick, setTick] = useState(0);
  const [result, setResult] = useState({ key: '', rows: [], total: 0, error: '' });

  // Menyimpan fetcher dan params terbaru tanpa membuat efek di bawah berjalan berulang.
  const latest = useRef({ fetcher, params });
  useEffect(() => {
    latest.current = { fetcher, params };
  });

  const key = `${JSON.stringify(params)}|${tick}`;

  useEffect(() => {
    const controller = new AbortController();
    const { fetcher: load, params: current } = latest.current;
    load(current, controller.signal)
      .then((r) => {
        if (controller.signal.aborted) return;
        setResult({ key, rows: r.rows, total: r.total, error: '' });
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setResult({ key, rows: [], total: 0, error: getErrorMessage(err) });
      });
    return () => controller.abort();
  }, [key]);

  return {
    rows: result.rows,
    total: result.total,
    error: result.error,
    loading: result.key !== key,
    reload: () => setTick((t) => t + 1),
  };
}