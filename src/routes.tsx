import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';

// Layouts
import { AdminLayout } from './components/layouts/AdminLayout';
import { HolderLayout } from './components/layouts/HolderLayout';

// Pages
import LoginPage from './pages/LoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminHoldersPage from './pages/admin/AdminHoldersPage';
import AdminAssetsPage from './pages/admin/AdminAssetsPage';
import HolderDashboardPage from './pages/holder/HolderDashboardPage';
import HolderPortfolioPage from './pages/holder/HolderPortfolioPage';
import HolderTransactionsPage from './pages/holder/HolderTransactionsPage';
import NotFound from './pages/NotFound';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
  children?: RouteConfig[];
}

const routes: RouteConfig[] = [
  {
    name: 'Root',
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    name: 'Login',
    path: '/login',
    element: <LoginPage />,
  },
  {
    name: 'Admin',
    path: '/admin',
    element: <AdminLayout />,
    children: [
      {
        name: 'Admin Dashboard',
        path: '/admin/dashboard',
        element: <AdminDashboardPage />,
      },
      {
        name: 'Admin Settings',
        path: '/admin/settings',
        element: <AdminSettingsPage />,
      },
      {
        name: 'Admin Holders',
        path: '/admin/holders',
        element: <AdminHoldersPage />,
      },
      {
        name: 'Admin Assets',
        path: '/admin/assets',
        element: <AdminAssetsPage />,
      },
      {
        name: 'Admin Approvals',
        path: '/admin/approvals',
        element: <div>Approvals Page - Coming Soon</div>,
      },
      {
        name: 'Admin History',
        path: '/admin/history',
        element: <div>History Page - Coming Soon</div>,
      },
      {
        name: 'Admin Commissions',
        path: '/admin/commissions',
        element: <div>Commissions Page - Coming Soon</div>,
      },
    ],
  },
  {
    name: 'Holder',
    path: '/holder',
    element: <HolderLayout />,
    children: [
      {
        name: 'Holder Dashboard',
        path: '/holder/dashboard',
        element: <HolderDashboardPage />,
      },
      {
        name: 'Holder Portfolio',
        path: '/holder/portfolio',
        element: <HolderPortfolioPage />,
      },
      {
        name: 'Holder Transactions',
        path: '/holder/transactions',
        element: <HolderTransactionsPage />,
      },
      {
        name: 'Holder History',
        path: '/holder/history',
        element: <div>History Page - Coming Soon</div>,
      },
    ],
  },
  {
    name: '404',
    path: '*',
    element: <NotFound />,
  },
];

export default routes;
