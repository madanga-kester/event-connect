import { Search, MapPin, Plus, Bell, Sun, Moon, User, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { Link } from "react-router-dom";
import { useState } from "react";

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-gradient font-display text-xl font-bold tracking-tight">
            Eventora
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link to="/" className="text-foreground hover:text-primary transition-colors">Explore</Link>
          <Link to="/groups" className="text-muted-foreground hover:text-primary transition-colors">Groups</Link>
          <Link to="/map" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> Map
          </Link>
          <Link to="/interests" className="text-muted-foreground hover:text-primary transition-colors">Interests</Link>
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
          <Button size="sm" className="bg-gradient-warm text-primary-foreground font-display font-semibold hover:opacity-90 transition-opacity hidden sm:inline-flex">
            <Plus className="h-4 w-4 mr-1" /> Post Event
          </Button>
          <Link to="/login">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <User className="h-4 w-4" />
            </Button>
          </Link>
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
          <Link to="/interests" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-muted-foreground">Interests</Link>
          <Link to="/login" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-muted-foreground">Login</Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
