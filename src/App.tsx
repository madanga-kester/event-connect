import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/use-theme";

// Public Pages
import Index from "./pages/Index.tsx";
import Groups from "./pages/Groups.tsx";
import MapView from "./pages/MapView.tsx";
import Interests from "./pages/Interests.tsx";
import Login from "./pages/Login.tsx";

// Admin Pages
import AdminLogin from "./pages/AdminLogin.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";

// Utility Pages
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* ==================== PUBLIC ROUTES ==================== */}
            <Route path="/" element={<Index />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/interests" element={<Interests />} />
            <Route path="/login" element={<Login />} />
            
            {/* ==================== ADMIN ROUTES ==================== */}
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminDashboard />} />
            {/* Future admin routes:
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/events" element={<AdminEvents />} />
                <Route path="/admin/groups" element={<AdminGroups />} />
                <Route path="/admin/moderation" element={<AdminModeration />} />
                <Route path="/admin/analytics" element={<AdminAnalytics />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
            */}
            
            {/* ==================== 404 - MUST BE LAST ==================== */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;