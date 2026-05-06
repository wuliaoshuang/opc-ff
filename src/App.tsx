import { createHashRouter, RouterProvider, Navigate } from 'react-router-dom'
import { lazy, Suspense, type ReactNode } from 'react'
import { useStore } from '@/stores'
import { Loader2 } from 'lucide-react'

import AppLayout from '@/layouts/AppLayout'

const LoginPage = lazy(() => import('@/features/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/features/auth/RegisterPage'))

const PartnerDashboardPage = lazy(() => import('@/features/dashboard/PartnerDashboardPage'))
const LeadMiningPage = lazy(() => import('@/features/leads/LeadMiningPage'))
const LeadEvaluationPage = lazy(() => import('@/features/leads/LeadEvaluationPage'))
const CrmPage = lazy(() => import('@/features/crm/CrmPage'))
const BindingPage = lazy(() => import('@/features/binding/BindingPage'))
const SubPartnerPage = lazy(() => import('@/features/binding/SubPartnerPage'))
const TrainingPage = lazy(() => import('@/features/training/TrainingPage'))
const AigcPage = lazy(() => import('@/features/aigc/AigcPage'))
const RedPacketPage = lazy(() => import('@/features/incentives/RedPacketPage'))
const SettlementPage = lazy(() => import('@/features/incentives/SettlementPage'))
const ProfilePage = lazy(() => import('@/features/profile/ProfilePage'))

const AdminDashboardPage = lazy(() => import('@/features/admin/AdminDashboardPage'))
const LeadConsolePage = lazy(() => import('@/features/admin/LeadConsolePage'))
const PartnerManagementPage = lazy(() => import('@/features/admin/PartnerManagementPage'))
const WhiteLabelPage = lazy(() => import('@/features/admin/WhiteLabelPage'))
const ProductShelfPage = lazy(() => import('@/features/admin/ProductShelfPage'))
const IncentiveManagementPage = lazy(() => import('@/features/admin/IncentiveManagementPage'))
const BusinessTrackingPage = lazy(() => import('@/features/admin/BusinessTrackingPage'))
const AdminBindingConsolePage = lazy(() => import('@/features/admin/AdminBindingConsolePage'))
const AdminTrainingPage = lazy(() => import('@/features/admin/AdminTrainingPage'))
const AdminAigcPage = lazy(() => import('@/features/admin/AdminAigcPage'))
const AdminSettlementPage = lazy(() => import('@/features/admin/AdminSettlementPage'))

function Loading() {
  return (
    <div className="flex h-full min-h-[60vh] w-full items-center justify-center">
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
    </div>
  )
}

function LazyPage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<Loading />}>{children}</Suspense>
}

function RequireAuth({ children, role }: { children: ReactNode; role?: 'partner' | 'admin' }) {
  const isAuthenticated = useStore((s) => s.isAuthenticated)
  const user = useStore((s) => s.user)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (role && user?.role !== role) return <Navigate to="/login" replace />
  return <>{children}</>
}

const router = createHashRouter([
  {
    path: '/login',
    element: <LazyPage><LoginPage /></LazyPage>,
  },
  {
    path: '/register',
    element: <LazyPage><RegisterPage /></LazyPage>,
  },
  {
    path: '/partner',
    element: <RequireAuth role="partner"><AppLayout /></RequireAuth>,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <LazyPage><PartnerDashboardPage /></LazyPage> },
      { path: 'leads', element: <LazyPage><LeadMiningPage /></LazyPage> },
      { path: 'evaluation', element: <LazyPage><LeadEvaluationPage /></LazyPage> },
      { path: 'crm', element: <LazyPage><CrmPage /></LazyPage> },
      { path: 'binding', element: <LazyPage><BindingPage /></LazyPage> },
      { path: 'channel', element: <LazyPage><SubPartnerPage /></LazyPage> },
      { path: 'training', element: <LazyPage><TrainingPage /></LazyPage> },
      { path: 'aigc', element: <LazyPage><AigcPage /></LazyPage> },
      { path: 'red-packets', element: <LazyPage><RedPacketPage /></LazyPage> },
      { path: 'settlement', element: <LazyPage><SettlementPage /></LazyPage> },
      { path: 'profile', element: <LazyPage><ProfilePage /></LazyPage> },
    ],
  },
  {
    path: '/admin',
    element: <RequireAuth role="admin"><AppLayout /></RequireAuth>,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <LazyPage><AdminDashboardPage /></LazyPage> },
      { path: 'leads', element: <LazyPage><LeadConsolePage /></LazyPage> },
      { path: 'partners', element: <LazyPage><PartnerManagementPage /></LazyPage> },
      { path: 'tracking', element: <LazyPage><BusinessTrackingPage /></LazyPage> },
      { path: 'bindings', element: <LazyPage><AdminBindingConsolePage /></LazyPage> },
      { path: 'white-label', element: <LazyPage><WhiteLabelPage /></LazyPage> },
      { path: 'products', element: <LazyPage><ProductShelfPage /></LazyPage> },
      { path: 'incentives', element: <LazyPage><IncentiveManagementPage /></LazyPage> },
      { path: 'settlements', element: <LazyPage><AdminSettlementPage /></LazyPage> },
      { path: 'training', element: <LazyPage><AdminTrainingPage /></LazyPage> },
      { path: 'aigc', element: <LazyPage><AdminAigcPage /></LazyPage> },
      { path: 'profile', element: <LazyPage><ProfilePage /></LazyPage> },
    ],
  },
  { path: '*', element: <Navigate to="/login" replace /> },
])

export default function App() {
  return <RouterProvider router={router} />
}
