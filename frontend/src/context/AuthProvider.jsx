// Menyimpan siapa yang sedang login. Saat aplikasi dibuka, kalau ada token
// tersimpan, tanyakan ke backend (GET /auth/me) apakah token itu masih sah.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { TOKEN_KEY } from '../services/api';
import { getCurrentUser, login as loginRequest } from '../services/auth.service';
import AuthContext from './AuthContext';

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // true selama aplikasi masih memeriksa token yang tersimpan
  const [checking, setChecking] = useState(() =>
    Boolean(localStorage.getItem(TOKEN_KEY))
  );

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return;

    let cancelled = false;
    getCurrentUser()
      .then((data) => {
        if (!cancelled) setUser(data);
      })
      .catch(() => {
        // Token tidak sah: bersihkan, pengguna perlu login ulang.
        localStorage.removeItem(TOKEN_KEY);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (username, password) => {
    const { token, pengguna } = await loginRequest(username, password);
    localStorage.setItem(TOKEN_KEY, token);
    setUser(pengguna);
    return pengguna;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, checking, login, logout }),
    [user, checking, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}