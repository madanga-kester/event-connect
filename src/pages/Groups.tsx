import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Users, MapPin, PlusCircle, Search, Loader2, 
  AlertCircle, ArrowLeft, UserPlus, LogOut,
  ArrowRight
} from "lucide-react";

interface Group {
  id: number;
  name: string;
  description?: string;
  coverImage?: string;
  organizerId: number;
  organizer?: {
    firstName: string;
    lastName: string;
  };
  city?: string;
  country?: string;
  memberCount: number;
  isActive: boolean;
  createdAt: string;
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5260/api";

const Groups = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [actionInProgress, setActionInProgress] = useState<number | null>(null);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/groups`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch groups");
      }

      const data = await response.json();
      setGroups(data || []);
    } catch (err) {
      console.error("Failed to fetch groups:", err);
      setError("Could not load groups. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (groupId: number) => {
    const token = localStorage.getItem("auth_token");
    
    if (!token) {
      navigate("/login", { state: { from: "/groups" } });
      return;
    }

    try {
      setActionInProgress(groupId);
      const response = await fetch(`${API_BASE}/groups/${groupId}/join`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error("Failed to join group");
      }

      // Update local state
      setGroups(prev => prev.map(g => 
        g.id === groupId ? { ...g, memberCount: g.memberCount + 1 } : g
      ));
    } catch (err) {
      console.error("Join failed:", err);
      alert("Failed to join group. Please try again.");
    } finally {
      setActionInProgress(null);
    }
  };

  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (group.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesLocation = !locationFilter || 
                           group.city?.toLowerCase() === locationFilter.toLowerCase() ||
                           group.country?.toLowerCase() === locationFilter.toLowerCase();
    return matchesSearch && matchesLocation;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-16">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-muted-foreground">Loading groups...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background pt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Oops!</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={fetchGroups}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-2 -ml-2">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-foreground">Groups</h1>
            <p className="text-muted-foreground mt-1">
              Find and join communities around your interests • {groups.length} groups
            </p>
          </div>
          <Button onClick={() => navigate("/create-group")} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Create Group
          </Button>
        </div>

        {/* Search & Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Input
            placeholder="Filter by location (e.g., Nairobi)"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          />
        </div>

        {/* Empty State */}
        {filteredGroups.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">No groups found</h3>
              <p className="text-muted-foreground text-sm mb-6">
                {searchQuery || locationFilter 
                  ? "Try adjusting your search or filters"
                  : "Be the first to create a group in your area!"}
              </p>
              {(searchQuery || locationFilter) && (
                <Button variant="outline" onClick={() => { setSearchQuery(""); setLocationFilter(""); }}>
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Groups Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map((group) => (
              <Card key={group.id} className="group overflow-hidden border-border bg-card hover:border-primary/50 transition-all">
                {/* Group Cover Image */}
                <div className="relative h-32 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
                  {group.coverImage ? (
                    <img
                      src={group.coverImage}
                      alt={group.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x200?text=Group";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Users className="h-12 w-12 text-primary/40" />
                    </div>
                  )}
                </div>

                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {group.name}
                    </h3>
                  </div>
                </CardHeader>

                <CardContent className="pb-4">
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {group.description || "No description available"}
                  </p>
                  
                  <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
                    {(group.city || group.country) && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{[group.city, group.country].filter(Boolean).join(", ")}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      <span>{group.memberCount} members</span>
                    </div>
                    {group.organizer && (
                      <div className="flex items-center gap-1.5">
                        <UserPlus className="h-3.5 w-3.5" />
                        <span>Organized by {group.organizer.firstName} {group.organizer.lastName}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    

                  
<Button 
  size="sm" 
  variant="ghost" 
  className="h-8 px-2 text-muted-foreground hover:text-primary"
  onClick={() => navigate(`/groups/${group.id}`)}  // ✅ NEW: Navigate to detail page
>
  View Group
  <ArrowRight className="h-3.5 w-3.5 ml-1" />
</Button>
                  

                    <Button 
                      size="sm" 
                      onClick={() => handleJoinGroup(group.id)}
                      disabled={actionInProgress === group.id}
                      className="gap-1.5"
                    >
                      {actionInProgress === group.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Users className="h-4 w-4" />
                      )}
                      Join
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Groups;