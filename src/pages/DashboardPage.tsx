import { ProtectedRoute } from '../components/ProtectedRoute';
import PublicDjPage from './PublicDjPage';

export default function DashboardPage() {
  return (
    <ProtectedRoute requireProfile>
      <PublicDjPage ownerMode />
    </ProtectedRoute>
  );
}
