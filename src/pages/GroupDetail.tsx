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
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, MapPin, Calendar, Share2, ArrowLeft, Loader2,
  AlertCircle, CheckCircle, UserPlus, LogOut, Trash2, Settings, X, Save, Plus, ListChecks,
  Image as ImageIcon, Crown, Shield, UserMinus, MessageSquare,
  Sparkles, Link2, ArrowUp, Clock, Camera, UserCheck, TrendingUp, Globe, ChevronDown, ChevronUp, FileText, Trash, Eye, EyeOff
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
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

  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [pendingRequestLoading, setPendingRequestLoading] = useState(false);

  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const [mobileActiveTab, setMobileActiveTab] = useState<"about" | "rules" | "activity" | "discussions" | "gallery" | "chat">("about");
  const [joinRequestStatus, setJoinRequestStatus] = useState<'none' | 'pending' | 'rejected'>('none');

  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    city: "",
    country: "",
    location: "",
    isPrivate: false,
    allowMemberInvites: true,
    allowMemberPosts: true,
    moderateMessages: false,
    maxMembers: "",
    coverImage: "",
  });
  const [editRules, setEditRules] = useState<Array<{ id?: number; title: string; description: string }>>([]);
  const [editNewRule, setEditNewRule] = useState({ title: "", description: "" });
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);

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

  const checkPendingRequest = useCallback(async (groupId: string) => {
    if (!currentUserId || !authToken || isMember || isOrganizer) return;
    
    try {
      setPendingRequestLoading(true);
      
      const groupResponse = await fetch(`${API_BASE}/groups/${groupId}`);
      if (!groupResponse.ok) return;
      
      const groupData: Group = await groupResponse.json();
      const isPrivate = groupData.isPrivate || groupData.settings?.isPrivate;
      
      if (!isPrivate) {
        setHasPendingRequest(false);
        return;
      }
      
      const response = await fetch(`${API_BASE}/groups/${groupId}/join-requests/pending`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      if (response.ok) {
        const requests: PendingRequest[] = await response.json();
        const userHasPending = requests.some(req => req.user.id === currentUserId);
        setHasPendingRequest(userHasPending);
      } else if (response.status === 401) {
        setHasPendingRequest(false);
      }
    } catch (err) {
      console.error("Failed to check pending requests:", err);
      setHasPendingRequest(false);
    } finally {
      setPendingRequestLoading(false);
    }
  }, [currentUserId, authToken, isMember, isOrganizer]);

  const fetchGroup = useCallback(async (groupId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/groups/${groupId}`);
      if (!response.ok) throw new Error(response.status === 404 ? "Group not found" : "Failed to fetch group");

      const data: Group = await response.json();
      setGroup(data);
      if (data.coverImage) {
        setCoverImage(data.coverImage);
        if (!data.coverImage.startsWith("data:")) setCoverImageUrl(data.coverImage);
      }

      if (currentUserId) {
        const isOrg = data.organizerId === currentUserId;
        setIsOrganizer(isOrg);
        setIsMember(data.groupMembers?.some((m: any) => m.userId === currentUserId && m.isActive) || false);

        if (!isOrg && !isMember) {
          await checkJoinRequestStatus(parseInt(groupId));
        }

        if (isOrg) {
          fetchSettings(parseInt(groupId));
          fetchMembers(parseInt(groupId));
          fetchPendingRequests(parseInt(groupId));
        }
      }
    } catch (err: any) {
      setError(err.message || "Could not load group details");
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  // // ✅ FIXED: Properly detects membership, handles public groups, avoids rejected state for public
  // const checkJoinRequestStatus = async (groupId: number) => {
  //   try {
  //     const token = localStorage.getItem("auth_token");
  //     if (!token || !currentUserId) return;

  //     const groupResponse = await fetch(`${API_BASE}/groups/${groupId}`);
  //     if (!groupResponse.ok) return;
  //     const groupData: Group = await groupResponse.json();
      
  //     // ✅ If user is member → show joined state (handles approved status)
  //     const isMemberCheck = groupData.groupMembers?.some(
  //       (m: any) => m.userId === currentUserId && m.isActive
  //     );
  //     if (isMemberCheck) {
  //       setJoinRequestStatus("none");
  //       setHasPendingRequest(false);
  //       return;
  //     }

  //     // ✅ Public groups: NO rejected state possible - just show join button
  //     const isPrivate = groupData.isPrivate || groupData.settings?.isPrivate;
  //     if (!isPrivate) {
  //       setJoinRequestStatus("none");
  //       setHasPendingRequest(false);
  //       return;
  //     }

  //     // ✅ Private groups only: check pending requests
  //     const pendingResponse = await fetch(`${API_BASE}/groups/${groupId}/join-requests/pending`, {
  //       headers: { Authorization: `Bearer ${token}` }
  //     });
      
  //     if (pendingResponse.ok) {
  //       const pendingRequests: PendingRequest[] = await pendingResponse.json();
  //       const hasPending = pendingRequests.some(req => req.user.id === currentUserId);
        
  //       if (hasPending) {
  //         setJoinRequestStatus("pending");
  //         setHasPendingRequest(true);
  //         return;
  //       }
  //     }

  //     // ✅ Private group, not member, not pending = assume rejected
  //     setJoinRequestStatus("rejected");
  //     setHasPendingRequest(false);

  //   } catch (err) {
  //     setJoinRequestStatus("none");
  //     setHasPendingRequest(false);
  //   }
  // };
const checkJoinRequestStatus = async (groupId: number) => {
  try {
    const token = localStorage.getItem("auth_token");
    if (!token || !currentUserId) return;

    // ✅ Step 1: Fetch the dedicated status endpoint
    // This tells us EXACTLY if pending, rejected, or none
    const statusResponse = await fetch(`${API_BASE}/groups/${groupId}/join-status`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (statusResponse.ok) {
      const data = await statusResponse.json();
      const status = data.status; // "member", "pending", "rejected", or "none"

      if (status === "member") {
        setIsMember(true);
        setJoinRequestStatus("none");
        setHasPendingRequest(false);
      } else if (status === "pending") {
        setIsMember(false);
        setJoinRequestStatus("pending");
        setHasPendingRequest(true);
      } else if (status === "rejected") {
        setIsMember(false);
        setJoinRequestStatus("rejected");
        setHasPendingRequest(false);
      } else {
        // "none"
        setIsMember(false);
        setJoinRequestStatus("none");
        setHasPendingRequest(false);
      }
      return;
    }

    // ✅ Fallback if endpoint fails (older backend version)
    // Default to "none" (Request to Join) instead of "rejected"
    setJoinRequestStatus("none");
    setHasPendingRequest(false);

  } catch (err) {
    console.error("Failed to check join status:", err);
    // On error, default to safe state: Request to Join
    setJoinRequestStatus("none");
    setHasPendingRequest(false);
  }
};

























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
        setMembers([]);
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

  // ✅ FIXED: Polling only for private groups, properly detects approved/rejected
  useEffect(() => {
    const isGroupPrivateSafe = group?.isPrivate || settings.isPrivate;
    
    if (!id || !isGroupPrivateSafe || isMember || isOrganizer || joinRequestStatus !== "pending") return;
    
    const pollInterval = setInterval(async () => {
      try {
        const token = localStorage.getItem("auth_token");
        if (!token) return;
        
        // ✅ Check if user is now a member (approved case - fixes approved status showing rejected)
        const groupResponse = await fetch(`${API_BASE}/groups/${id}`);
        if (groupResponse.ok) {
          const groupData: Group = await groupResponse.json();
          const isNowMember = groupData.groupMembers?.some(
            (m: any) => m.userId === currentUserId && m.isActive
          );
          
          if (isNowMember) {
            setJoinRequestStatus("none");
            setHasPendingRequest(false);
            setIsMember(true);
            await fetchGroup(id);
            toast.success("Welcome to the group!", {
              description: "Your request was approved.",
              icon: <CheckCircle className="h-4 w-4" />
            });
            return;
          }
        }
        
        // ✅ Check if request is still pending or was rejected
        const pendingResponse = await fetch(`${API_BASE}/groups/${id}/join-requests/pending`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (pendingResponse.ok) {
          const pendingRequests: PendingRequest[] = await pendingResponse.json();
          const stillPending = pendingRequests.some(req => req.user.id === currentUserId);
          
          if (!stillPending && joinRequestStatus === "pending") {
            setJoinRequestStatus("rejected");
            setHasPendingRequest(false);
            toast.info("Join request was rejected", {
              description: "You can re-apply if the group allows it.",
              icon: <AlertCircle className="h-4 w-4" />
            });
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 15000);
    
    return () => clearInterval(pollInterval);
  }, [id, group, settings.isPrivate, isMember, isOrganizer, joinRequestStatus, fetchGroup, currentUserId]);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileActiveTab("about");
  };

  // ✅ FIXED: Handles all join scenarios, respects public/private, proper state updates
  const handleJoinGroup = async () => {
    if (!authToken) {
      navigate("/login", { state: { from: `/groups/${id}` } });
      return;
    }

    if (joinRequestStatus === "pending") {
      toast.info("Request already pending", {
        description: "Wait for organizer approval."
      });
      return;
    }

    try {
      setActionLoading(true);
      
      const response = await fetch(`${API_BASE}/groups/${id}/join`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ groupId: parseInt(id!) })
      });
      
      if (response.status === 401) {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");
        toast.error("Session expired. Please log in again.");
        navigate("/login");
        return;
      }
      
      const contentType = response.headers.get("content-type");
      let result;
      if (contentType?.includes("application/json")) {
        result = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server returned ${response.status}: ${text.substring(0, 100)}`);
      }

      console.log("✅ JoinGroup API response:", result);

      if (result.isSuccess) {
        if (result.isPending || result.status === "pending") {
          setJoinRequestStatus("pending");
          setHasPendingRequest(true);
          toast.success("Join request sent!", { 
            description: "Wait for organizer approval.",
            icon: <AlertCircle className="h-4 w-4" />
          });
        } else {
          setIsMember(true);
          setJoinRequestStatus("none");
          setGroup(prev => prev ? { ...prev, memberCount: (prev.memberCount || 0) + 1 } : null);
          toast.success("Joined group successfully!", { 
            icon: <UserCheck className="h-4 w-4" /> 
          });
        }
      } else {
        if (result.message?.toLowerCase().includes("pending") || result.status === "pending") {
          setJoinRequestStatus("pending");
          setHasPendingRequest(true);
        } else if (result.message?.toLowerCase().includes("rejected")) {
          setJoinRequestStatus("rejected");
        }
        toast.error(result.message || "Failed to process request");
      }
    } catch (err: any) {
      console.error("Join error:", err);
      
      if (err.message?.includes("duplicate key") || err.message?.includes("IX_GroupJoinRequests")) {
        setJoinRequestStatus("rejected");
        setHasPendingRequest(false);
        toast.info("Request was previously rejected", {
          description: "Click 'Re-apply' to submit a new request.",
          icon: <AlertCircle className="h-4 w-4" />
        });
        return;
      }
      
      if (err.message?.includes("Server returned 500")) {
        toast.error("Server error while joining group", {
          description: "Our team has been notified. Please try again in a moment.",
          action: {
            label: "Retry",
            onClick: () => handleJoinGroup()
          },
          duration: 10000
        });
      } else if (err.message?.includes("401")) {
        toast.error("Session expired", {
          description: "Please log in again to continue",
          action: {
            label: "Log In",
            onClick: () => navigate("/login", { state: { from: `/groups/${id}` } })
          }
        });
      } else if (err.message?.includes("already a member")) {
        toast.info("You're already a member!", {
          description: "Redirecting to group...",
          duration: 3000
        });
        setIsMember(true);
      } else {
        toast.error(err.message || "Unable to join group. Please try again.");
      }
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
      toast.info("You left the group.", { description: "We hope to see you back!" });
    } catch (err) {
      toast.error("Failed to leave group.");
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
      toast.success("Group deleted.");
      navigate("/groups");
    } catch (err) {
      toast.error("Failed to delete group.");
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
        toast.success("Link copied to clipboard!");
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
        toast.success("Settings saved successfully!");
        setShowSettingsModal(false);
        fetchGroup(id!);
      } else {
        toast.error(result.message || "Failed to save settings");
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
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
        toast.success("Rule added.");
        fetchRules(parseInt(id));
      } else {
        toast.error(result.message || "Failed to add rule");
      }
    } catch (err) {
      toast.error("Network error.");
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
        toast.success(`Role updated to ${newRole}`);
        fetchMembers(parseInt(id));
      } else {
        toast.error(result.message || "Failed to update role");
      }
    } catch (err) {
      toast.error("Network error.");
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
        toast.info("Member removed");
        fetchMembers(parseInt(id));
        setGroup(prev => prev ? { ...prev, memberCount: Math.max(0, (prev.memberCount || 0) - 1) } : null);
      } else {
        toast.error(result.message || "Failed to remove member");
      }
    } catch (err) {
      toast.error("Network error.");
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
        toast.success(approve ? "Member approved" : "Request rejected");
        fetchPendingRequests(parseInt(id));
        if (approve) {
          setGroup(prev => prev ? { ...prev, memberCount: (prev.memberCount || 0) + 1 } : null);
          fetchMembers(parseInt(id));
        }
      } else {
        toast.error(result.message || "Failed to process request");
      }
    } catch (err) {
      toast.error("Network error.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image too large", { description: "Must be less than 5MB" });
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
      const imageValue = coverImageTab === "url" ? coverImageUrl : coverImage;
      
      if (!imageValue) {
        toast.error("No cover image selected");
        return;
      }
      
      const payload = { coverImage: imageValue };
 
      const response = await fetch(`${API_BASE}/groups/${id}/cover-image`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify(payload)
      });

      const contentType = response.headers.get("content-type");
      let result;
      if (contentType?.includes("application/json")) {
        result = await response.json();
      } else {
        result = { isSuccess: response.ok, message: response.ok ? "Success" : "Failed" };
      }
      
      if (result.isSuccess) {
        toast.success("Cover updated successfully");
        setShowCoverModal(false);
        await fetchGroup(id!);
      } else {
        toast.error(result.message || "Failed to update cover image");
      }
      
    } catch (err) {
      toast.error("Network error.");
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
    // Skeleton Loader
  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-16">
        <Skeleton className="h-64 md:h-96 w-full" />
        <div className="container mx-auto px-4 py-10 max-w-7xl -mt-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
                  <CardContent className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader><Skeleton className="h-5 w-24" /></CardHeader>
                  <CardContent className="space-y-3">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
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

  // ✅ Define isGroupPrivate AFTER early returns
  const isGroupPrivate = group?.isPrivate || settings.isPrivate;

  return (
    <div ref={pageRef} className="min-h-screen bg-background">
      {/* Cover Image */}
      <div className="relative">
        <div
          className="relative h-64 md:h-96 w-full overflow-hidden group cursor-pointer"
          onClick={() => isOrganizer && setShowCoverModal(true)}
        >
          {coverImage ? (
            <>
              <img
                src={coverImage}
                alt={group.name}
                className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://placehold.co/1200x400/6b7280/ffffff?text=${encodeURIComponent(group.name.substring(0, 20))}`;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 flex items-center justify-center">
              <Users className="h-20 w-20 text-muted-foreground/50" />
            </div>
          )}

          <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20">
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => { e.stopPropagation(); navigate(-1); }}
              className="bg-black/40 text-white hover:bg-black/60 backdrop-blur-sm border-none"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); setShowShareMenu(!showShareMenu); }}
                className="bg-black/40 text-white hover:bg-black/60 backdrop-blur-sm border-none"
                aria-label="Share group"
              >
                <Share2 className="h-5 w-5" />
              </Button>
              {isOrganizer && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); setShowCoverModal(true); }}
                  className="bg-black/40 text-white hover:bg-black/60 backdrop-blur-sm border-none"
                >
                  <Camera className="h-4 w-4 mr-1.5" /> Edit Cover
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="container mx-auto px-4 py-10 max-w-7xl -mt-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-6 xl:space-y-8 pb-20 lg:pb-0">

            {/* Mobile Tab Navigation */}
            <div className="lg:hidden sticky top-16 z-30 bg-background/95 backdrop-blur border-b -mx-4 px-4">
              <div className="flex overflow-x-auto py-2 gap-1 scrollbar-hide">
                {[
                  { id: "about", label: "About", icon: Sparkles },
                  { id: "rules", label: "Rules", icon: ListChecks },
                  { id: "activity", label: "Activity", icon: Clock, memberOnly: true },
                  { id: "discussions", label: "Discussions", icon: MessageSquare, memberOnly: true },
                  { id: "gallery", label: "Gallery", icon: Camera, memberOnly: true },
                  { id: "chat", label: "Chat", icon: Users, memberOnly: true },
                ].map((tab) => {
                  const Icon = tab.icon;
                  if (tab.memberOnly && !isMember) return null;
                  return (
                    <Button
                      key={tab.id}
                      variant={mobileActiveTab === tab.id ? "default" : "ghost"}
                      size="sm"
                      className="flex-shrink-0 gap-1.5 text-xs"
                      onClick={() => setMobileActiveTab(tab.id as any)}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {tab.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Header Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardContent className="pt-8">
                  <div className="flex flex-wrap gap-3 mb-4">
                    <Badge variant="secondary">{group.city}, {group.country}</Badge>
                    <Badge variant="outline">{group.memberCount} members</Badge>
                    {isGroupPrivate ? (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                        <Shield className="h-3 w-3 mr-1" /> Private
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
                        <Globe className="h-3 w-3 mr-1" /> Public
                      </Badge>
                    )}
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-4">{group.name}</h1>
                  <div className="flex flex-wrap gap-6 text-sm text-muted-foreground mb-6">
                    <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {group.city}</div>
                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Created {formatDate(group.createdAt)}</div>
                  </div>

                  {!isMember && !isOrganizer && (
                    <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm mb-6">
                      {isGroupPrivate ? (
                        <p className="flex items-center gap-2 text-yellow-700">
                          <Shield className="h-4 w-4" />
                          Private group. Requires organizer approval.
                        </p>
                      ) : (
                        <p className="flex items-center gap-2 text-green-700">
                          <Globe className="h-4 w-4" />
                          Public group. Instant join.
                        </p>
                      )}
                    </div>
                  )}


                 <div className="flex flex-col sm:flex-row gap-4">
  {isOrganizer ? (
    <>
      <Button 
        size="lg" 
        variant="outline" 
        onClick={() => { 
          setEditFormData({
            name: group.name || "",
            description: group.description || "",
            city: group.city || "",
            country: group.country || "",
            location: "",
            isPrivate: group.isPrivate || settings.isPrivate || false,
            allowMemberInvites: settings.allowMemberInvites ?? true,
            allowMemberPosts: settings.allowMemberPosts ?? true,
            moderateMessages: settings.moderateMessages ?? false,
            maxMembers: "",
            coverImage: group.coverImage || "",
          });
          setEditRules(group.groupMembers ? [] : []);
          if (group.coverImage) setEditImagePreview(group.coverImage);
          setShowEditModal(true);
        }} 
        className="flex-1"
      >
        <Settings className="mr-2 h-4 w-4" /> Edit Group
      </Button>
      <Button 
        size="lg" 
        variant="outline" 
        onClick={() => setShowSettingsModal(true)} 
        className="flex-1"
      >
        <Settings className="mr-2 h-4 w-4" /> Manage Settings
      </Button>
      <Button 
        size="lg" 
        variant="destructive" 
        onClick={handleDeleteGroup} 
        disabled={actionLoading}
      >
        <Trash2 className="mr-2 h-4 w-4" /> Delete
      </Button>
    </>
  ) : isMember ? (
    <Button 
      size="lg" 
      variant="outline" 
      onClick={handleLeaveGroup} 
      disabled={actionLoading}
    >
      <LogOut className="mr-2 h-4 w-4" /> Leave Group
    </Button>
  ) : (
    // ✅ FIXED: Non-member, non-organizer button logic
    <Button 
      size="lg" 
      onClick={handleJoinGroup} 
      disabled={actionLoading || joinRequestStatus === "pending"} 
      className="flex-1"
      variant={
        joinRequestStatus === "pending" ? "secondary" : 
        joinRequestStatus === "rejected" ? "outline" : 
        "default"
      }
    >
      {/* Loading state */}
      {actionLoading && joinRequestStatus === "none" ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
          Processing...
        </>
      ) : joinRequestStatus === "pending" ? (
        // ✅ Pending state (private groups only)
        <>
          <Clock className="mr-2 h-4 w-4 text-yellow-600" /> 
          Request Sent
        </>
      ) : joinRequestStatus === "rejected" ? (
        // ✅ Rejected state (private groups only)
        <>
          <AlertCircle className="mr-2 h-4 w-4 text-destructive" /> 
          Request Rejected • Re-apply
        </>
      ) : (
        // ✅ Default state: Join or Request to Join
        <>
          <UserPlus className="mr-2 h-4 w-4" /> 
          {isGroupPrivate ? "Request to Join" : "Join Group"}
        </>
      )}
    </Button>
  )}
</div>





                </CardContent>
              </Card>
            </motion.div>

            {/* About */}
            {(mobileActiveTab === "about" || window.innerWidth >= 1024) && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
                <Card id="section-about" className="shadow-sm hover:shadow-md transition-shadow duration-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> About This Group</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="leading-relaxed whitespace-pre-line text-muted-foreground">{group.description || "No description available."}</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Rules */}
            {(mobileActiveTab === "rules" || window.innerWidth >= 1024) && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
                <Card id="section-rules" className="shadow-sm hover:shadow-md transition-shadow duration-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2"><ListChecks className="h-5 w-5 text-primary" /> Group Guidelines</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-6">
                    {rules.length > 0 ? (
                      rules.map((rule, index) => (
                        <div key={rule.id} className="border-l-4 border-primary/20 pl-4 py-1 hover:bg-muted/30 transition-colors rounded-r-lg">
                          <p className="font-medium">{index + 1}. {rule.title}</p>
                          {rule.description && <p className="text-sm text-muted-foreground mt-1">{rule.description}</p>}
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No guidelines have been added yet.</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Recent Activity */}
            {isMember && (mobileActiveTab === "activity" || window.innerWidth >= 1024) && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }}>
                <Card id="section-activity" className="shadow-sm hover:shadow-md transition-shadow duration-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between cursor-pointer" onClick={() => setShowActivityDropdown(!showActivityDropdown)}>
                      <span className="flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /> Recent Activity</span>
                      {showActivityDropdown ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </CardTitle>
                  </CardHeader>
                  {showActivityDropdown && (
                    <CardContent className="space-y-4 pt-0">
                      {activityFeed.length > 0 ? (
                        activityFeed.map((item) => (
                          <div key={item.id} className="flex gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                            {item.type === "join" && <UserCheck className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />}
                            {item.type === "post" && <MessageSquare className="h-5 w-5 text-primary mt-1 flex-shrink-0" />}
                            {item.type === "event" && <Calendar className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />}
                            {item.type === "photo" && <Camera className="h-5 w-5 text-purple-500 mt-1 flex-shrink-0" />}
                            <div>
                              <p><strong>{item.user.firstName} {item.user.lastName}</strong> {item.description}</p>
                              <p className="text-xs text-muted-foreground mt-1">{formatDate(item.createdAt)}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
                      )}
                    </CardContent>
                  )}
                </Card>
              </motion.div>
            )}

            {/* Popular Discussions */}
            {isMember && (mobileActiveTab === "discussions" || window.innerWidth >= 1024) && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.4 }}>
                <Card id="section-discussions" className="shadow-sm hover:shadow-md transition-shadow duration-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between cursor-pointer" onClick={() => setShowDiscussionsDropdown(!showDiscussionsDropdown)}>
                      <span className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Popular Discussions</span>
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
                            <p className="text-xs text-muted-foreground mt-1">{topic.replies} replies • {topic.trending ? "🔥 Trending" : "💬 Active"}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No discussions yet</p>
                      )}
                    </CardContent>
                  )}
                </Card>
              </motion.div>
            )}

            {/* Photo Gallery */}
            {isMember && (mobileActiveTab === "gallery" || window.innerWidth >= 1024) && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.5 }}>
                <Card id="section-gallery" className="shadow-sm hover:shadow-md transition-shadow duration-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2"><Camera className="h-5 w-5 text-primary" /> Photo Gallery</span>
                      {gallery.length > 0 && (
                        <Button variant="ghost" size="sm" onClick={() => setShowGalleryPopup(true)}>View All</Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {(gallery.length > 0 ? gallery.slice(0, 6) : [1,2,3].map(i => ({ id: `ph-${i}`, url: `https://picsum.photos/seed/${i}/400/400` }))).map((item: any, index: number) => (
                        <motion.button
                          key={item.id || index}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.98 }}
                          className="relative aspect-square rounded-lg overflow-hidden border border-border hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all group"
                          onClick={() => openGalleryPopup(item.url)}
                          aria-label={`View gallery image ${index + 1}`}
                        >
                          <img
                            src={item.url}
                            alt={`Gallery preview ${index + 1}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Group Chat */}
            {isMember && (mobileActiveTab === "chat" || window.innerWidth >= 1024) && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.6 }}>
                <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Group Chat</span>
                      {isOrganizer && <Badge variant="outline" className="text-xs">Admin Mode</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {id && <GroupChat groupId={parseInt(id)} currentUserId={currentUserId} isOrganizer={isOrganizer} />}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Upcoming Events */}
            {group.groupEvents && group.groupEvents.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.7 }}>
                <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" /> Upcoming Events</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    {group.groupEvents.map((ge) => (
                      <div
                        key={ge.id}
                        className="p-5 border rounded-xl hover:border-primary cursor-pointer transition-all flex justify-between items-center bg-card"
                        onClick={() => navigate(`/events/${ge.event.id}`)}
                      >
                        <div>
                          <h4 className="font-semibold">{ge.event.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {formatDate(ge.event.startTime)} • {ge.event.location || "Location TBD"}
                          </p>
                        </div>
                        <Badge variant={ge.event.isFree ? "secondary" : "default"} className="text-xs">
                          {ge.event.isFree ? "Free" : `KES ${ge.event.price}`}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Sidebar Column */}
          <div className="lg:sticky lg:top-24 lg:self-start space-y-6">
            {/* Desktop Section Navigation */}
            <Card className="hidden lg:block shadow-sm">
              <CardHeader className="pb-3"><CardTitle className="text-base">Jump To</CardTitle></CardHeader>
              <CardContent className="pt-0">
                <nav className="space-y-1">
                  {[
                    { id: "section-about", label: "About", icon: Sparkles },
                    { id: "section-rules", label: "Guidelines", icon: ListChecks },
                    isMember && { id: "section-activity", label: "Activity", icon: Clock },
                    isMember && { id: "section-discussions", label: "Discussions", icon: MessageSquare },
                    isMember && { id: "section-gallery", label: "Gallery", icon: Camera },
                  ].filter(Boolean).map((item: any) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => scrollToSection(item.id)}
                        className="flex items-center w-full gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground text-left"
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>

            {/* Organizer Card */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3"><CardTitle>Organizer</CardTitle></CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
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
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span>Members ({group.memberCount})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {isMember || isOrganizer ? (
                  <>
                    {membersLoading ? (
                      <div className="text-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
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
                          <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                            <Avatar className="h-8 w-8">
                              <AvatarImage 
                                src={
                                  member.user.profilePicture && 
                                  !member.user.profilePicture.startsWith('blob:') && 
                                  (member.user.profilePicture.startsWith('http') || member.user.profilePicture.startsWith('data:'))
                                    ? member.user.profilePicture 
                                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(member.user.firstName + ' ' + member.user.lastName)}&background=random&color=fff&size=128`
                                }
                                alt={`${member.user.firstName} ${member.user.lastName}`}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  if (!target.src.includes('ui-avatars.com')) {
                                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.user.firstName + ' ' + member.user.lastName)}&background=random&color=fff&size=128`;
                                  }
                                }}
                              />
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

            {/* Pending Requests */}
            {isOrganizer && (
              <Card className={pendingRequests.length > 0 ? "border-yellow-500/50 shadow-sm" : "shadow-sm"}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-yellow-700">
                    <AlertCircle className="h-5 w-5" /> Pending Requests ({pendingRequests.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {pendingRequests.length > 0 ? (
                    <Button variant="outline" className="w-full" onClick={() => { setShowRequestsModal(true); fetchPendingRequests(parseInt(id!)); }}>
                      Review Request{pendingRequests.length !== 1 ? "s" : ""}
                    </Button>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-2">No pending requests</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Share Card */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3"><CardTitle>Share Group</CardTitle></CardHeader>
              <CardContent className="pt-0">
                <div className="flex gap-3">
                  {["facebook", "twitter", "whatsapp", "copy"].map((p) => (
                    <Button key={p} variant="outline" size="icon" onClick={() => handleShare(p)} className="h-10 w-10 hover:scale-105 transition-transform">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  ))}
                </div>
                {showCopiedToast && <p className="text-green-600 text-xs mt-3 text-center">Link copied!</p>}
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
          className="fixed bottom-8 right-8 z-50 rounded-full shadow-xl hover:scale-105 transition-transform"
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      )}

      {/* Settings Modal */}
      {showSettingsModal && isOrganizer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="sticky top-0 bg-card border-b z-10 py-4">
              <div className="flex justify-between items-center">
                <CardTitle>Manage Group</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowSettingsModal(false)}><X className="h-4 w-4" /></Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
              {/* Membership Settings */}
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

              <Separator />

              {/* Content Settings */}
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2"><Settings className="h-5 w-5" /> Content Settings</h3>
                <div className="space-y-4">
                  {[
                    { key: "allowMemberPosts", label: "Allow Member Posts", desc: "Members can send messages" },
                    { key: "moderateMessages", label: "Moderate Messages", desc: "Messages require approval" },
                    { key: "allowLinks", label: "Allow Links", desc: "Allow sharing URLs" },
                    { key: "allowMedia", label: "Allow Media", desc: "Allow images and videos" }
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex justify-between items-center">
                      <div>
                        <Label>{label}</Label>
                        <p className="text-sm text-muted-foreground">{desc}</p>
                      </div>
                      <Switch 
                        checked={settings[key as keyof GroupSettings] as boolean} 
                        onCheckedChange={(v) => handleSettingsChange(key as keyof GroupSettings, v)} 
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Group Rules Management */}
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2"><ListChecks className="h-5 w-5" /> Group Guidelines</h3>
                
                <div className="space-y-3 mb-4 max-h-48 overflow-y-auto pr-2">
                  {rules.length > 0 ? (
                    rules.map((rule) => (
                      <div key={rule.id} className="flex items-start justify-between p-3 bg-muted/30 rounded-lg border">
                        <div>
                          <p className="font-medium text-sm">{rule.title}</p>
                          {rule.description && <p className="text-xs text-muted-foreground mt-0.5">{rule.description}</p>}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={async () => {
                            if (!confirm(`Delete rule "${rule.title}"?`)) return;
                            try {
                              if (!authToken || !id) return;
                              const res = await fetch(`${API_BASE}/groups/${id}/rules/${rule.id}`, {
                                method: "DELETE",
                                headers: { Authorization: `Bearer ${authToken}` }
                              });
                              if (res.ok) {
                                toast.success("Rule deleted");
                                fetchRules(parseInt(id));
                              }
                            } catch {
                              toast.error("Failed to delete rule");
                            }
                          }}
                        >
                          <Trash className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No guidelines yet</p>
                  )}
                </div>
                
                <div className="space-y-3 p-3 bg-muted/20 rounded-lg border">
                  <Input
                    placeholder="Rule title (e.g., 'Be respectful')"
                    value={newRule.title}
                    onChange={(e) => setNewRule(prev => ({ ...prev, title: e.target.value }))}
                    maxLength={100}
                    className="h-9"
                  />
                  <Input
                    placeholder="Description (optional)"
                    value={newRule.description}
                    onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))}
                    maxLength={250}
                    className="h-9"
                  />
                  <Button 
                    size="sm" 
                    onClick={handleAddRule}
                    disabled={!newRule.title.trim()}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Guideline
                  </Button>
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
            <CardHeader className="sticky top-0 bg-card border-b z-10 py-4">
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
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
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
            <CardHeader className="sticky top-0 bg-card border-b z-10 py-4">
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
                    {request.message && <p className="text-sm italic text-muted-foreground mb-4 bg-muted p-2 rounded">"{request.message}"</p>}
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
            <CardHeader className="py-4">
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

      {/* Edit Group Modal */}
      {showEditModal && isOrganizer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="sticky top-0 bg-card border-b z-10 py-4">
              <div className="flex justify-between items-center">
                <CardTitle>Edit Group Details</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowEditModal(false)}><X className="h-4 w-4" /></Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2"><Users className="h-5 w-5" /> Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Group Name *</Label>
                    <Input
                      value={editFormData.name}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Nairobi Tech Enthusiasts"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cover Image URL</Label>
                    <Input
                      type="url"
                      value={editFormData.coverImage}
                      onChange={(e) => {
                        setEditFormData(prev => ({ ...prev, coverImage: e.target.value }));
                        setEditImagePreview(e.target.value);
                      }}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="What is this group about?"
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      value={editFormData.city}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Nairobi"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Input
                      value={editFormData.country}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, country: e.target.value }))}
                      placeholder="Kenya"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Specific Location</Label>
                    <Input
                      value={editFormData.location}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="e.g., iHub, Westlands"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Privacy & Content Settings */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2"><Settings className="h-5 w-5" /> Privacy & Content</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label className="font-medium">{editFormData.isPrivate ? "Private Group" : "Public Group"}</Label>
                      <p className="text-xs text-muted-foreground">{editFormData.isPrivate ? "Approval required to join" : "Anyone can join"}</p>
                    </div>
                    <Switch
                      checked={editFormData.isPrivate}
                      onCheckedChange={(v) => setEditFormData(prev => ({ ...prev, isPrivate: v }))}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label className="font-medium">Allow Member Invites</Label>
                      <p className="text-xs text-muted-foreground">Members can invite others</p>
                    </div>
                    <Switch
                      checked={editFormData.allowMemberInvites}
                      onCheckedChange={(v) => setEditFormData(prev => ({ ...prev, allowMemberInvites: v }))}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label className="font-medium">Allow Member Posts</Label>
                      <p className="text-xs text-muted-foreground">Members can send messages</p>
                    </div>
                    <Switch
                      checked={editFormData.allowMemberPosts}
                      onCheckedChange={(v) => setEditFormData(prev => ({ ...prev, allowMemberPosts: v }))}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label className="font-medium">Moderate Messages</Label>
                      <p className="text-xs text-muted-foreground">Messages require approval</p>
                    </div>
                    <Switch
                      checked={editFormData.moderateMessages}
                      onCheckedChange={(v) => setEditFormData(prev => ({ ...prev, moderateMessages: v }))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Group Rules */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2"><ListChecks className="h-5 w-5" /> Group Guidelines</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                  {editRules.length > 0 ? (
                    editRules.map((rule, idx) => (
                      <div key={rule.id || idx} className="flex items-start justify-between p-3 bg-muted/30 rounded-lg border">
                        <div>
                          <p className="font-medium text-sm">{rule.title}</p>
                          {rule.description && <p className="text-xs text-muted-foreground">{rule.description}</p>}
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setEditRules(prev => prev.filter((_, i) => i !== idx))}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No custom rules set</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="New rule title"
                    value={editNewRule.title}
                    onChange={(e) => setEditNewRule(prev => ({ ...prev, title: e.target.value }))}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={() => {
                    if (!editNewRule.title.trim()) return;
                    setEditRules(prev => [...prev, { title: editNewRule.title.trim(), description: editNewRule.description.trim() }]);
                    setEditNewRule({ title: "", description: "" });
                  }}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {editImagePreview && (
                <div className="space-y-2">
                  <Label>Cover Image Preview</Label>
                  <div className="aspect-video rounded-lg overflow-hidden border bg-muted">
                    <img src={editImagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowEditModal(false)} disabled={editLoading}>Cancel</Button>
                <Button onClick={async () => {
                  if (!editFormData.name.trim()) {
                    toast.error("Group name is required");
                    return;
                  }
                  try {
                    setEditLoading(true);
                    if (!authToken || !id) return;
                    
                    const payload = {
                      name: editFormData.name.trim(),
                      description: editFormData.description.trim() || null,
                      city: editFormData.city.trim() || null,
                      country: editFormData.country.trim() || null,
                      location: editFormData.location.trim() || null,
                      isPrivate: editFormData.isPrivate,
                      allowMemberInvites: editFormData.allowMemberInvites,
                      allowMemberPosts: editFormData.allowMemberPosts,
                      moderateMessages: editFormData.moderateMessages,
                      coverImage: editFormData.coverImage || null,
                    };
                    
                    const response = await fetch(`${API_BASE}/groups/${id}`, {
                      method: "PUT",
                      headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${authToken}`
                      },
                      body: JSON.stringify(payload)
                    });
                    
                    const result = await response.json();
                    if (result.isSuccess) {
                      toast.success("Group updated successfully!");
                      setShowEditModal(false);
                      fetchGroup(id!);
                    } else {
                      toast.error(result.message || "Failed to update group");
                    }
                  } catch (err) {
                    toast.error("Network error. Please try again.");
                  } finally {
                    setEditLoading(false);
                  }
                }} disabled={editLoading}>
                  {editLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default GroupDetail;