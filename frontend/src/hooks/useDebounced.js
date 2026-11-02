// Menunda perubahan nilai (dipakai untuk kolom cari: mencari 400 ms setelah berhenti mengetik).
import { useEffect, useState } from 'react';

export default function useDebounced(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}