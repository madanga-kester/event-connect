import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, Sparkles } from "lucide-react";
import { Interest } from "@/lib/types";

interface InterestSelectorProps {
  onComplete?: () => void;
  compact?: boolean;
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5260/api";

const InterestSelector = ({ onComplete, compact = false }: InterestSelectorProps) => {
  const { token, user } = useAuth();
  const [interests, setInterests] = useState<Interest[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch available interests + user's current selections
  useEffect(() => {
    const fetchInterests = async () => {
      try {
        setLoading(true);
        
        // Fetch all available interests
        const interestsRes = await fetch(`${API_BASE}/interest/all`);
        const interestsData = await interestsRes.json();
        setInterests(interestsData.value || interestsData);
        
        // Fetch user's current selections (if logged in)
        if (token) {
          const myRes = await fetch(`${API_BASE}/interest/my`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (myRes.ok) {
            const myData = await myRes.json();
            setSelectedIds(myData.map((i: Interest) => i.id));
          }
        }
      } catch (err) {
        console.error("Failed to fetch interests:", err);
        setError("Could not load interests. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchInterests();
  }, [token]);

  const toggleInterest = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id) 
        : [...prev, id]
    );
    setSuccess(false);
    setError(null);
  };

  const saveInterests = async () => {
    if (!token) return;
    
    try {
      setSaving(true);
      setError(null);
      
      const response = await fetch(`${API_BASE}/interest/select`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ interestIds: selectedIds }),
      });
      
      const result = await response.json();
      
      if (result.isSuccess || response.ok) {
        setSuccess(true);
        onComplete?.();
      } else {
        setError(result.message || "Failed to save interests");
      }
    } catch (err) {
      console.error("Save interests failed:", err);
      setError("Network error. Please check your connection.");
    } finally {
      setSaving(false);
    }
  };

  // Group interests by category for better organization
  const groupedInterests = interests.reduce((acc, interest) => {
    const category = interest.category || "Other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(interest);
    return acc;
  }, {} as Record<string, Interest[]>);

  if (loading) {
    return (
      <Card className={compact ? "p-4" : "max-w-2xl mx-auto"}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
          <span className="text-muted-foreground">Loading interests...</span>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    // Compact version for dropdown/sidebar
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm text-foreground">Your Interests</h4>
          <Badge variant="secondary" className="text-xs">
            {selectedIds.length} selected
          </Badge>
        </div>
        
        <div className="flex flex-wrap gap-1.5">
          {interests.slice(0, 12).map((interest) => (
            <Badge
              key={interest.id}
              variant={selectedIds.includes(interest.id) ? "default" : "outline"}
              className={`cursor-pointer text-xs transition-all ${
                selectedIds.includes(interest.id)
                  ? "bg-primary hover:bg-primary/90"
                  : "hover:bg-muted hover:border-primary/50"
              }`}
              onClick={() => toggleInterest(interest.id)}
            >
              {selectedIds.includes(interest.id) && (
                <Check className="h-3 w-3 mr-0.5 inline" />
              )}
              {interest.name}
            </Badge>
          ))}
        </div>
        
        <Button 
          size="sm" 
          onClick={saveInterests}
          disabled={saving || selectedIds.length === 0}
          className="w-full mt-2"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Sparkles className="h-4 w-4 mr-1" />
          )}
          Save Preferences
        </Button>
        
        {error && (
          <p className="text-xs text-destructive mt-1">{error}</p>
        )}
        {success && (
          <p className="text-xs text-green-600 mt-1">✓ Preferences saved!</p>
        )}
      </div>
    );
  }

  // Full version for dedicated page
  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Choose Your Interests
        </CardTitle>
        <CardDescription>
          Select topics you love to see personalized event recommendations
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Success Message */}
        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
            <Check className="h-4 w-4" />
            Preferences saved! Your feed will update shortly.
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
            {error}
          </div>
        )}
        
        {/* Interest Categories */}
        {Object.entries(groupedInterests).map(([category, categoryInterests]) => (
          <div key={category} className="space-y-3">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              {category}
              <Badge variant="outline" className="text-xs font-normal">
                {categoryInterests.length}
              </Badge>
            </h4>
            
            <div className="flex flex-wrap gap-2">
              {categoryInterests.map((interest) => (
                <Button
                  key={interest.id}
                  type="button"
                  variant={selectedIds.includes(interest.id) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleInterest(interest.id)}
                  className={`transition-all ${
                    selectedIds.includes(interest.id)
                      ? "bg-primary hover:bg-primary/90 shadow-sm"
                      : "hover:bg-muted hover:border-primary/50"
                  }`}
                >
                  {selectedIds.includes(interest.id) && (
                    <Check className="h-4 w-4 mr-1.5" />
                  )}
                  {interest.icon && <span className="mr-1.5">{interest.icon}</span>}
                  {interest.name}
                </Button>
              ))}
            </div>
          </div>
        ))}
        
        {/* Save Button */}
        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {selectedIds.length} selected • Choose at least 3 for best results
          </p>
          <Button 
            onClick={saveInterests}
            disabled={saving || selectedIds.length === 0}
            className="min-w-[120px]"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Save Preferences
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default InterestSelector;