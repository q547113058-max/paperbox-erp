import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { TableSkeleton } from './components/TableStates';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { useAuthStore } from './stores/auth';

// 懒加载页面组件
const Products = lazy(() => import('./pages/Products'));
const Orders = lazy(() => import('./pages/Orders'));
const Purchases = lazy(() => import('./pages/Purchases'));
const Warehouse = lazy(() => import('./pages/Warehouse'));
const Deliveries = lazy(() => import('./pages/Deliveries'));
const Finance = lazy(() => import('./pages/Finance'));
const Receivables = lazy(() => import('./pages/Receivables'));
const Payables = lazy(() => import('./pages/Payables'));
const Customers = lazy(() => import('./pages/Customers'));
const Suppliers = lazy(() => import('./pages/Suppliers'));
const Personnel = lazy(() => import('./pages/Personnel'));
const WorkOrders = lazy(() => import('./pages/WorkOrders'));
const OutsourcingOrders = lazy(() => import('./pages/OutsourcingOrders'));
const ReconciliationBills = lazy(() => import('./pages/ReconciliationBills'));
const KnifeDies = lazy(() => import('./pages/KnifeDies'));
const ColorPrints = lazy(() => import('./pages/ColorPrints'));
const GlobalSearch = lazy(() => import('./pages/GlobalSearch'));
const Settings = lazy(() => import('./pages/Settings'));
const ActionLogs = lazy(() => import('./pages/ActionLogs'));

// 加载中组件 — 表格骨架（避免白屏闪烁，dw-skills §04 第 6 条）
const Loading = () => <TableSkeleton rows={8} columns={6} />;

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Suspense fallback={<Loading />}>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/products" element={<Products />} />
                      <Route path="/orders" element={<Orders />} />
                      <Route path="/purchases" element={<Purchases />} />
                      <Route path="/warehouse" element={<Warehouse />} />
                      <Route path="/deliveries" element={<Deliveries />} />
                      <Route path="/finance" element={<Finance />} />
                      <Route path="/receivables" element={<Receivables />} />
                      <Route path="/payables" element={<Payables />} />
                      <Route path="/customers" element={<Customers />} />
                      <Route path="/suppliers" element={<Suppliers />} />
                      <Route path="/personnel" element={<Personnel />} />
                      <Route path="/work_orders" element={<WorkOrders />} />
                      <Route path="/outsourcing_orders" element={<OutsourcingOrders />} />
                      <Route path="/reconciliation_bills" element={<ReconciliationBills />} />
                      <Route path="/knife_dies" element={<KnifeDies />} />
                      <Route path="/color_prints" element={<ColorPrints />} />
                      <Route path="/search" element={<GlobalSearch />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/action_logs" element={<ActionLogs />} />
                    </Routes>
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}