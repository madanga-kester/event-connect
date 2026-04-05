import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X, User, CheckCircle, ArrowRight, Sparkles } from "lucide-react";

const ProfileNudge = () => {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [percentage, setPercentage] = useState(0);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setShow(false);
      return;
    }

    fetch("/api/auth/profile-completeness", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.isComplete && data.percentage < 80) {
          setPercentage(data.percentage);
          setMissingFields(data.missingFields || []);
          // Small delay for smoother entrance
          setTimeout(() => setShow(true), 300);
        }
      })
      .catch((err) => {
        console.error("ProfileNudge: Failed to fetch completeness", err);
        setShow(false);
      });
  }, []);

  const handleDismiss = () => {
    setShow(false);
  };

  if (!show || !mounted) return null;

  const getFieldNames = (fields: string[]) => {
    const fieldMap: Record<string, string> = {
      Bio: "Bio",
      DateOfBirth: "Birthday",
      City: "City",
      Country: "Country",
      ProfilePicture: "Photo",
      Website: "Website",
    };
    return fields.slice(0, 2).map((f) => fieldMap[f] || f).join(" & ");
  };

  return (
    // ✅ Fixed bottom-right, responsive for mobile
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 max-w-sm w-[calc(100vw-2rem)] sm:w-96 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div 
        className="group relative overflow-hidden rounded-2xl border border-primary/20 bg-background/90 backdrop-blur-xl 
                   shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)]
                   hover:shadow-[0_25px_60px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_25px_60px_rgba(0,0,0,0.4)]
                   transition-all duration-300 hover:-translate-y-0.5"
      >
        
        {/* Subtle animated background glow */}
        <div className="absolute -inset-px bg-gradient-to-r from-primary/15 via-transparent to-primary/10 opacity-60 animate-pulse" />

        <div className="relative p-4 sm:p-5">
          <div className="flex items-start gap-4">
            
            {/* Left: Avatar + Progress Badge */}
            <div className="relative shrink-0 mt-0.5">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                <User className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              {/* Progress badge */}
              <div className="absolute -bottom-1 -right-1">
                <div className="bg-background rounded-full p-0.5 shadow-sm ring-1 ring-border">
                   <div className="bg-primary text-[10px] font-bold text-primary-foreground h-4.5 w-4.5 sm:h-5 sm:w-5 rounded-full flex items-center justify-center">
                    {percentage}
                   </div>
                </div>
              </div>
            </div>

            {/* Middle: Content */}
            <div className="flex-1 min-w-0 pr-6">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-bold tracking-tight text-foreground flex items-center gap-1.5">
                  Unlock your potential
                  <Sparkles className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500/20 animate-pulse" />
                </h4>
                <button 
                  onClick={handleDismiss}
                  aria-label="Dismiss notification"
                  className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Your profile is almost there. Adding your <span className="text-foreground font-medium">{getFieldNames(missingFields)}</span> helps you stand out.
              </p>

              {/* Progress + CTA */}
              <div className="mt-4 flex items-center gap-3">
                <Progress value={percentage} className="h-1.5 flex-1 bg-secondary/50" />
                <Button 
                  size="sm"
                  onClick={() => navigate("/profile")}
                  className="h-8 rounded-lg px-3 bg-primary text-primary-foreground hover:opacity-90 hover:scale-105 active:scale-95 transition-all shadow-sm"
                >
                  <span className="text-xs font-semibold">Finish</span>
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Animated bottom progress line */}
        <div 
          className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-primary to-primary/60 transition-all duration-700 ease-out" 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProfileNudge;