// Daftar alamat (rute) aplikasi.
//   /                      form pendaftaran pembesuk (publik, belum dikerjakan)
//   /login                 login petugas dan admin
//   /staff/...             panel petugas (wajib login)
//   /staff/admin           khusus role admin
import { Navigate, Route, Routes } from 'react-router-dom';
import StaffLayout from './components/StaffLayout';
import ComingSoon from './pages/ComingSoon';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import VisitorForm from './pages/VisitorForm';
import ProtectedRoute from './routes/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      {/* Publik */}
           <Route path="/" element={<VisitorForm />} />
      <Route path="/login" element={<Login />} />

      {/* Petugas dan admin */}
      <Route element={<ProtectedRoute />}>
        <Route path="/staff" element={<StaffLayout />}>
          <Route index element={<Navigate to="visits" replace />} />
          <Route path="visits" element={<ComingSoon title="Kunjungan" />} />
          <Route path="prisoners" element={<ComingSoon title="Tahanan" />} />
          <Route path="visitors" element={<ComingSoon title="Pembesuk" />} />
          <Route path="reports" element={<ComingSoon title="Laporan" />} />

          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="admin" element={<ComingSoon title="Admin" />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}