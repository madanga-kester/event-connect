import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Music, Utensils, Palette, Dumbbell, TreePine, Monitor, Camera, BookOpen, Gamepad2, Plane, Heart, Sparkles, Loader2, Check, AlertCircle } from "lucide-react";

const ICON_MAP: Record<string, any> = {
  "Music": Music, "Food & Drink": Utensils, "Art": Palette, "Wellness": Heart,
  "Outdoors": TreePine, "Tech": Monitor, "Photography": Camera, "Learning": BookOpen,
  "Gaming": Gamepad2, "Travel": Plane, "Fitness": Dumbbell, "Nightlife": Sparkles,
};

const COLOR_MAP: Record<string, string> = {
  "Music": "from-rose-500 to-pink-500", "Food & Drink": "from-amber-500 to-orange-500",
  "Art": "from-violet-500 to-purple-500", "Wellness": "from-pink-400 to-rose-400",
  "Outdoors": "from-teal-500 to-cyan-500", "Tech": "from-blue-500 to-indigo-500",
  "Photography": "from-fuchsia-500 to-pink-500", "Learning": "from-yellow-500 to-amber-500",
  "Gaming": "from-red-500 to-rose-500", "Travel": "from-sky-500 to-blue-500",
  "Fitness": "from-green-500 to-emerald-500", "Nightlife": "from-purple-500 to-violet-500",
};

interface Interest {
  id: number; name: string; category: string; icon?: string;
}

const Interests = () => {
  const [interests, setInterests] = useState<Interest[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) { navigate("/login"); return; }
    const fetchInterests = async () => {
      try {
        const response = await fetch("/api/interest/all", { headers: { "Authorization": `Bearer ${token}` }});
        if (response.ok) { const data = await response.json(); setInterests(data); }
        else { setError("Failed to load interests"); }
      } catch (err) { console.error("Error fetching interests:", err); setError("Network error"); }
      finally { setLoading(false); }
    };
    fetchInterests();
  }, [navigate]);

  const toggle = (id: number) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const handleSave = async () => {
    if (selected.length < 3) { setError("Please select at least 3 interests"); return; }
    setSaving(true); setError(null);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/interest/select", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ interestIds: selected })
      });








      



      if (response.ok) {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        user.hasInterests = true;
        localStorage.setItem("user", JSON.stringify(user));
        setSuccessMessage("Interests saved! Redirecting...");
        setTimeout(() => navigate("/"), 1000);
      } else {
        const err = await response.json();
        setError(err.message || "Failed to save interests");
      }
    } catch (err) { console.error("Save failed:", err); setError("Network error"); }
    finally { setSaving(false); }
  };

  const handleSkip = () => {
    if (window.confirm("Skip interest selection? You can update this later in your profile.")) {
      // Note: User skipped, so next login will still redirect to interests
      navigate("/");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" /><p className="text-muted-foreground">Loading interests...</p></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          {error && <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center justify-center gap-2 text-destructive text-sm"><AlertCircle className="h-4 w-4" /><span>{error}</span></div>}
          {successMessage && <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center justify-center gap-2 text-green-600 text-sm"><Check className="h-4 w-4" /><span>{successMessage}</span></div>}
          
          <h1 className="font-display text-4xl font-bold text-foreground mb-2">What are you into?</h1>
          <p className="text-muted-foreground mb-10">Select at least 3 interests so we can recommend events you'll love.</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-10">
            {interests.map((interest) => {
              const isSelected = selected.includes(interest.id);
              const Icon = ICON_MAP[interest.category] || Sparkles;
              const color = COLOR_MAP[interest.category] || "from-gray-500 to-slate-500";
              return (
                <button key={interest.id} onClick={() => toggle(interest.id)}
                  className={`relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-200 ${isSelected ? "border-primary bg-primary/10 shadow-glow" : "border-border bg-card hover:border-primary/30"}`}>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}><Icon className="h-5 w-5 text-white" /></div>
                  <span className="font-display text-sm font-medium text-foreground">{interest.name}</span>
                  {isSelected && <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center"><Check className="w-3 h-3 text-primary-foreground" /></div>}
                </button>
              );
            })}
          </div>

          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={handleSkip} disabled={saving}>Skip for now</Button>
            <Button className="bg-gradient-warm text-primary-foreground font-display font-semibold hover:opacity-90 px-8 py-3 text-base" onClick={handleSave} disabled={saving || selected.length < 3}>
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : `Continue with ${selected.length} selected`}
            </Button>
          </div>
          {selected.length > 0 && selected.length < 3 && <p className="text-center text-sm text-amber-600 mt-4">Select {3 - selected.length} more to unlock personalized recommendations ✨</p>}
        </div>
      </main>
      <Footer />
    </div>
  );
};
export default Interests;