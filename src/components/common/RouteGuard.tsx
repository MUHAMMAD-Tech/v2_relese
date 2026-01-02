import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface RouteGuardProps {
  children: React.ReactNode;
}

// Please add the pages that can be accessed without logging in to PUBLIC_ROUTES.
const PUBLIC_ROUTES = ['/login', '/403', '/404'];

function matchPublicRoute(path: string, patterns: string[]) {
  return patterns.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
      return regex.test(path);
    }
    return path === pattern;
  });
}

export function RouteGuard({ children }: RouteGuardProps) {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    const isPublic = matchPublicRoute(location.pathname, PUBLIC_ROUTES);

    // If not logged in and trying to access protected route
    if (!user && !isPublic) {
      navigate('/login', { state: { from: location.pathname }, replace: true });
      return;
    }

    // If logged in, check role-based access
    if (user && profile) {
      const isAdminRoute = location.pathname.startsWith('/admin');
      const isHolderRoute = location.pathname.startsWith('/holder');

      // Admin trying to access holder routes
      if (profile.role === 'admin' && isHolderRoute) {
        navigate('/admin/dashboard', { replace: true });
        return;
      }

      // Holder trying to access admin routes
      if (profile.role === 'holder' && isAdminRoute) {
        navigate('/holder/dashboard', { replace: true });
        return;
      }

      // Redirect to appropriate dashboard if on root or login
      if (location.pathname === '/' || location.pathname === '/login') {
        if (profile.role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else if (profile.role === 'holder') {
          navigate('/holder/dashboard', { replace: true });
        }
      }
    }
  }, [user, profile, loading, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}