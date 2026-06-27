import { ReactNode } from 'react';
import { useLocation } from 'wouter';
import { useSession } from '@/contexts/SessionContext';
import { getLoginUrl } from '@/const';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'user' | 'admin';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading } = useSession();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 border-accent/20 border-t-accent animate-spin mx-auto mb-4" />
          <p className="body-sm text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login
    window.location.href = getLoginUrl();
    return null;
  }

  if (requiredRole && user.role !== requiredRole) {
    // Redirect to home if user doesn't have required role
    setLocation('/');
    return null;
  }

  return <>{children}</>;
}
