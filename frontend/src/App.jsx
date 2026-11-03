// Daftar alamat (rute) aplikasi.
//   /                          form pendaftaran pembesuk (publik)
//   /login                     login petugas dan admin
//   /staff/dashboard           halaman pertama setelah login
//   /staff/visits              daftar kunjungan, /staff/visits/:id detail
//   /staff/prisoners           daftar tahanan, /staff/prisoners/:id detail
//   /staff/visitors            daftar pembesuk, /staff/visitors/:id detail
//   /staff/reports             laporan bulanan
//   /staff/rules               peraturan besuk
//   /staff/users, /staff/settings   khusus admin (petugas melihat halaman 403)
import { Navigate, Route, Routes } from 'react-router-dom';
import StaffLayout from './components/StaffLayout';
import ComingSoon from './pages/ComingSoon';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import PrisonerDetail from './pages/PrisonerDetail';
import Prisoners from './pages/Prisoners';
import Reports from './pages/Reports';
import Rules from './pages/Rules';
import VisitDetail from './pages/VisitDetail';
import VisitList from './pages/VisitList';
import VisitorDetail from './pages/VisitorDetail';
import VisitorForm from './pages/VisitorForm';
import Visitors from './pages/Visitors';
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
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="visits" element={<VisitList />} />
          <Route path="visits/:id" element={<VisitDetail />} />
          <Route path="prisoners" element={<Prisoners />} />
          <Route path="prisoners/:id" element={<PrisonerDetail />} />
          <Route path="visitors" element={<Visitors />} />
          <Route path="visitors/:id" element={<VisitorDetail />} />
          <Route path="reports" element={<Reports />} />
          <Route path="rules" element={<Rules />} />

          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="users" element={<ComingSoon title="Pengguna" />} />
            <Route path="settings" element={<ComingSoon title="Pengaturan" />} />
          </Route>

          {/* Alamat salah di dalam panel */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}