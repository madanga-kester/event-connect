import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/use-theme";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";

// Public Pages
import Index from "./pages/Index.tsx";
import Groups from "./pages/Groups.tsx";
import MapView from "./pages/MapView.tsx";
import Interests from "./pages/Interests.tsx";  // ✅ Your original interests page
import Login from "./pages/Login.tsx";
import Profile from "./pages/Profile.tsx";
import CreateEvent from "./pages/CreateEvent.tsx";
import ManageInterests from "./pages/ManageInterests.tsx";  // ✅ Renamed import

// Admin Pages
import AdminLogin from "./pages/AdminLogin.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";

// Utility Pages
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  const noNavbarRoutes = ["/login", "/admin-login", "/admin"];
  const shouldShowNavbar = !noNavbarRoutes.includes(location.pathname);

  return (
    <>
      {shouldShowNavbar && <Navbar />}
      <div className={shouldShowNavbar ? "pt-16" : ""}>
        <Routes>
          {/* ==================== PUBLIC ROUTES ==================== */}
          <Route path="/" element={<Index />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/map" element={<MapView />} />
          
          {/* ✅ Your original interests page */}
          <Route path="/interests" element={<Interests />} />
          
          {/* ✅ NEW: Manage Interests (InterestSelector) at different route */}
          <Route path="/manage-interests" element={<ManageInterests />} />
          
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/create-event" element={<CreateEvent />} />
          
          {/* ==================== ADMIN ROUTES ==================== */}
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          
          {/* ==================== 404 - MUST BE LAST ==================== */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;