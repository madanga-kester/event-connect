import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/use-theme";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";

import Index from "./pages/Index.tsx";
import Groups from "./pages/Groups.tsx";
import CreateGroup from "./pages/CreateGroup.tsx";
import GroupDetail from "./pages/GroupDetail.tsx";
import GroupSettings from "./pages/GroupSettings.tsx";
import MapView from "./pages/MapView.tsx";
import Interests from "./pages/Interests.tsx";
import ManageInterests from "./pages/ManageInterests.tsx";
import Login from "./pages/Login.tsx";
import Profile from "./pages/Profile.tsx";
import CreateEvent from "./pages/CreateEvent.tsx";
import MyEvents from "./pages/MyEvents.tsx";
import Events from "./pages/Events.tsx";
import EventDetail from "./pages/EventDetail.tsx";
import MyGroups from "./pages/MyGroups.tsx";

import AdminLogin from "./pages/AdminLogin.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";

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
          <Route path="/" element={<Index />} />
          
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/create-event" element={<CreateEvent />} />
          <Route path="/my-events" element={
            <ProtectedRoute>
              <MyEvents />
            </ProtectedRoute>
          } />
          
          <Route path="/groups" element={<Groups />} />
          <Route path="/create-group" element={
            <ProtectedRoute>
              <CreateGroup />
            </ProtectedRoute>
          } />
          <Route path="/groups/:id" element={<GroupDetail />} />
          <Route path="/groups/:id/settings" element={
            <ProtectedRoute>
              <GroupSettings />
            </ProtectedRoute>
          } />
          <Route path="/my-groups" element={
            <ProtectedRoute>
              <MyGroups />
            </ProtectedRoute>
          } />
          
          <Route path="/map" element={<MapView />} />
          
          <Route path="/interests" element={<Interests />} />
          <Route path="/manage-interests" element={
            <ProtectedRoute>
              <ManageInterests />
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/login" element={<Login />} />
          
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
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