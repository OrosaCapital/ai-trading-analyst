import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Loader2 } from 'lucide-react';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: 'superuser' | 'user';
  redirectTo?: string;
}

export const RoleProtectedRoute = ({ 
  children, 
  requiredRole,
  redirectTo = '/trading' 
}: RoleProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
      return;
    }

    if (!roleLoading && role && role !== requiredRole) {
      navigate(redirectTo, { replace: true });
    }
  }, [user, role, authLoading, roleLoading, requiredRole, redirectTo, navigate]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-accent" />
      </div>
    );
  }

  if (!user || role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
};
