import { Search, MapPin, Users, Plus, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="text-gradient font-display text-xl font-bold tracking-tight">
            Eventora
          </span>
        </div>

        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          <a href="/" className="text-foreground hover:text-primary transition-colors">Explore</a>
          <a href="/groups" className="text-muted-foreground hover:text-primary transition-colors">Groups</a>
          <a href="/map" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> Map
          </a>
          <a href="/interests" className="text-muted-foreground hover:text-primary transition-colors">Interests</a>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Bell className="h-4 w-4" />
          </Button>
          <Button size="sm" className="bg-gradient-warm text-primary-foreground font-display font-semibold hover:opacity-90 transition-opacity">
            <Plus className="h-4 w-4 mr-1" /> Post Event
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
