import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Users, MapPin, PlusCircle, Search, Loader2, 
  AlertCircle, ArrowLeft, UserPlus, LogOut,
  ArrowRight, CheckCircle, Crown, FolderOpen, Star
} from "lucide-react";

interface Group {
  id: number;
  name: string;
  description?: string;
  coverImage?: string;
  organizerId: number;
  organizer?: {
    id: number;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
  city?: string;
  country?: string;
  memberCount: number;
  isActive: boolean;
  createdAt: string;
  isJoined?: boolean;
  joinedAt?: string;
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5260/api";

const MyGroups = () => {
  const navigate = useNavigate();
  const [createdGroups, setCreatedGroups] = useState<Group[]>([]);
  const [joinedGroups, setJoinedGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createdSearch, setCreatedSearch] = useState("");
  const [joinedSearch, setJoinedSearch] = useState("");
  const [actionInProgress, setActionInProgress] = useState<number | null>(null);

  const userData = localStorage.getItem("user");
  const currentUserId = userData ? JSON.parse(userData).id : null;
  const authToken = localStorage.getItem("auth_token");

  useEffect(() => {
    if (!authToken || !currentUserId) {
      navigate("/login", { state: { from: "/my-groups" } });
      return;
    }
    fetchMyGroups();
  }, []);

    const fetchMyGroups = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE}/groups/my-groups`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (!response.ok && response.status !== 404) {
        throw new Error("Failed to fetch groups");
      }

      const allGroups = response.status === 200 ? await response.json() : [];
      
      const created = allGroups.filter((g: Group) => g.organizerId === currentUserId);
      const joined = allGroups.filter((g: Group) => g.organizerId !== currentUserId);

      const createdWithCount = created.map((g: any) => ({
        ...g,
        memberCount: typeof g.memberCount === "number" && g.memberCount >= 0 ? g.memberCount : 0
      }));

      const joinedWithCount = joined.map((g: any) => ({
        ...g,
        memberCount: typeof g.memberCount === "number" && g.memberCount >= 0 ? g.memberCount : 0,
        isJoined: true
      }));

      setCreatedGroups(createdWithCount);
      setJoinedGroups(joinedWithCount);
    } catch (err) {
      console.error("Failed to fetch my groups:", err);
      setError("Could not load your groups. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  

  const handleLeaveGroup = async (groupId: number) => {
    if (!authToken) return;

    try {
      setActionInProgress(groupId);
      const response = await fetch(`${API_BASE}/groups/${groupId}/leave`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${authToken}` }
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to leave group");
      }

      setJoinedGroups(prev => prev.filter(g => g.id !== groupId));
    } catch (err: any) {
      console.error("Leave failed:", err);
      alert(err.message || "Failed to leave group. Please try again.");
    } finally {
      setActionInProgress(null);
    }
  };

  const filteredCreated = createdGroups.filter(group =>
    group.name.toLowerCase().includes(createdSearch.toLowerCase()) ||
    (group.description?.toLowerCase().includes(createdSearch.toLowerCase()) ?? false)
  );

  const filteredJoined = joinedGroups.filter(group =>
    group.name.toLowerCase().includes(joinedSearch.toLowerCase()) ||
    (group.description?.toLowerCase().includes(joinedSearch.toLowerCase()) ?? false)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-16">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-muted-foreground">Loading your groups...</p>
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
            <Button onClick={fetchMyGroups}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-2 -ml-2">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-foreground">My Groups</h1>
            <p className="text-muted-foreground mt-1">
              Manage groups you've created or joined
            </p>
          </div>
          <Button onClick={() => navigate("/create-group")} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Create New Group
          </Button>
        </div>

        <div className="space-y-10">
          
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Created Groups</h2>
                <Badge variant="secondary">{createdGroups.length}</Badge>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search your groups..."
                  value={createdSearch}
                  onChange={(e) => setCreatedSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {filteredCreated.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                    <FolderOpen className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {createdSearch ? "No matching groups found" : "You haven't created any groups yet"}
                  </p>
                  {!createdSearch && (
                    <Button variant="link" size="sm" onClick={() => navigate("/create-group")} className="mt-2">
                      Create your first group
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCreated.map((group) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    isCreated={true}
                    onAction={handleLeaveGroup}
                    actionInProgress={actionInProgress}
                    onView={() => navigate(`/groups/${group.id}`)}
                    onManage={() => navigate(`/groups/${group.id}/settings`)}
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500" />
                <h2 className="text-xl font-semibold text-foreground">Joined Groups</h2>
                <Badge variant="secondary">{joinedGroups.length}</Badge>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search joined groups..."
                  value={joinedSearch}
                  onChange={(e) => setJoinedSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {filteredJoined.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                    <Star className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {joinedSearch ? "No matching groups found" : "You haven't joined any groups yet"}
                  </p>
                  {!joinedSearch && (
                    <Button variant="link" size="sm" onClick={() => navigate("/groups")} className="mt-2">
                      Browse groups to join
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredJoined.map((group) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    isCreated={false}
                    onAction={handleLeaveGroup}
                    actionInProgress={actionInProgress}
                    onView={() => navigate(`/groups/${group.id}`)}
                  />
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
};

interface GroupCardProps {
  group: Group;
  isCreated: boolean;
  onAction: (groupId: number) => void;
  actionInProgress: number | null;
  onView: () => void;
  onManage?: () => void;
}

const GroupCard = ({ group, isCreated, onAction, actionInProgress, onView, onManage }: GroupCardProps) => {
  const memberCount = typeof group.memberCount === "number" ? group.memberCount : 0;
  
  return (
    <Card className="group overflow-hidden border-border bg-card hover:border-primary/50 transition-all">
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
        
        {isCreated && (
          <Badge className="absolute top-3 right-3 bg-primary/90 text-white border-0">
            <Crown className="h-3 w-3 mr-1" /> Organizer
          </Badge>
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
        
        <div className="space-y-2 mb-4">
          {(group.city || group.country) && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span>{[group.city, group.country].filter(Boolean).join(", ")}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 py-1">
            <Users className="h-4 w-4 text-primary" />
            <span className="font-bold text-sm text-foreground">
              {memberCount} {memberCount === 1 ? "member" : "members"}
            </span>
          </div>
          
          {group.organizer && !isCreated && (
            <div className="flex items-center gap-1.5 text-xs">
              <Crown className="h-3.5 w-3.5 text-amber-500" />
              <span className="font-medium text-muted-foreground">
                {group.organizer.firstName} {group.organizer.lastName}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 px-2 text-muted-foreground hover:text-primary"
            onClick={onView}
          >
            View Group
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
          
          {isCreated ? (
            <Button 
              size="sm" 
              variant="outline"
              onClick={onManage}
              className="gap-1.5"
            >
              Manage
            </Button>
          ) : (
            <Button 
              size="sm" 
              variant="destructive"
              onClick={() => onAction(group.id)}
              disabled={actionInProgress === group.id}
              className="gap-1.5"
            >
              {actionInProgress === group.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              Leave
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MyGroups;