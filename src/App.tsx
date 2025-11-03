import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/ui/protected-route";
import { useTokenExpiration } from "@/hooks/use-token-expiration";
import { BulkChunksProvider } from "@/contexts/BulkChunksContext";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CompanyDetails from "./pages/CompanyDetails";
import ExpertInterviewDetails from "./pages/ExpertInterviewDetails";
import ExpertInterviewsList from "./pages/ExpertInterviewsList";
import Triggers from "./pages/Triggers";
import Notifications from "./pages/Notifications";
import AISearch from "./pages/AISearch";
import DataCatalogue from "./pages/DataCatalogue";
import NotFound from "./pages/NotFound";

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
