import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import SymptomChecker from "./pages/SymptomChecker";
import Medication from "./pages/Medication";
import Dashboard from "./pages/Dashboard";
import CaptchaDemo from "./pages/CaptchaDemo";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DiseasePrediction from "./pages/DiseasePrediction";
import HealthChat from "./pages/HealthChat";
import ContactPage from "./pages/contact";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/symptom-checker" element={
        <ProtectedRoute>
          <SymptomChecker />
        </ProtectedRoute>
      } />
      <Route path="/medication" element={
        <ProtectedRoute>
          <Medication />
        </ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/captcha-demo" element={
        <ProtectedRoute>
          <CaptchaDemo />
        </ProtectedRoute>
      } />
      <Route path="/disease-prediction" element={
        <ProtectedRoute>
          <DiseasePrediction />
        </ProtectedRoute>
      } />
      <Route path="/health-chat" element={
        <ProtectedRoute>
          <HealthChat />
        </ProtectedRoute>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">
              <AnimatePresence mode="wait">
                <AppRoutes />
              </AnimatePresence>
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </TooltipProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
