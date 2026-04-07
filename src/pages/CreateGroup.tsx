import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2, ArrowLeft, Upload, Image as ImageIcon, Plus, Trash2,
  Lock, Globe, Users, MapPin, Tag, Settings, CheckCircle, AlertCircle
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5260/api";

interface Rule {
  id: string;
  title: string;
  description: string;
}

interface InterestTag {
  id: string;
  name: string;
}

const CreateGroup = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
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
  });

  const [rules, setRules] = useState<Rule[]>([]);
  const [newRule, setNewRule] = useState({ title: "", description: "" });
  
  const [interestTags, setInterestTags] = useState<InterestTag[]>([]);
  const [newTag, setNewTag] = useState("");

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image must be less than 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file");
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddRule = () => {
    if (!newRule.title.trim()) return;
    
    const rule: Rule = {
      id: crypto.randomUUID(),
      title: newRule.title.trim(),
      description: newRule.description.trim(),
    };
    
    setRules(prev => [...prev, rule]);
    setNewRule({ title: "", description: "" });
  };

  const handleRemoveRule = (id: string) => {
    setRules(prev => prev.filter(rule => rule.id !== id));
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    
    const tag: InterestTag = {
      id: crypto.randomUUID(),
      name: newTag.trim(),
    };
    
    setInterestTags(prev => [...prev, tag]);
    setNewTag("");
  };

  const handleRemoveTag = (id: string) => {
    setInterestTags(prev => prev.filter(tag => tag.id !== id));
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      // Validate current step before proceeding
      if (currentStep === 1 && !formData.name.trim()) {
        setError("Group name is required");
        return;
      }
      setError(null);
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("auth_token");
    
    if (!token) {
      navigate("/login", { state: { from: "/create-group" } });
      return;
    }

    // Final validation
    if (!formData.name.trim()) {
      setError("Group name is required");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Prepare payload
      const payload: any = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        city: formData.city.trim() || null,
        country: formData.country.trim() || null,
        location: formData.location.trim() || null,
        isPrivate: formData.isPrivate,
        allowMemberInvites: formData.allowMemberInvites,
        allowMemberPosts: formData.allowMemberPosts,
        moderateMessages: formData.moderateMessages,
        maxMembers: formData.maxMembers ? parseInt(formData.maxMembers) : null,
        rules: rules.map(r => ({ title: r.title, description: r.description })),
        interestTags: interestTags.map(t => t.name),
      };

      // If image file selected, we'd need to handle multipart form data
      // For now, we'll send as JSON (backend would need to support base64 or separate upload)
      if (imagePreview && !imagePreview.startsWith("http")) {
        // Convert data URL to base64 for sending (optional - backend must support)
        payload.coverImageBase64 = imagePreview;
      } else if (formData.coverImage) {
        payload.coverImage = formData.coverImage;
      }

      const response = await fetch(`${API_BASE}/groups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.isSuccess) {
        setSuccess("Group created successfully!");
        setTimeout(() => {
          navigate(`/groups/${result.group.id}`);
        }, 1500);
      } else {
        setError(result.message || "Failed to create group");
      }
    } catch (err) {
      setError("Network error. Please check your connection.");
      console.error("Create group failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[1, 2, 3].map((step) => (
        <div key={step} className="flex items-center">
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
            ${currentStep === step 
              ? "bg-primary text-primary-foreground" 
              : currentStep > step 
                ? "bg-green-500 text-white" 
                : "bg-muted text-muted-foreground"}
          `}>
            {currentStep > step ? <CheckCircle className="h-4 w-4" /> : step}
          </div>
          {step < totalSteps && (
            <div className={`w-12 h-0.5 mx-2 ${currentStep > step ? "bg-green-500" : "bg-muted"}`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-base font-semibold">Group Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="e.g., Nairobi Tech Enthusiasts"
          className="text-lg"
          required
        />
        <p className="text-sm text-muted-foreground">Choose a clear, descriptive name for your group</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-base font-semibold">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="What is this group about? Who should join? What activities do you plan?"
          rows={5}
          className="resize-none"
        />
        <p className="text-sm text-muted-foreground">{formData.description.length}/500 characters</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            City
          </Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => handleChange("city", e.target.value)}
            placeholder="Nairobi"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            value={formData.country}
            onChange={(e) => handleChange("country", e.target.value)}
            placeholder="Kenya"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Specific Location (Optional)</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => handleChange("location", e.target.value)}
          placeholder="e.g., iHub, Westlands or Online"
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      {/* Privacy Settings */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            {formData.isPrivate ? <Lock className="h-5 w-5 text-primary" /> : <Globe className="h-5 w-5 text-primary" />}
            Privacy Settings
          </CardTitle>
          <CardDescription>Control who can find and join your group</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
            <div className="space-y-0.5">
              <Label className="font-medium flex items-center gap-2">
                {formData.isPrivate ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                {formData.isPrivate ? "Private Group" : "Public Group"}
              </Label>
              <p className="text-sm text-muted-foreground">
                {formData.isPrivate 
                  ? "Members must be approved to join. Group won't appear in public search." 
                  : "Anyone can find and join your group instantly."}
              </p>
            </div>
            <Switch
              checked={formData.isPrivate}
              onCheckedChange={(checked) => handleChange("isPrivate", checked)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label className="font-medium text-sm">Allow Member Invites</Label>
                <p className="text-xs text-muted-foreground">Members can invite others</p>
              </div>
              <Switch
                checked={formData.allowMemberInvites}
                onCheckedChange={(checked) => handleChange("allowMemberInvites", checked)}
              />
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label className="font-medium text-sm">Max Members</Label>
                <p className="text-xs text-muted-foreground">Leave empty for unlimited</p>
              </div>
              <Input
                type="number"
                min="1"
                value={formData.maxMembers}
                onChange={(e) => handleChange("maxMembers", e.target.value)}
                placeholder="Unlimited"
                className="w-24"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="h-5 w-5 text-primary" />
            Content Settings
          </CardTitle>
          <CardDescription>Control what members can post</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label className="font-medium text-sm">Allow Member Posts</Label>
              <p className="text-xs text-muted-foreground">Members can send messages in chat</p>
            </div>
            <Switch
              checked={formData.allowMemberPosts}
              onCheckedChange={(checked) => handleChange("allowMemberPosts", checked)}
            />
          </div>
          
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label className="font-medium text-sm">Moderate Messages</Label>
              <p className="text-xs text-muted-foreground">Messages require approval before posting</p>
            </div>
            <Switch
              checked={formData.moderateMessages}
              onCheckedChange={(checked) => handleChange("moderateMessages", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Cover Image Upload */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ImageIcon className="h-5 w-5 text-primary" />
            Cover Image
          </CardTitle>
          <CardDescription>Add a visual identity to your group</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {imagePreview ? (
              <div className="relative rounded-lg overflow-hidden border aspect-video bg-muted">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 h-8 w-8 p-0"
                  onClick={handleRemoveImage}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium text-foreground mb-1">Click to upload cover image</p>
                <p className="text-sm text-muted-foreground">PNG, JPG up to 5MB</p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="coverImageUrl">Or use image URL</Label>
              <Input
                id="coverImageUrl"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={formData.coverImage}
                onChange={(e) => handleChange("coverImage", e.target.value)}
                disabled={!!imagePreview}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      {/* Group Rules */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="h-5 w-5 text-primary" />
            Group Rules
          </CardTitle>
          <CardDescription>Set expectations for your community</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add New Rule */}
          <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
            <Label className="font-medium">Add New Rule</Label>
            <Input
              placeholder="Rule title (e.g., Be Respectful)"
              value={newRule.title}
              onChange={(e) => setNewRule(prev => ({ ...prev, title: e.target.value }))}
            />
            <Textarea
              placeholder="Description (optional)"
              value={newRule.description}
              onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
            />
            <Button onClick={handleAddRule} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Rule
            </Button>
          </div>
          
          {/* Existing Rules */}
          <div className="space-y-2">
            {rules.map((rule, index) => (
              <div key={rule.id} className="flex items-start justify-between p-3 border rounded-lg group">
                <div className="flex-1">
                  <p className="font-medium">{index + 1}. {rule.title}</p>
                  {rule.description && (
                    <p className="text-sm text-muted-foreground mt-1">{rule.description}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemoveRule(rule.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {rules.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                No rules set yet. Add your first rule above to set community expectations.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Interest Tags */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Tag className="h-5 w-5 text-primary" />
            Interest Tags
          </CardTitle>
          <CardDescription>Help people discover your group</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add a tag (e.g., Technology, Networking)"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
            />
            <Button type="button" onClick={handleAddTag} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {interestTags.map((tag) => (
              <Badge key={tag.id} variant="secondary" className="gap-1 px-3 py-1">
                {tag.name}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag.id)}
                  className="ml-1 hover:text-destructive focus:outline-none"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {interestTags.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Add tags like "Technology", "Networking", "Startups" to help people find your group
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <h4 className="font-semibold text-foreground mb-3">Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Group Name:</span>
              <span className="font-medium">{formData.name || "Not set"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Privacy:</span>
              <span className="font-medium flex items-center gap-1">
                {formData.isPrivate ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                {formData.isPrivate ? "Private" : "Public"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Location:</span>
              <span className="font-medium">{formData.city || formData.country ? `${formData.city}${formData.city && formData.country ? ", " : ""}${formData.country}` : "Not set"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rules:</span>
              <span className="font-medium">{rules.length} rule{rules.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tags:</span>
              <span className="font-medium">{interestTags.length} tag{interestTags.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pt-16 pb-12">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate("/groups")} className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Create New Group</h1>
            <p className="text-muted-foreground">Set up your community in minutes</p>
          </div>
        </div>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Form Card */}
        <Card className="border-border shadow-sm">
          <form onSubmit={handleSubmit}>
            <CardContent className="pt-6">
              {/* Messages */}
              {error && (
                <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Error</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              )}
              
              {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Success</p>
                    <p className="text-sm">{success}</p>
                  </div>
                </div>
              )}

              {/* Step Content */}
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
            </CardContent>

            <Separator />

            <CardFooter className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={currentStep === 1 ? () => navigate("/groups") : handleBack}
                disabled={loading}
              >
                {currentStep === 1 ? "Cancel" : "Back"}
              </Button>
              
              {currentStep < totalSteps ? (
                <Button type="button" onClick={handleNext} disabled={loading}>
                  Next Step
                </Button>
              ) : (
                <Button type="submit" disabled={loading} className="gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating Group...
                    </>
                  ) : (
                    <>
                      <Users className="h-4 w-4" />
                      Create Group
                    </>
                  )}
                </Button>
              )}
            </CardFooter>
          </form>
        </Card>

        {/* Help Text */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Need help? <a href="#" className="text-primary hover:underline">View group creation guide</a></p>
        </div>
      </div>
    </div>
  );
};

export default CreateGroup;