// Wadah data login yang bisa dibaca dari halaman mana pun.
// Isinya diisi oleh AuthProvider, dibaca lewat useAuth.
import { createContext } from 'react';

const AuthContext = createContext(null);

export default AuthContext;