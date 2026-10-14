import { useContext } from 'react';
import AuthContext from './AuthContext';

// Pemakaian di halaman: const { user, login, logout } = useAuth();
export default function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth harus dipakai di dalam <AuthProvider>');
  }
  return value;
}