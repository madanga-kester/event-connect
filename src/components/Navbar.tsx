import { Search, MapPin, Bell, Sun, Moon, User, Menu, X, LogOut, Settings, ChevronDown, PlusCircle, Sparkles, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { handleLogout } from "@/lib/logout";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [user, setUser] = useState<{ firstName: string; lastName: string; email: string } | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);
  const navigate = useNavigate();

  const checkAuth = useCallback(() => {
    const token = localStorage.getItem("auth_token");
    const userData = localStorage.getItem("user");
    
    if (token && userData) {
      try {
        const parsed = JSON.parse(userData);
        const newUser = {
          firstName: parsed.firstName || "User",
          lastName: parsed.lastName || "",
          email: parsed.email || ""
        };
        
        setUser((prevUser) => {
          const isSameUser = prevUser && 
            prevUser.firstName === newUser.firstName && 
            prevUser.lastName === newUser.lastName && 
            prevUser.email === newUser.email;
          
          if (!isSameUser && !hasShownWelcome) {
            toast.success(`Welcome back, ${newUser.firstName}!`);
            setHasShownWelcome(true);
          }
          
          return isSameUser ? prevUser : newUser;
        });
      } catch (e) {
        console.error("Failed to parse user data:", e);
        setUser(null);
      }
    } else {
      setUser(null);
      setHasShownWelcome(false);
    }
  }, [hasShownWelcome]);

  useEffect(() => {
    checkAuth();
    window.addEventListener("storage", checkAuth);
    return () => window.removeEventListener("storage", checkAuth);
  }, [checkAuth]);

  const handleLogoutClick = () => {
    setUserDropdownOpen(false);
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    setUser(null);
    setHasShownWelcome(false);
    handleLogout(navigate, "/");
    toast.success("Successfully logged out");
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-gradient font-display text-xl font-bold tracking-tight">
              LinkUp254
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link to="/" className="text-foreground hover:text-primary transition-colors">Explore</Link>
            <Link to="/events" className="text-muted-foreground hover:text-primary transition-colors">
              Events
            </Link>
            <Link to="/groups" className="text-muted-foreground hover:text-primary transition-colors">Groups</Link>
            <Link to="/map" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> Map
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={toggleTheme}>
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hidden sm:inline-flex">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hidden sm:inline-flex">
              <Bell className="h-4 w-4" />
            </Button>
            
            {user ? (
              <div className="relative">
                <Button 
                  variant="ghost" 
                  className="flex items-center gap-2 h-9 px-3 hover:bg-muted/50"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                >
                  <span className="hidden lg:inline text-sm text-muted-foreground">
                    Hi, <span className="text-foreground font-medium">{user.firstName}</span>
                  </span>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-xs font-semibold">
                    {getInitials(user.firstName, user.lastName)}
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${userDropdownOpen ? "rotate-180" : ""}`} />
                </Button>
                
                {userDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserDropdownOpen(false)} />
                    <div className="absolute right-0 top-10 z-50 w-56 rounded-xl border border-border bg-card shadow-lg p-2">
                      <div className="p-3 border-b border-border">
                        <p className="font-semibold text-foreground">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      
                      <div className="py-1">
                        <Link 
                          to="/create-event" 
                          className="flex items-center gap-2 px-3 py-2 text-sm text-primary hover:text-primary/90 hover:bg-primary/10 rounded-lg font-medium"
                          onClick={() => { setUserDropdownOpen(false); setMobileOpen(false); }}
                        >
                          <PlusCircle className="h-4 w-4" />
                          Create Event
                        </Link>
                        
                        <Link 
                          to="/manage-interests" 
                          className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                          onClick={() => { setUserDropdownOpen(false); setMobileOpen(false); }}
                        >
                          <Sparkles className="h-4 w-4" />
                          Manage Interests
                        </Link>

                        <Link 
                          to="/my-events" 
                          className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                          onClick={() => { setUserDropdownOpen(false); setMobileOpen(false); }}
                        >
                          <Calendar className="h-4 w-4" />
                          My Events
                        </Link>

                        <Link 
                          to="/groups" 
                          className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                          onClick={() => { setUserDropdownOpen(false); setMobileOpen(false); }}
                        >
                          <Users className="h-4 w-4" />
                          Groups
                        </Link>

                        <Link 
                          to="/profile" 
                          className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                          onClick={() => { setUserDropdownOpen(false); setMobileOpen(false); }}
                        >
                          <User className="h-4 w-4" />
                          My Profile
                        </Link>
                        <Link 
                          to="/settings" 
                          className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                          onClick={() => { setUserDropdownOpen(false); setMobileOpen(false); }}
                        >
                          <Settings className="h-4 w-4" />
                          Settings
                        </Link>
                      </div>
                      
                      <div className="pt-1 border-t border-border">
                        <button 
                          onClick={handleLogoutClick}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg"
                        >
                          <LogOut className="h-4 w-4" />
                          Logout
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link to="/login">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-2 h-9 px-4 text-sm font-medium border-primary/30 hover:bg-primary/10 hover:text-primary"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Login</span>
                </Button>
              </Link>
            )}
            
            <Button variant="ghost" size="icon" className="md:hidden text-muted-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-background px-4 pb-4 pt-2 space-y-2">
            <Link to="/" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-foreground">Explore</Link>
            <Link to="/groups" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-muted-foreground">Groups</Link>
            <Link to="/map" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-muted-foreground">Map</Link>
            {user ? (
              <>
                <div className="flex items-center gap-3 py-2 border-t border-border mt-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-sm font-semibold">
                    {getInitials(user.firstName, user.lastName)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Hi, {user.firstName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
                
                <Link 
                  to="/create-event" 
                  onClick={() => { setMobileOpen(false); setUserDropdownOpen(false); }}
                  className="flex items-center gap-2 py-2 text-sm font-medium text-primary"
                >
                  <PlusCircle className="h-4 w-4" />
                  Create Event
                </Link>
                
                <Link 
                  to="/interests" 
                  onClick={() => { setMobileOpen(false); setUserDropdownOpen(false); }}
                  className="flex items-center gap-2 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  <Sparkles className="h-4 w-4" />
                  Manage Interests
                </Link>
                
                <Link to="/profile" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-muted-foreground">Profile</Link>
                <Link to="/settings" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-muted-foreground">Settings</Link>
                <button 
                  onClick={handleLogoutClick}
                  className="block w-full py-2 text-sm font-medium text-destructive"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMobileOpen(false)}>
                <Button 
                  variant="default"
                  size="sm" 
                  className="flex items-center gap-2 h-9 px-4 text-sm font-medium"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Login</span>
                </Button>
              </Link>
            )}
          </div>
        )}
      </nav>

      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out? You will need to sign in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelLogout}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Navbar;