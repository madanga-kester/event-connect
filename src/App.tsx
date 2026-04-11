import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/use-theme";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";

//  PUBLIC PAGES 
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

//  ADMIN PAGES 
import AdminLogin from "./pages/AdminLogin.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";

//  UTILITY PAGES 
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

//  APP CONTENT WITH CONDITIONAL NAVBAR 
const AppContent = () => {
  const location = useLocation();
  
 
  const noNavbarRoutes = ["/login", "/admin-login", "/admin"];
  const shouldShowNavbar = !noNavbarRoutes.includes(location.pathname);

  return (
    <>
      {/* Conditionally render Navbar */}
      {shouldShowNavbar && <Navbar />}
      
    
      <div className={shouldShowNavbar ? "pt-16" : ""}>
        <Routes>
          {/*  HOME & MAIN FEEDS  */}
          <Route path="/" element={<Index />} />
          
          {/*  EVENTS  */}
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/create-event" element={<CreateEvent />} />
          <Route path="/my-events" element={<MyEvents />} />
          
          {/*  GROUPS  */}
          <Route path="/groups" element={<Groups />} />
          <Route path="/create-group" element={<CreateGroup />} />
          <Route path="/groups/:id" element={<GroupDetail />} />
          <Route path="/groups/:id/settings" element={<GroupSettings />} />
          
          {/*  MAP & LOCATION  */}
          <Route path="/map" element={<MapView />} />
          
          {/*  INTERESTS */}
          <Route path="/interests" element={<Interests />} />
          <Route path="/manage-interests" element={<ManageInterests />} />
          
          {/* USER PROFILE & AUTH  */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/login" element={<Login />} />
          
          {/*  ADMIN ROUTES */}
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          
          {/*  404 -*/}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </>
  );
};

//  MAIN APP COMPONENT 
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