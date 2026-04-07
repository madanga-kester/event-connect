import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Save, Plus, Trash2, Users, Settings, Shield } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5260/api";

const GroupSettings = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Settings state
  const [settings, setSettings] = useState({
    isPrivate: false,
    allowMemberInvites: true,
    allowMemberPosts: true,
    moderateMessages: false,
    allowLinks: true,
    allowMedia: true,
    notifyOnNewEvent: true,
    notifyOnNewMember: false,
  });
  
  // Rules state
  const [rules, setRules] = useState<Array<{ id: number; title: string; description?: string; order: number }>>([]);
  const [newRule, setNewRule] = useState({ title: "", description: "" });
  
  // Member requests state
  const [pendingRequests, setPendingRequests] = useState<Array<{
    id: number;
    user: { firstName: string; lastName: string };
    message?: string;
    requestedAt: string;
  }>>([]);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token");
      const userData = localStorage.getItem("user");
      const currentUserId = userData ? JSON.parse(userData).id : null;
      
      if (!token) {
        navigate("/login");
        return;
      }

      // Fetch group to check if user is organizer
      const groupRes = await fetch(`${API_BASE}/groups/${id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (!groupRes.ok) {
        throw new Error("Group not found");
      }
      
      const group = await groupRes.json();
      setIsOrganizer(group.organizerId === currentUserId);
      
      if (!isOrganizer) {
        navigate(`/groups/${id}`);
        return;
      }
      
      // Fetch settings
      const settingsRes = await fetch(`${API_BASE}/groups/${id}/settings`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData);
      }
      
      // Fetch rules
      const rulesRes = await fetch(`${API_BASE}/groups/${id}/rules`);
      if (rulesRes.ok) {
        const rulesData = await rulesRes.json();
        setRules(rulesData);
      }
      
      // Fetch pending requests
      const requestsRes = await fetch(`${API_BASE}/groups/${id}/join-requests/pending`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (requestsRes.ok) {
        const requestsData = await requestsRes.json();
        setPendingRequests(requestsData);
      }
      
    } catch (err: any) {
      console.error("Failed to load settings:", err);
      setError(err.message || "Could not load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsChange = (field: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      const token = localStorage.getItem("auth_token");
      
      const response = await fetch(`${API_BASE}/groups/${id}/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      
      const result = await response.json();
      
      if (result.isSuccess) {
        setSuccess("Settings saved successfully!");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.message || "Failed to save settings");
      }
    } catch (err: any) {
      setError("Network error. Please try again.");
      console.error("Save settings failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddRule = async () => {
    if (!newRule.title.trim()) return;
    
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`${API_BASE}/groups/${id}/rules`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(newRule)
      });
      
      const result = await response.json();
      
      if (result.isSuccess) {
        setNewRule({ title: "", description: "" });
        loadData(); // Refresh rules list
      } else {
        setError(result.message || "Failed to add rule");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Add rule failed:", err);
    }
  };

  const handleReviewRequest = async (requestId: number, approve: boolean) => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`${API_BASE}/groups/join-requests/${requestId}/review`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ approve, notes: "" })
      });
      
      const result = await response.json();
      
      if (result.isSuccess) {
        loadData(); // Refresh requests list
      } else {
        setError(result.message || "Failed to process request");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Review request failed:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-16">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!isOrganizer) {
    return (
      <div className="min-h-screen bg-background pt-16">
        <div className="container mx-auto px-4 py-12 text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-6">Only the group organizer can manage settings.</p>
          <Button onClick={() => navigate(`/groups/${id}`)}>Back to Group</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/groups/${id}`)}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Group
          </Button>
          <h1 className="text-2xl font-bold">Group Settings</h1>
        </div>

        {/* Messages */}
        {success && (
          <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="space-y-8">
          {/* Membership Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Membership Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Private Group</Label>
                  <p className="text-sm text-muted-foreground">Require approval for new members</p>
                </div>
                <Switch
                  checked={settings.isPrivate}
                  onCheckedChange={(checked) => handleSettingsChange("isPrivate", checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Allow Member Invites</Label>
                  <p className="text-sm text-muted-foreground">Members can invite others</p>
                </div>
                <Switch
                  checked={settings.allowMemberInvites}
                  onCheckedChange={(checked) => handleSettingsChange("allowMemberInvites", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Content Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Content Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Allow Member Posts</Label>
                  <p className="text-sm text-muted-foreground">Members can send messages</p>
                </div>
                <Switch
                  checked={settings.allowMemberPosts}
                  onCheckedChange={(checked) => handleSettingsChange("allowMemberPosts", checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Moderate Messages</Label>
                  <p className="text-sm text-muted-foreground">Messages require approval before posting</p>
                </div>
                <Switch
                  checked={settings.moderateMessages}
                  onCheckedChange={(checked) => handleSettingsChange("moderateMessages", checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Allow Links</Label>
                  <p className="text-sm text-muted-foreground">Members can share URLs</p>
                </div>
                <Switch
                  checked={settings.allowLinks}
                  onCheckedChange={(checked) => handleSettingsChange("allowLinks", checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Allow Media</Label>
                  <p className="text-sm text-muted-foreground">Members can share images/videos</p>
                </div>
                <Switch
                  checked={settings.allowMedia}
                  onCheckedChange={(checked) => handleSettingsChange("allowMedia", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Group Rules */}
          <Card>
            <CardHeader>
              <CardTitle>Group Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Rule */}
              <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                <Label>Add New Rule</Label>
                <Input
                  placeholder="Rule title (e.g., Be Respectful)"
                  value={newRule.title}
                  onChange={(e) => setNewRule(prev => ({ ...prev, title: e.target.value }))}
                />
                <Input
                  placeholder="Description (optional)"
                  value={newRule.description}
                  onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))}
                />
                <Button onClick={handleAddRule} size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Rule
                </Button>
              </div>
              
              {/* Existing Rules */}
              <div className="space-y-3">
                {rules.map((rule, index) => (
                  <div key={rule.id} className="flex items-start justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{index + 1}. {rule.title}</p>
                      {rule.description && (
                        <p className="text-sm text-muted-foreground mt-1">{rule.description}</p>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {rules.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No rules set yet. Add your first rule above.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pending Join Requests */}
          {pendingRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Pending Join Requests ({pendingRequests.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">
                        {request.user.firstName} {request.user.lastName}
                      </p>
                      {request.message && (
                        <p className="text-sm text-muted-foreground mt-1">"{request.message}"</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Requested: {new Date(request.requestedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleReviewRequest(request.id, false)}
                      >
                        Reject
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handleReviewRequest(request.id, true)}
                      >
                        Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={saving} className="gap-2">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupSettings;