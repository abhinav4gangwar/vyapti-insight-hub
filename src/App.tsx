import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/ui/protected-route";
import { useTokenExpiration } from "@/hooks/use-token-expiration";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CompanyDetails from "./pages/CompanyDetails";
import Triggers from "./pages/Triggers";
import Notifications from "./pages/Notifications";
import AISearch from "./pages/AISearch";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  // Use token expiration hook globally
  useTokenExpiration();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/companies/:isin" element={
            <ProtectedRoute>
              <CompanyDetails />
            </ProtectedRoute>
          } />
          <Route path="/triggers" element={
            <ProtectedRoute>
              <Triggers />
            </ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          } />
          <Route path="/ai-search" element={
            <ProtectedRoute>
              <AISearch />
            </ProtectedRoute>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
