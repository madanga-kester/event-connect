import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users, MapPin, Calendar, Share2, ArrowLeft, Loader2,
  AlertCircle, CheckCircle, UserPlus, LogOut, Trash2, Settings
} from "lucide-react";
import GroupChat from "@/components/GroupChat";

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
  };
  city?: string;
  country?: string;
  memberCount: number;
  isActive: boolean;
  createdAt: string;
  groupMembers?: Array<{
    id: number;
    userId: number;
    role: string;
    user: {
      firstName: string;
      lastName: string;
      profilePicture?: string;
    };
  }>;
  groupEvents?: Array<{
    id: number;
    eventId: number;
    event: {
      id: number;
      title: string;
      startTime: string;
      location?: string;
      price?: number;
      isFree: boolean;
    };
  }>;
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5260/api";

const GroupDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  
  // Get current user ID for chat and membership checks
  const userData = localStorage.getItem("user");
  const currentUserId = userData ? JSON.parse(userData).id : null;

  useEffect(() => {
    if (id) {
      fetchGroup(id);
    }
  }, [id]);

  const fetchGroup = async (groupId: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token");

      const response = await fetch(`${API_BASE}/groups/${groupId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Group not found");
        }
        throw new Error("Failed to fetch group");
      }

      const data = await response.json();
      setGroup(data);

      // Check membership status
      if (currentUserId) {
        setIsOrganizer(data.organizerId === currentUserId);
        setIsMember(
          data.groupMembers?.some(
            (m: any) => m.userId === currentUserId && m.isActive
          ) || false
        );
      }
    } catch (err: any) {
      console.error("Failed to fetch group:", err);
      setError(err.message || "Could not load group details");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      navigate("/login", { state: { from: `/groups/${id}` } });
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`${API_BASE}/groups/${id}/join`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Failed to join group");

      setIsMember(true);
      setGroup(prev => prev ? { ...prev, memberCount: prev.memberCount + 1 } : null);
    } catch (err) {
      console.error("Join failed:", err);
      alert("Failed to join group. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm("Are you sure you want to leave this group?")) return;
    
    const token = localStorage.getItem("auth_token");
    if (!token) return;

    try {
      setActionLoading(true);
      const response = await fetch(`${API_BASE}/groups/${id}/leave`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Failed to leave group");

      setIsMember(false);
      setGroup(prev => prev ? { ...prev, memberCount: Math.max(0, prev.memberCount - 1) } : null);
    } catch (err) {
      console.error("Leave failed:", err);
      alert("Failed to leave group. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!confirm("Are you sure you want to delete this group? This cannot be undone.")) return;
    
    const token = localStorage.getItem("auth_token");
    if (!token) return;

    try {
      setActionLoading(true);
      const response = await fetch(`${API_BASE}/groups/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Failed to delete group");

      alert("Group deleted successfully");
      navigate("/groups");
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete group. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = `Check out this group: ${group?.name}`;

    switch (platform) {
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
        break;
      case "twitter":
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, "_blank");
        break;
      case "whatsapp":
        window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`, "_blank");
        break;
      case "copy":
        navigator.clipboard.writeText(url);
        alert("Link copied to clipboard!");
        break;
    }
    setShowShareMenu(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-KE", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-16">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-muted-foreground">Loading group details...</p>
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="min-h-screen bg-background pt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Oops!</h2>
            <p className="text-muted-foreground mb-6">{error || "Group not found"}</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate("/")}>
                Go Home
              </Button>
              <Button onClick={() => navigate("/groups")}>
                Browse Groups
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Hero Cover Image */}
      <div className="relative h-48 md:h-64 w-full overflow-hidden bg-gradient-to-br from-primary/20 via-purple-500/20 to-pink-500/20">
        {group.coverImage ? (
          <img
            src={group.coverImage}
            alt={group.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://placehold.co/1200x300/6b7280/ffffff?text=${encodeURIComponent(group.name.substring(0, 20))}`;
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Users className="h-16 w-16 text-primary/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm hover:bg-background/90"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>

        {/* Share & Action Buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="bg-background/80 backdrop-blur-sm hover:bg-background/90"
            >
              <Share2 className="h-5 w-5 text-foreground" />
            </Button>
            
            {showShareMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowShareMenu(false)} />
                <div className="absolute right-0 top-10 z-50 w-48 rounded-lg border border-border bg-card shadow-lg p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare("facebook")}
                    className="w-full justify-start gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Facebook
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare("twitter")}
                    className="w-full justify-start gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Twitter
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare("whatsapp")}
                    className="w-full justify-start gap-2"
                  >
                    <Users className="h-4 w-4" />
                    WhatsApp
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare("copy")}
                    className="w-full justify-start gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Copy Link
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Group Header */}
            <div>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary">{group.city}, {group.country}</Badge>
                <Badge variant="outline">{group.memberCount} members</Badge>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {group.name}
              </h1>

              {/* Quick Info */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  <span>{group.city}, {group.country}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>Created {formatDate(group.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <Card className="border-primary/20">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  {isOrganizer ? (
                    <>
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => navigate(`/groups/${id}/settings`)}
                        className="flex-1 gap-2"
                      >
                        <Settings className="h-4 w-4" />
                        Manage Group
                      </Button>
                      <Button
                        size="lg"
                        variant="destructive"
                        onClick={handleDeleteGroup}
                        disabled={actionLoading}
                        className="gap-2"
                      >
                        {actionLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        Delete
                      </Button>
                    </>
                  ) : isMember ? (
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={handleLeaveGroup}
                      disabled={actionLoading}
                      className="gap-2"
                    >
                      {actionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <LogOut className="h-4 w-4" />
                      )}
                      Leave Group
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      onClick={handleJoinGroup}
                      disabled={actionLoading}
                      className="gap-2"
                    >
                      {actionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserPlus className="h-4 w-4" />
                      )}
                      Join Group
                    </Button>
                  )}
                </div>

                {/* Member Count */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
                    </span>
                    {isMember && (
                      <span className="text-green-600 font-medium flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        You're a member
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Group Description */}
            <Card>
              <CardHeader>
                <CardTitle>About This Group</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground leading-relaxed whitespace-pre-line">
                  {group.description || "No description available"}
                </p>
              </CardContent>
            </Card>

            {/* Group Chat */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Group Chat</span>
                  {isOrganizer && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => navigate(`/groups/${id}/settings`)}
                      className="gap-1 h-auto px-2 py-1"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {id && <GroupChat groupId={parseInt(id)} currentUserId={currentUserId} />}
              </CardContent>
            </Card>

            {/* Group Events */}
            {group.groupEvents && group.groupEvents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Upcoming Events
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {group.groupEvents.map((ge) => (
                    <div
                      key={ge.id}
                      className="p-4 border border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/events/${ge.event.id}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-foreground">{ge.event.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {formatDate(ge.event.startTime)} • {ge.event.location || "Location TBD"}
                          </p>
                        </div>
                        <Badge variant={ge.event.isFree ? "secondary" : "default"}>
                          {ge.event.isFree ? "Free" : `KES ${ge.event.price?.toLocaleString()}`}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Organizer Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Organizer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-semibold">
                      {group.organizer?.firstName?.charAt(0)}{group.organizer?.lastName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">
                      {group.organizer?.firstName} {group.organizer?.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">Group Organizer</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Members Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Members ({group.memberCount})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {group.groupMembers && group.groupMembers.length > 0 ? (
                  <div className="space-y-3">
                    {group.groupMembers.slice(0, 5).map((member) => (
                      <div key={member.id} className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.user.profilePicture} />
                          <AvatarFallback className="text-xs">
                            {member.user.firstName?.charAt(0)}{member.user.lastName?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {member.user.firstName} {member.user.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                        </div>
                      </div>
                    ))}
                    {group.memberCount > 5 && (
                      <p className="text-xs text-muted-foreground text-center pt-2">
                        +{group.memberCount - 5} more members
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No members yet — be the first to join!
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Share Widget */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Share Group</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleShare("facebook")}
                    className="h-10 w-10"
                  >
                    <Users className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleShare("twitter")}
                    className="h-10 w-10"
                  >
                    <Users className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleShare("whatsapp")}
                    className="h-10 w-10"
                  >
                    <Users className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleShare("copy")}
                    className="h-10 w-10"
                  >
                    <Users className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupDetail;