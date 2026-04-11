import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  User, Mail, Phone, MapPin, Calendar, Link as LinkIcon, Globe, Edit, Save, X, 
  CheckCircle, AlertCircle, Loader2, Camera, Sparkles, Target, TrendingUp
} from "lucide-react";

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  bio?: string;
  dateOfBirth?: string;
  city?: string;
  country?: string;
  website?: string;
  profilePicture?: string;
  age?: number;
}

interface ProfileCompleteness {
  isComplete: boolean;
  percentage: number;
  message: string;
  missingFields: string[];
}

const Profile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [profileCompleteness, setProfileCompleteness] = useState<ProfileCompleteness>({
    isComplete: false,
    percentage: 0,
    message: "",
    missingFields: []
  });

  const [profile, setProfile] = useState<UserProfile>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    bio: "",
    dateOfBirth: "",
    city: "",
    country: "",
    website: "",
    profilePicture: "",
    age: undefined,
  });

  const [originalProfile, setOriginalProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const userData = localStorage.getItem("user");
    
    if (!token || !userData) {
      navigate("/login");
      return;
    }

    const loadData = async () => {
      try {
        const user = JSON.parse(userData);
        const loadedProfile = {
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.email || "",
          phone: user.phoneNumber || "",
          bio: user.bio || "",
          dateOfBirth: user.dateOfBirth || "",
          city: user.city || "",
          country: user.country || "",
          website: user.website || "",
          profilePicture: user.profilePicture || "",
          age: user.age || undefined,
        };
        
        setProfile(loadedProfile);
        setOriginalProfile({ ...loadedProfile });
        await fetchProfileCompleteness(token);
      } catch (err) {
        console.error("Failed to load profile:", err);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  const fetchProfileCompleteness = async (token: string) => {
    try {
      const response = await fetch("/api/auth/profile-completeness", {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setProfileCompleteness(data);
      } else {
        //  FALLBACK: Calculate completeness locally if endpoint fails
        calculateCompletenessLocally();
      }
    } catch (err) {
      console.error("Failed to fetch completeness:", err);
      //  FALLBACK: Calculate locally on error
      calculateCompletenessLocally();
    }
  };

  //  FALLBACK: Calculate profile completeness locally
  const calculateCompletenessLocally = () => {
    const fields = [
      profile.firstName,
      profile.lastName,
      profile.bio,
      profile.city,
      profile.country,
      profile.phone,
      profile.website,
      profile.dateOfBirth,
      profile.profilePicture
    ];
    
    const filled = fields.filter(f => f && f.trim() !== "").length;
    const percentage = Math.round((filled / fields.length) * 100);
    
    setProfileCompleteness({
      isComplete: percentage >= 80,
      percentage,
      message: percentage >= 80 ? "Profile looks great!" : `Complete ${80 - percentage}% more to boost visibility`,
      missingFields: fields.filter(f => !f || f.trim() === "").map((_, i) => 
        ["First Name", "Last Name", "Bio", "City", "Country", "Phone", "Website", "Date of Birth", "Profile Picture"][i]
      )
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value, type } = e.target;
    setProfile(prev => ({ 
      ...prev, 
      [id]: type === "number" ? (value ? parseInt(value) : undefined) : value 
    }));
    setError(null);
    // ✅ Recalculate completeness when fields change
    setTimeout(calculateCompletenessLocally, 100);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    setUploadingImage(true);
    setError(null);

    const previewUrl = URL.createObjectURL(file);
    
    setTimeout(() => {
      setProfile(prev => ({ ...prev, profilePicture: previewUrl }));
      setUploadingImage(false);
      setSuccessMessage("Profile picture updated!");
      calculateCompletenessLocally();
      setTimeout(() => setSuccessMessage(null), 2000);
    }, 800);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleEdit = () => {
    setOriginalProfile({ ...profile });
    setIsEditing(true);
    setError(null);
    setSuccessMessage(null);
  };

  const handleCancel = () => {
    if (originalProfile) setProfile(originalProfile);
    setIsEditing(false);
    setError(null);
    setSuccessMessage(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/auth/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          Email: profile.email,
          FirstName: profile.firstName.trim(),
          LastName: profile.lastName.trim(),
          Bio: profile.bio,
          DateOfBirth: profile.dateOfBirth || null,
          City: profile.city,
          Country: profile.country,
          Website: profile.website,
          PhoneNumber: profile.phone,
          ProfilePicture: profile.profilePicture,
          Age: profile.age,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.isSuccess) {
        throw new Error(result.message || "Failed to update profile");
      }

      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({
        ...userData,
        firstName: profile.firstName,
        lastName: profile.lastName,
        bio: profile.bio,
        dateOfBirth: profile.dateOfBirth,
        city: profile.city,
        country: profile.country,
        website: profile.website,
        profilePicture: profile.profilePicture,
        age: profile.age,
      }));

      setSuccessMessage("Profile updated successfully!");
      await fetchProfileCompleteness(token!);
      setIsEditing(false);
      setOriginalProfile({ ...profile });
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-KE", {
      year: "numeric", month: "long", day: "numeric"
    });
  };

  const getInitials = () => `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-16">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/*   HEADER BANNER  */}
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 overflow-hidden">
        {/* Animated background particles */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-10 left-10 w-20 h-20 bg-primary/30 rounded-full blur-2xl animate-pulse" />
          <div className="absolute bottom-10 right-20 w-32 h-32 bg-purple-500/30 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-pink-500/30 rounded-full blur-2xl animate-pulse delay-500" />
        </div>
        
        {/* Overlay content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-background/80 backdrop-blur-sm rounded-full border border-border mb-4">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Your Journey, Your Story</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground drop-shadow-sm">
              {profile.firstName} {profile.lastName}
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              {profile.city && profile.country ? `${profile.city}, ${profile.country}` : "Building your presence"}
            </p>
          </div>
        </div>
        
        {/* Decorative corner elements */}
        <div className="absolute top-4 left-4 w-16 h-16 border-l-2 border-t-2 border-primary/40 rounded-tl-lg" />
        <div className="absolute bottom-4 right-4 w-16 h-16 border-r-2 border-b-2 border-primary/40 rounded-br-lg" />
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      <div className="container mx-auto px-4 py-8 max-w-6xl -mt-16 relative z-10">
        {/* Success / Error Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span>{successMessage}</span>
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-xl flex items-center gap-3 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT SIDEBAR - Avatar + Quick Info + Profile Strength */}
          <div className="lg:col-span-4 xl:col-span-3">
            <Card className="sticky top-24 border-border bg-card">
              <CardContent className="pt-8 pb-6">
                <div className="flex flex-col items-center text-center">
                  {/* Avatar -  main one */}
                  <div className="relative mb-6">
                    <Avatar className="w-32 h-32 ring-4 ring-background shadow-xl border-4 border-primary/20">
                      <AvatarImage src={profile.profilePicture} className="object-cover" />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-5xl font-bold">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    
                    {isEditing && (
                      <button
                        onClick={triggerFileInput}
                        disabled={uploadingImage}
                        className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground p-2.5 rounded-full shadow-lg hover:bg-primary/90 transition-all"
                        title="Change photo"
                      >
                        {uploadingImage ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Camera className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>

                  <h3 className="font-semibold text-xl mb-1">{profile.firstName} {profile.lastName}</h3>
                  <p className="text-muted-foreground text-sm mb-4 flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    {profile.email}
                  </p>

                  {/*  Profile Strength -  calculated */}
                  <div className="w-full mb-6">
                    <div className="flex justify-between text-xs font-medium mb-2">
                      <span className="text-foreground">Profile Strength</span>
                      <span className="text-primary font-semibold">{profileCompleteness.percentage}%</span>
                    </div>
                    <Progress value={profileCompleteness.percentage} className="h-2" />
                    {profileCompleteness.isComplete ? (
                      <Badge variant="secondary" className="mt-2 bg-green-500/10 text-green-600 border-green-500/30">
                        <CheckCircle className="h-3 w-3 mr-1" /> Complete
                      </Badge>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-2">{profileCompleteness.message}</p>
                    )}
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-2 w-full text-center py-3 border-t border-border">
                    <div>
                      <p className="text-lg font-bold text-primary">0</p>
                      <p className="text-xs text-muted-foreground">Events</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-primary">0</p>
                      <p className="text-xs text-muted-foreground">Groups</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-primary">0</p>
                      <p className="text-xs text-muted-foreground">Following</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT MAIN CONTENT */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-6">
            {/* Action Buttons - Sticky on mobile */}
            <div className="flex justify-end gap-3 sticky top-20 z-20 bg-background/80 backdrop-blur-sm py-3 -mx-4 px-4 border-b border-border lg:static lg:bg-transparent lg:backdrop-blur-none lg:p-0 lg:border-0 lg:mx-0">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={handleCancel} disabled={saving || uploadingImage} className="gap-2">
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving || uploadingImage} className="gap-2 bg-gradient-warm">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button onClick={handleEdit} className="gap-2">
                  <Edit className="h-4 w-4" />
                  Edit Profile
                </Button>
              )}
            </div>

            {/* Personal Information */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <User className="h-5 w-5 text-primary" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">First Name</Label>
                    {isEditing ? (
                      <Input id="firstName" value={profile.firstName} onChange={handleChange} className="font-medium" placeholder="John" />
                    ) : (
                      <p className="text-lg font-medium text-foreground">{profile.firstName || <span className="text-muted-foreground italic">Not set</span>}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Last Name</Label>
                    {isEditing ? (
                      <Input id="lastName" value={profile.lastName} onChange={handleChange} className="font-medium" placeholder="Doe" />
                    ) : (
                      <p className="text-lg font-medium text-foreground">{profile.lastName || <span className="text-muted-foreground italic">Not set</span>}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">About Me</Label>
                  {isEditing ? (
                    <Textarea id="bio" value={profile.bio} onChange={handleChange} rows={4} placeholder="Share your story, interests, and what you're looking for..." className="resize-none" maxLength={500} />
                  ) : (
                    <p className="leading-relaxed text-foreground">{profile.bio || <span className="text-muted-foreground italic">No bio added yet</span>}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date of Birth</Label>
                    {isEditing ? (
                      <Input id="dateOfBirth" type="date" value={profile.dateOfBirth} onChange={handleChange} />
                    ) : (
                      <p className="text-foreground">{formatDate(profile.dateOfBirth)}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Age</Label>
                    {isEditing ? (
                      <Input id="age" type="number" min="13" max="120" value={profile.age || ""} onChange={handleChange} placeholder="25" className="w-24" />
                    ) : (
                      <p className="text-foreground">{profile.age ? `${profile.age} years` : <span className="text-muted-foreground italic">Not set</span>}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</Label>
                    <div className="flex items-center gap-2 text-foreground">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {profile.email}
                    </div>
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Phone</Label>
                    <div className="flex items-center gap-2 text-foreground">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {profile.phone || <span className="text-muted-foreground italic">Not set</span>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">City</Label>
                    {isEditing ? (
                      <Input id="city" value={profile.city} onChange={handleChange} placeholder="Nairobi" />
                    ) : (
                      <p className="text-foreground">{profile.city || <span className="text-muted-foreground italic">Not set</span>}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Country</Label>
                    {isEditing ? (
                      <Input id="country" value={profile.country} onChange={handleChange} placeholder="Kenya" />
                    ) : (
                      <p className="text-foreground">{profile.country || <span className="text-muted-foreground italic">Not set</span>}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Online Presence */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-primary" />
                  Online Presence
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Website</Label>
                {isEditing ? (
                  <Input id="website" type="url" value={profile.website} onChange={handleChange} placeholder="https://yourwebsite.com" />
                ) : profile.website ? (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary hover:underline font-medium">
                    <LinkIcon className="h-4 w-4" />
                    {profile.website.replace(/^https?:\/\//, "")}
                  </a>
                ) : (
                  <p className="text-muted-foreground italic">No website added</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;