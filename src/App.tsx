import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProtectedRoute } from "@/components/ui/protected-route";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BulkChunksProvider } from "@/contexts/BulkChunksContext";
import { useTokenExpiration } from "@/hooks/use-token-expiration";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AISearch from "./pages/AISearch";
import ActivityLogs from "./pages/ActivityLogs";
import ChangePassword from "./pages/ChangePassword";
import CompanyDetails from "./pages/CompanyDetails";
import UnlistedCompanyDetails from "./pages/UnlistedCompanyDetails";
import Dashboard from "./pages/Dashboard";
import DataCatalogue from "./pages/DataCatalogue";
import ExpertInterviewDetails from "./pages/ExpertInterviewDetails";
import ExpertInterviewsList from "./pages/ExpertInterviewsList";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import Triggers from "./pages/Triggers";
import DGTRDashboard from "./pages/analytics-dashboards/dgtr-db";
import InvestigationPage from "./pages/analytics-dashboards/dgtr-investigation-page";
import VahanDashboardPage from "./pages/analytics-dashboards/vahan-db";

const queryClient = new QueryClient();

const App = () => {
  // Use token expiration hook globally
  useTokenExpiration();

  return (
    <QueryClientProvider client={queryClient}>
      <BulkChunksProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/companies/:isin" element={
            <ProtectedRoute>
              <DashboardLayout>
                <CompanyDetails />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/companies/unlisted/:companyName" element={
            <ProtectedRoute>
              <DashboardLayout>
                <UnlistedCompanyDetails />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/expert-interviews" element={
            <ProtectedRoute>
              <DashboardLayout>
                <ExpertInterviewsList />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/expert-interviews/:id" element={
            <ProtectedRoute>
              <DashboardLayout>
                <ExpertInterviewDetails />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/triggers" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Triggers />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Notifications />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/ai-search" element={
            <ProtectedRoute>
              <DashboardLayout>
                <AISearch />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/data-catalogue" element={
            <ProtectedRoute>
              <DashboardLayout>
                <DataCatalogue />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Settings />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/change-password" element={
            <ProtectedRoute>
              <DashboardLayout>
                <ChangePassword />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/activity-logs" element={
            <ProtectedRoute>
              <DashboardLayout>
                <ActivityLogs />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/vahan-db" element= {
            <ProtectedRoute>
              <DashboardLayout>
                <VahanDashboardPage />
              </DashboardLayout>
            </ProtectedRoute>
          }/>
          <Route path="/dgtr-db" element= {
            <ProtectedRoute>
              <DashboardLayout>
                <DGTRDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }/>
          <Route path="/dgtr-db/:uuid" element={
            <ProtectedRoute>
              <DashboardLayout>
                <InvestigationPage />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
        </TooltipProvider>
      </BulkChunksProvider>
    </QueryClientProvider>
  );
};

export default App;
