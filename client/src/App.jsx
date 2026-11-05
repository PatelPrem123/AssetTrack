import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { AssetsPage } from './pages/AssetsPage';
import { AssetRegisterPage } from './pages/AssetRegisterPage';
import { AssignmentsPage } from './pages/AssignmentsPage';
import { MaintenancePage } from './pages/MaintenancePage';
import { InventoryPage } from './pages/InventoryPage';
import { ReportsPage } from './pages/ReportsPage';
import { OrganizationPage } from './pages/OrganizationPage';
import { useThemeStore } from './store/themeStore';
import { useAuthStore } from './store/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function App() {
  const { initTheme } = useThemeStore();
  const { isAuthenticated, checkAuth } = useAuthStore();

  useEffect(() => {
    initTheme();
    checkAuth();
  }, [initTheme, checkAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
          <Navbar />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              <Routes>
                {/* Home route: Dashboard if logged in, Landing if guest */}
                <Route
                  path="/"
                  element={isAuthenticated ? <DashboardPage /> : <LandingPage />}
                />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/assets" element={<AssetsPage />} />
                <Route path="/assets/new" element={<AssetRegisterPage />} />
                <Route path="/scanner" element={<AssetsPage />} />
                <Route path="/assignments" element={<AssignmentsPage />} />
                <Route path="/maintenance" element={<MaintenancePage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/inventory/movements" element={<InventoryPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/organization" element={<OrganizationPage />} />

                {/* 404 Fallback */}
                <Route
                  path="*"
                  element={
                    <div className="text-center py-20">
                      <h2 className="text-2xl font-bold">404 - Not Found</h2>
                      <p className="text-slate-500 mt-2">The requested view could not be found.</p>
                    </div>
                  }
                />
              </Routes>
            </main>
          </div>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
