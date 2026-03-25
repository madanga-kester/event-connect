import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Music, Utensils, Palette, Dumbbell, TreePine, Monitor, Camera, BookOpen, Gamepad2, Plane, Heart, Sparkles } from "lucide-react";

const interests = [
  { name: "Music", icon: Music, color: "from-rose-500 to-pink-500" },
  { name: "Food & Drink", icon: Utensils, color: "from-amber-500 to-orange-500" },
  { name: "Art & Design", icon: Palette, color: "from-violet-500 to-purple-500" },
  { name: "Fitness", icon: Dumbbell, color: "from-green-500 to-emerald-500" },
  { name: "Outdoors", icon: TreePine, color: "from-teal-500 to-cyan-500" },
  { name: "Tech", icon: Monitor, color: "from-blue-500 to-indigo-500" },
  { name: "Photography", icon: Camera, color: "from-fuchsia-500 to-pink-500" },
  { name: "Books & Culture", icon: BookOpen, color: "from-yellow-500 to-amber-500" },
  { name: "Gaming", icon: Gamepad2, color: "from-red-500 to-rose-500" },
  { name: "Travel", icon: Plane, color: "from-sky-500 to-blue-500" },
  { name: "Wellness", icon: Heart, color: "from-pink-400 to-rose-400" },
  { name: "Nightlife", icon: Sparkles, color: "from-purple-500 to-violet-500" },
];

const Interests = () => {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (name: string) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h1 className="font-display text-4xl font-bold text-foreground mb-2">What are you into?</h1>
          <p className="text-muted-foreground mb-10">
            Select your interests so we can recommend events you'll love.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-10">
            {interests.map(({ name, icon: Icon, color }) => {
              const isSelected = selected.includes(name);
              return (
                <button
                  key={name}
                  onClick={() => toggle(name)}
                  className={`relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-200 ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-glow"
                      : "border-border bg-card hover:border-primary/30"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-display text-sm font-medium text-foreground">{name}</span>
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <Button
            className="bg-gradient-warm text-primary-foreground font-display font-semibold hover:opacity-90 px-8 py-3 text-base"
            disabled={selected.length === 0}
          >
            Save Interests ({selected.length})
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Interests;
