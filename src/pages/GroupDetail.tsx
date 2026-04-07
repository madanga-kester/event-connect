import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Users, MapPin, Calendar, Share2, ArrowLeft, Loader2,
  AlertCircle, CheckCircle, UserPlus, LogOut, Trash2, Settings, X, Save, Plus, ListChecks,
  Image as ImageIcon, Crown, Shield, UserMinus, MessageSquare,
  Sparkles, Link2, ArrowUp, Clock, Camera, UserCheck, TrendingUp, Globe, ChevronDown, ChevronUp, FileText, Trash, Eye, EyeOff
} from "lucide-react";
import GroupChat from "@/components/GroupChat";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5260/api";

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
  isPrivate: boolean;
  createdAt: string;
  groupMembers?: Array<{
    id: number;
    userId: number;
    role: string;
    isActive?: boolean;
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
  settings?: GroupSettings;
}

interface GroupSettings {
  isPrivate: boolean;
  allowMemberInvites: boolean;
  allowMemberPosts: boolean;
  moderateMessages: boolean;
  allowLinks: boolean;
  allowMedia: boolean;
  notifyOnNewEvent: boolean;
  notifyOnNewMember: boolean;
}

interface GroupRule {
  id: number;
  title: string;
  description?: string;
  order: number;
}

interface PendingRequest {
  id: number;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
  message?: string;
  requestedAt: string;
}

interface GroupMember {
  id: number;
  userId: number;
  role: string;
  user: {
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
}

interface ActivityItem {
  id: number;
  type: "join" | "post" | "event" | "photo";
  user: { firstName: string; lastName: string };
  description: string;
  createdAt: string;
}

interface DiscussionItem {
  id: number;
  title: string;
  replies: number;
  lastActivity: string;
  trending: boolean;
}

interface GalleryItem {
  id: number;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
}

const GroupDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isMember, setIsMember] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const [settings, setSettings] = useState<GroupSettings>({
    isPrivate: false,
    allowMemberInvites: true,
    allowMemberPosts: true,
    moderateMessages: false,
    allowLinks: true,
    allowMedia: true,
    notifyOnNewEvent: true,
    notifyOnNewMember: false,
  });

  const [rules, setRules] = useState<GroupRule[]>([]);
  const [newRule, setNewRule] = useState({ title: "", description: "" });
  const [savingSettings, setSavingSettings] = useState(false);

  const [members, setMembers] = useState<GroupMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [memberActionLoading, setMemberActionLoading] = useState(false);

  const [coverImage, setCoverImage] = useState<string>("");
  const [coverImageUrl, setCoverImageUrl] = useState<string>("");
  const [coverImageTab, setCoverImageTab] = useState<"upload" | "url">("upload");

  const [showActivityDropdown, setShowActivityDropdown] = useState(false);
  const [showDiscussionsDropdown, setShowDiscussionsDropdown] = useState(false);
  const [showGalleryPopup, setShowGalleryPopup] = useState(false);
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<string>("");

  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [discussions, setDiscussions] = useState<DiscussionItem[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);

  const userData = localStorage.getItem("user");
  const currentUserId = userData ? JSON.parse(userData).id : null;
  const authToken = localStorage.getItem("auth_token");

  const fetchGroup = useCallback(async (groupId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/groups/${groupId}`);
      if (!response.ok) throw new Error(response.status === 404 ? "Group not found" : "Failed to fetch group");

      const data: Group = await response.json();
      setGroup(data);
      
      if (data.coverImage) {
        setCoverImage(data.coverImage);
        if (!data.coverImage.startsWith("")) {
          setCoverImageUrl(data.coverImage);
        }
      }
      
      if (data.settings) {
        setSettings(data.settings);
      }

      if (currentUserId) {
        const isOrg = data.organizerId === currentUserId;
        setIsOrganizer(isOrg);
        setIsMember(data.groupMembers?.some((m: any) => m.userId === currentUserId && m.isActive) || false);

        if (isOrg) {
          // Small delay to ensure settings are set before fetching dependent data
          setTimeout(() => {
            fetchSettings(parseInt(groupId));
            fetchMembers(parseInt(groupId));
            fetchPendingRequests(parseInt(groupId));
          }, 100);
        }
      }
    } catch (err: any) {
      setError(err.message || "Could not load group details");
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  const fetchSettings = async (groupId: number) => {
    try {
      if (!authToken) return;
      const res = await fetch(`${API_BASE}/groups/${groupId}/settings`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) setSettings(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchRules = async (groupId: number) => {
    try {
      const res = await fetch(`${API_BASE}/groups/${groupId}/rules`);
      if (res.ok) setRules(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchMembers = async (groupId: number) => {
    try {
      if (!authToken) {
        setMembersError("Authentication required");
        return;
      }
      setMembersLoading(true);
      setMembersError(null);
      
      const res = await fetch(`${API_BASE}/groups/${groupId}/members`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setMembers(Array.isArray(data) ? data : []);
      } else if (res.status === 401) {
        setMembersError("Please login to view members");
      } else if (res.status === 404) {
        setMembers([]); // No members yet is OK
      } else {
        setMembersError("Failed to load members");
      }
    } catch (err) {
      setMembersError("Network error loading members");
      console.error(err);
    } finally {
      setMembersLoading(false);
    }
  };

  const fetchPendingRequests = async (groupId: number) => {
    try {
      if (!authToken) return;
      const res = await fetch(`${API_BASE}/groups/${groupId}/join-requests/pending`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPendingRequests(Array.isArray(data) ? data : []);
      }
    } catch (err) { console.error(err); }
  };

  const fetchActivityFeed = async (groupId: number) => {
    try {
      const res = await fetch(`${API_BASE}/groups/${groupId}/activity`);
      if (res.ok) setActivityFeed(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchDiscussions = async (groupId: number) => {
    try {
      const res = await fetch(`${API_BASE}/groups/${groupId}/discussions`);
      if (res.ok) setDiscussions(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchGallery = async (groupId: number) => {
    try {
      const res = await fetch(`${API_BASE}/groups/${groupId}/gallery`);
      if (res.ok) setGallery(await res.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (id) {
      const gid = parseInt(id);
      fetchGroup(id);
      fetchRules(gid);
      fetchActivityFeed(gid);
      fetchDiscussions(gid);
      fetchGallery(gid);
    }
  }, [id, fetchGroup]);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (pageRef.current) {
      pageRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const handleJoinGroup = async () => {
    if (!authToken) {
      navigate("/login", { state: { from: `/groups/${id}` } });
      return;
    }

    try {
      setActionLoading(true);
      
      // CRITICAL: Check privacy from BOTH group and settings state
      const isPrivate = group?.isPrivate === true || settings.isPrivate === true;
      
      if (isPrivate) {
        // Send join request for private group
        const response = await fetch(`${API_BASE}/groups/${id}/join-request`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`
          },
          body: JSON.stringify({ message: "I would like to join this group" })
        });
        
        const result = await response.json();
        if (result.isSuccess) {
          alert("Join request sent! Wait for organizer approval.");
        } else {
          alert(result.message || "Failed to send request");
        }
      } else {
        // Auto-join public group
        const response = await fetch(`${API_BASE}/groups/${id}/join`, {
          method: "POST",
          headers: { Authorization: `Bearer ${authToken}` }
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || "Failed to join");
        }
        setIsMember(true);
        setGroup(prev => prev ? { ...prev, memberCount: (prev.memberCount || 0) + 1 } : null);
        alert("Successfully joined the group!");
      }
    } catch (err: any) {
      alert(err.message || "Failed to process request.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm("Are you sure you want to leave this group?")) return;
    if (!authToken) return;
    try {
      setActionLoading(true);
      const response = await fetch(`${API_BASE}/groups/${id}/leave`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (!response.ok) throw new Error("Failed to leave");
      setIsMember(false);
      setGroup(prev => prev ? { ...prev, memberCount: Math.max(0, (prev.memberCount || 0) - 1) } : null);
    } catch (err) {
      alert("Failed to leave group.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!confirm("Are you sure you want to delete this group? This cannot be undone.")) return;
    if (!authToken) return;
    try {
      setActionLoading(true);
      const response = await fetch(`${API_BASE}/groups/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (!response.ok) throw new Error("Failed to delete");
      alert("Group deleted successfully");
      navigate("/groups");
    } catch (err) {
      alert("Failed to delete group.");
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
        setShowCopiedToast(true);
        setTimeout(() => setShowCopiedToast(false), 2000);
        break;
    }
    setShowShareMenu(false);
  };

  const handleSettingsChange = (field: keyof GroupSettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);
      if (!authToken || !id) return;
      const response = await fetch(`${API_BASE}/groups/${id}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify(settings)
      });
      const result = await response.json();
      if (result.isSuccess) {
        alert("Settings saved successfully!");
        setShowSettingsModal(false);
        fetchGroup(id!);
      } else {
        alert(result.message || "Failed to save settings");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddRule = async () => {
    if (!newRule.title.trim() || !id) return;
    try {
      if (!authToken) return;
      const response = await fetch(`${API_BASE}/groups/${id}/rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify(newRule)
      });
      const result = await response.json();
      if (result.isSuccess) {
        setNewRule({ title: "", description: "" });
        fetchRules(parseInt(id));
      } else {
        alert(result.message || "Failed to add rule");
      }
    } catch (err) {
      alert("Network error.");
    }
  };

  const handleUpdateMemberRole = async (memberId: number, newRole: string) => {
    if (!id) return;
    try {
      setMemberActionLoading(true);
      if (!authToken) return;
      const response = await fetch(`${API_BASE}/groups/${id}/members/${memberId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ newRole })
      });
      const result = await response.json();
      if (result.isSuccess) {
        alert(`Role updated to ${newRole}`);
        fetchMembers(parseInt(id));
      } else {
        alert(result.message || "Failed to update role");
      }
    } catch (err) {
      alert("Network error.");
    } finally {
      setMemberActionLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!id || !confirm("Remove this member?")) return;
    try {
      setMemberActionLoading(true);
      if (!authToken) return;
      const response = await fetch(`${API_BASE}/groups/${id}/members/${memberId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const result = await response.json();
      if (result.isSuccess) {
        alert("Member removed");
        fetchMembers(parseInt(id));
        setGroup(prev => prev ? { ...prev, memberCount: Math.max(0, (prev.memberCount || 0) - 1) } : null);
      } else {
        alert(result.message || "Failed to remove member");
      }
    } catch (err) {
      alert("Network error.");
    } finally {
      setMemberActionLoading(false);
    }
  };

  const handleReviewRequest = async (requestId: number, approve: boolean) => {
    if (!id) return;
    try {
      setActionLoading(true);
      if (!authToken) return;
      const response = await fetch(`${API_BASE}/groups/join-requests/${requestId}/review`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ approve, notes: "" })
      });
      const result = await response.json();
      if (result.isSuccess) {
        alert(approve ? "Member approved" : "Request rejected");
        fetchPendingRequests(parseInt(id));
        if (approve) {
          setGroup(prev => prev ? { ...prev, memberCount: (prev.memberCount || 0) + 1 } : null);
          fetchMembers(parseInt(id));
        }
      } else {
        alert(result.message || "Failed to process request");
      }
    } catch (err) {
      alert("Network error.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image must be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImage(reader.result as string);
        setCoverImageUrl("");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverUrlChange = (url: string) => {
    setCoverImageUrl(url);
    setCoverImage(url);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSaveCoverImage = async () => {
    if (!id || !coverImage) return;
    try {
      setActionLoading(true);
      if (!authToken) return;
      const payload = coverImageTab === "url" ? { coverImage: coverImageUrl } : { coverImage };
      const response = await fetch(`${API_BASE}/groups/${id}/cover-image`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.isSuccess) {
        alert("Cover image updated successfully");
        setShowCoverModal(false);
        fetchGroup(id);
      } else {
        alert(result.message || "Failed to update cover image");
      }
    } catch (err) {
      alert("Network error.");
    } finally {
      setActionLoading(false);
    }
  };

  const openGalleryPopup = (imageUrl: string) => {
    setSelectedGalleryImage(imageUrl);
    setShowGalleryPopup(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-KE", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
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
        <div className="container mx-auto px-4 py-12 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Oops!</h2>
          <p className="text-muted-foreground mb-6">{error || "Group not found"}</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate("/")}>Go Home</Button>
            <Button onClick={() => navigate("/groups")}>Browse Groups</Button>
          </div>
        </div>
      </div>
    );
  }

  const isGroupPrivate = group.isPrivate || settings.isPrivate;

  return (
    <div ref={pageRef} className="min-h-screen bg-background">
      {/* Cover Image */}
      <div
        className="relative h-64 md:h-80 w-full overflow-hidden cursor-pointer group"
        onClick={() => isOrganizer && setShowCoverModal(true)}
      >
        {coverImage ? (
          <img
            src={coverImage}
            alt={group.name}
            className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://placehold.co/1200x300/6b7280/ffffff?text=${encodeURIComponent(group.name.substring(0, 20))}`;
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 flex items-center justify-center">
            <Users className="h-20 w-20 text-muted-foreground/50" />
          </div>
        )}

        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-all pointer-events-none" />

        {isOrganizer && (
          <Button
            variant="secondary"
            size="sm"
            className="absolute bottom-6 right-6 shadow-lg"
            onClick={(e) => { e.stopPropagation(); setShowCoverModal(true); }}
          >
            <ImageIcon className="h-4 w-4 mr-2" /> Change Cover
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 bg-black/40 text-white hover:bg-black/60"
        >
          ← Back
        </Button>

        <div className="absolute top-6 right-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowShareMenu(!showShareMenu)}
            className="bg-black/40 text-white hover:bg-black/60"
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-6xl -mt-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">

            {/* Header */}
            <Card>
              <CardContent className="pt-8">
                <div className="flex flex-wrap gap-3 mb-4">
                  <Badge variant="secondary">{group.city}, {group.country}</Badge>
                  <Badge variant="outline">{group.memberCount} members</Badge>
                  {isGroupPrivate ? (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                      <Shield className="h-3 w-3 mr-1" /> Private Group
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
                      <Globe className="h-3 w-3 mr-1" /> Public Group
                    </Badge>
                  )}
                </div>
                <h1 className="text-4xl font-bold mb-4">{group.name}</h1>
                <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {group.city}</div>
                  <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Created {formatDate(group.createdAt)}</div>
                </div>

                {!isMember && !isOrganizer && (
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm">
                    {isGroupPrivate ? (
                      <p className="flex items-center gap-2 text-yellow-700">
                        <Shield className="h-4 w-4" />
                        This is a private group. Your join request will need organizer approval.
                      </p>
                    ) : (
                      <p className="flex items-center gap-2 text-green-700">
                        <Globe className="h-4 w-4" />
                        This is a public group. You can join instantly.
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-6 flex flex-col sm:flex-row gap-4">
                  {isOrganizer ? (
                    <>
                      <Button size="lg" variant="outline" onClick={() => setShowSettingsModal(true)} className="flex-1">
                        <Settings className="mr-2 h-4 w-4" /> Manage Group
                      </Button>
                      <Button size="lg" variant="destructive" onClick={handleDeleteGroup} disabled={actionLoading}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </Button>
                    </>
                  ) : isMember ? (
                    <Button size="lg" variant="outline" onClick={handleLeaveGroup} disabled={actionLoading}>
                      <LogOut className="mr-2 h-4 w-4" /> Leave Group
                    </Button>
                  ) : (
                    <Button size="lg" onClick={handleJoinGroup} disabled={actionLoading} className="flex-1">
                      <UserPlus className="mr-2 h-4 w-4" /> {isGroupPrivate ? "Request to Join" : "Join Group"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* About */}
            <Card>
              <CardHeader>
                <CardTitle><Sparkles className="inline mr-2 h-5 w-5" /> About This Group</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="leading-relaxed whitespace-pre-line">{group.description || "No description available."}</p>
              </CardContent>
            </Card>

            {/* Rules */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ListChecks className="h-5 w-5" /> Group Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {rules.length > 0 ? (
                  rules.map((rule, index) => (
                    <div key={rule.id} className="border-l-4 border-primary pl-4 py-1">
                      <p className="font-medium">{index + 1}. {rule.title}</p>
                      {rule.description && <p className="text-sm text-muted-foreground mt-1">{rule.description}</p>}
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No guidelines have been added yet.</p>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity - Members/Organizer only */}
            {isMember && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between cursor-pointer" onClick={() => setShowActivityDropdown(!showActivityDropdown)}>
                    <span className="flex items-center gap-2"><Clock className="h-5 w-5" /> Recent Activity</span>
                    {showActivityDropdown ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </CardTitle>
                </CardHeader>
                {showActivityDropdown && (
                  <CardContent className="space-y-5 pt-0">
                    {activityFeed.length > 0 ? (
                      activityFeed.map((item) => (
                        <div key={item.id} className="flex gap-3">
                          {item.type === "join" && <UserCheck className="h-5 w-5 text-green-500 mt-1" />}
                          {item.type === "post" && <MessageSquare className="h-5 w-5 text-primary mt-1" />}
                          {item.type === "event" && <Calendar className="h-5 w-5 text-blue-500 mt-1" />}
                          {item.type === "photo" && <Camera className="h-5 w-5 text-purple-500 mt-1" />}
                          <div>
                            <p><strong>{item.user.firstName} {item.user.lastName}</strong> {item.description}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
                    )}
                  </CardContent>
                )}
              </Card>
            )}

            {/* Popular Discussions - Members/Organizer only */}
            {isMember && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between cursor-pointer" onClick={() => setShowDiscussionsDropdown(!showDiscussionsDropdown)}>
                    <span className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Popular Discussions</span>
                    {showDiscussionsDropdown ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </CardTitle>
                </CardHeader>
                {showDiscussionsDropdown && (
                  <CardContent className="space-y-3 pt-0">
                    {discussions.length > 0 ? (
                      discussions.map((topic) => (
                        <div
                          key={topic.id}
                          className="p-4 border rounded-lg hover:bg-muted cursor-pointer transition-colors"
                          onClick={() => alert(`Opening discussion: ${topic.title}`)}
                        >
                          <p className="font-medium text-sm">{topic.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{topic.replies} replies • {topic.trending ? "Trending" : "Active"}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">No discussions yet</p>
                    )}
                  </CardContent>
                )}
              </Card>
            )}

            {/* Photo Gallery - Members/Organizer only */}
            {isMember && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><Camera className="h-5 w-5" /> Photo Gallery</span>
                    <Button variant="ghost" size="sm" onClick={() => setShowGalleryPopup(true)}>View All</Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {(gallery.length > 0 ? gallery.slice(0, 4) : [1,2,3,4].map(i => ({ id: i, url: `https://picsum.photos/id/${40+i}/400/400` }))).map((item: any, index: number) => (
                      <div key={item.id || index} className="aspect-square rounded-lg overflow-hidden border hover:border-primary cursor-pointer" onClick={() => openGalleryPopup(item.url)}>
                        <img
                          src={item.url}
                          alt={`Gallery ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Group Chat - Members/Organizer only */}
            {isMember && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Group Chat
                    {isOrganizer && <Badge variant="outline" className="text-xs">You can delete any message</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {id && <GroupChat groupId={parseInt(id)} currentUserId={currentUserId} isOrganizer={isOrganizer} />}
                </CardContent>
              </Card>
            )}

            {/* Upcoming Events */}
            {group.groupEvents && group.groupEvents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Upcoming Events</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {group.groupEvents.map((ge) => (
                    <div
                      key={ge.id}
                      className="p-5 border rounded-xl hover:border-primary cursor-pointer transition-all flex justify-between"
                      onClick={() => navigate(`/events/${ge.event.id}`)}
                    >
                      <div>
                        <h4 className="font-semibold">{ge.event.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatDate(ge.event.startTime)} • {ge.event.location || "Location TBD"}
                        </p>
                      </div>
                      <Badge variant={ge.event.isFree ? "secondary" : "default"}>
                        {ge.event.isFree ? "Free" : `KES ${ge.event.price}`}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Organizer Card - FIXED: Single title */}
            <Card>
              <CardHeader><CardTitle>Organizer</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>{getInitials(group.organizer?.firstName || "", group.organizer?.lastName || "")}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{group.organizer?.firstName} {group.organizer?.lastName}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Crown className="h-3 w-3 text-amber-500" /> Organizer</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Members Card */}
            <Card>
              <CardHeader>
                <CardTitle>Members ({group.memberCount})</CardTitle>
              </CardHeader>
              <CardContent>
                {isMember || isOrganizer ? (
                  <>
                    {membersLoading ? (
                      <div className="text-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Loading members...</p>
                      </div>
                    ) : membersError ? (
                      <div className="text-center py-4 text-destructive text-sm">
                        <AlertCircle className="h-4 w-4 inline mr-1" />
                        {membersError}
                        {isOrganizer && (
                          <Button variant="link" size="sm" className="ml-2 p-0 h-auto" onClick={() => fetchMembers(parseInt(id!))}>
                            Retry
                          </Button>
                        )}
                      </div>
                    ) : members.length > 0 ? (
                      <div className="space-y-3">
                        {members.slice(0, 5).map((member) => (
                          <div key={member.id} className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member.user.profilePicture} />
                              <AvatarFallback>{getInitials(member.user.firstName, member.user.lastName)}</AvatarFallback>
                            </Avatar>
                            <p className="text-sm truncate">{member.user.firstName} {member.user.lastName}</p>
                          </div>
                        ))}
                        {isOrganizer && members.length > 5 && (
                          <p className="text-xs text-muted-foreground text-center pt-2">+{members.length - 5} more</p>
                        )}
                        {isOrganizer && (
                          <Button variant="outline" className="w-full mt-4" onClick={() => { setShowMembersModal(true); fetchMembers(parseInt(id!)); }}>
                            Manage Members
                          </Button>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">No members yet</p>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4">
                    <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Join to see members</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={handleJoinGroup}>
                      {isGroupPrivate ? "Request to Join" : "Join Group"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending Requests - Organizer only */}
            {isOrganizer && (
              <Card className={pendingRequests.length > 0 ? "border-yellow-500/50" : ""}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-700">
                    <AlertCircle className="h-5 w-5" /> Pending Requests ({pendingRequests.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pendingRequests.length > 0 ? (
                    <Button variant="outline" className="w-full" onClick={() => { setShowRequestsModal(true); fetchPendingRequests(parseInt(id!)); }}>
                      Review {pendingRequests.length} Request{pendingRequests.length !== 1 ? "s" : ""}
                    </Button>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      No pending requests
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Share Card */}
            <Card>
              <CardHeader><CardTitle>Share Group</CardTitle></CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  {["facebook", "twitter", "whatsapp", "copy"].map((p) => (
                    <Button key={p} variant="outline" size="icon" onClick={() => handleShare(p)} className="h-11 w-11">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  ))}
                </div>
                {showCopiedToast && <p className="text-green-600 text-xs mt-3 text-center">Link copied to clipboard!</p>}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      {showBackToTop && (
        <Button
          onClick={scrollToTop}
          size="icon"
          className="fixed bottom-8 right-8 z-50 rounded-full shadow-xl"
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      )}

      {/* Settings Modal */}
      {showSettingsModal && isOrganizer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="sticky top-0 bg-card border-b z-10">
              <div className="flex justify-between items-center">
                <CardTitle>Manage Group</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowSettingsModal(false)}><X className="h-4 w-4" /></Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2"><Users className="h-5 w-5" /> Membership</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <Label>Private Group</Label>
                      <p className="text-sm text-muted-foreground">Require approval for new members</p>
                    </div>
                    <Switch checked={settings.isPrivate} onCheckedChange={(v) => handleSettingsChange("isPrivate", v)} />
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <Label>Allow Member Invites</Label>
                      <p className="text-sm text-muted-foreground">Members can invite others</p>
                    </div>
                    <Switch checked={settings.allowMemberInvites} onCheckedChange={(v) => handleSettingsChange("allowMemberInvites", v)} />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2"><Settings className="h-5 w-5" /> Content Settings</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <Label>Allow Member Posts</Label>
                      <p className="text-sm text-muted-foreground">Members can send messages</p>
                    </div>
                    <Switch checked={settings.allowMemberPosts} onCheckedChange={(v) => handleSettingsChange("allowMemberPosts", v)} />
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <Label>Moderate Messages</Label>
                      <p className="text-sm text-muted-foreground">Messages require approval</p>
                    </div>
                    <Switch checked={settings.moderateMessages} onCheckedChange={(v) => handleSettingsChange("moderateMessages", v)} />
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <Label>Allow Links</Label>
                      <p className="text-sm text-muted-foreground">Allow sharing URLs</p>
                    </div>
                    <Switch checked={settings.allowLinks} onCheckedChange={(v) => handleSettingsChange("allowLinks", v)} />
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <Label>Allow Media</Label>
                      <p className="text-sm text-muted-foreground">Allow images and videos</p>
                    </div>
                    <Switch checked={settings.allowMedia} onCheckedChange={(v) => handleSettingsChange("allowMedia", v)} />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowSettingsModal(false)}>Cancel</Button>
                <Button onClick={handleSaveSettings} disabled={savingSettings}>
                  {savingSettings ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Members Modal */}
      {showMembersModal && isOrganizer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="sticky top-0 bg-card border-b z-10">
              <div className="flex justify-between items-center">
                <CardTitle>Manage Members ({members.length})</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowMembersModal(false)}><X className="h-4 w-4" /></Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {membersLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
                  <p className="text-muted-foreground">Loading members...</p>
                </div>
              ) : membersError ? (
                <div className="text-center py-8 text-destructive">
                  <AlertCircle className="h-8 w-8 mx-auto mb-3" />
                  <p>{membersError}</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => fetchMembers(parseInt(id!))}>
                    Retry
                  </Button>
                </div>
              ) : members.length > 0 ? (
                members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.user.profilePicture} />
                        <AvatarFallback>{getInitials(member.user.firstName, member.user.lastName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.user.firstName} {member.user.lastName}</p>
                        <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                      </div>
                    </div>
                    {member.userId !== group.organizerId && (
                      <div className="flex gap-2">
                        <select
                          value={member.role}
                          onChange={(e) => handleUpdateMemberRole(member.id, e.target.value)}
                          disabled={memberActionLoading}
                          className="h-9 px-3 text-sm border rounded bg-background"
                        >
                          <option value="member">Member</option>
                          <option value="moderator">Moderator</option>
                          <option value="admin">Admin</option>
                        </select>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemoveMember(member.id)} disabled={memberActionLoading}>
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No members found</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => fetchMembers(parseInt(id!))}>
                    Refresh
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pending Requests Modal */}
      {showRequestsModal && isOrganizer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="sticky top-0 bg-card border-b z-10">
              <div className="flex justify-between items-center">
                <CardTitle>Pending Join Requests</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowRequestsModal(false)}><X className="h-4 w-4" /></Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {pendingRequests.length > 0 ? (
                pendingRequests.map((request) => (
                  <div key={request.id} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={request.user.profilePicture} />
                        <AvatarFallback>{getInitials(request.user.firstName, request.user.lastName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{request.user.firstName} {request.user.lastName}</p>
                        <p className="text-xs text-muted-foreground">Requested: {formatDate(request.requestedAt)}</p>
                      </div>
                    </div>
                    {request.message && <p className="text-sm italic text-muted-foreground mb-4">"{request.message}"</p>}
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => handleReviewRequest(request.id, false)} disabled={actionLoading}>Reject</Button>
                      <Button onClick={() => handleReviewRequest(request.id, true)} disabled={actionLoading}>Approve</Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">No pending requests</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cover Image Modal */}
      {showCoverModal && isOrganizer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Update Cover Image</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowCoverModal(false)}><X className="h-4 w-4" /></Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-2 p-1 bg-muted rounded-lg">
                <Button
                  variant={coverImageTab === "upload" ? "default" : "ghost"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setCoverImageTab("upload")}
                >
                  <ImageIcon className="h-4 w-4 mr-2" /> Upload
                </Button>
                <Button
                  variant={coverImageTab === "url" ? "default" : "ghost"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setCoverImageTab("url")}
                >
                  <Globe className="h-4 w-4 mr-2" /> URL
                </Button>
              </div>

              <div className="aspect-video w-full rounded-lg overflow-hidden border bg-muted">
                {coverImage ? (
                  <img src={coverImage} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <ImageIcon className="h-12 w-12" />
                  </div>
                )}
              </div>

              {coverImageTab === "upload" && (
                <div className="space-y-2">
                  <Label>Upload from Device</Label>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCoverImageChange}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                </div>
              )}

              {coverImageTab === "url" && (
                <div className="space-y-2">
                  <Label>Use Image URL</Label>
                  <Input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={coverImageUrl}
                    onChange={(e) => handleCoverUrlChange(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Enter a direct link to an image</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowCoverModal(false)}>Cancel</Button>
                <Button onClick={handleSaveCoverImage} disabled={actionLoading || !coverImage}>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gallery Popup */}
      {showGalleryPopup && isMember && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowGalleryPopup(false)}>
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-white bg-black/40 hover:bg-black/60" onClick={() => setShowGalleryPopup(false)}>
              <X className="h-6 w-6" />
            </Button>
            <img src={selectedGalleryImage} alt="Full view" className="w-full h-auto max-h-[80vh] object-contain rounded-lg shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupDetail;