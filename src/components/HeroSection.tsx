import { Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-event.jpg";
import { useState } from "react";

const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");

  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Live event at sunset"
          className="h-full w-full object-cover"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
      </div>

      <div className="relative z-10 container mx-auto px-4 text-center">
        <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight mb-4">
          Discover Events<br />
          <span className="text-gradient">Near You</span>
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl max-w-xl mx-auto mb-10">
          Post, explore, and connect through local events. Find your community.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto bg-card/80 backdrop-blur-md border border-border rounded-2xl p-3">
          <div className="flex items-center gap-2 flex-1 px-3">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
            />
          </div>
          <div className="flex items-center gap-2 flex-1 px-3 border-t sm:border-t-0 sm:border-l border-border pt-3 sm:pt-0">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <input
              type="text"
              placeholder="City or zip code"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
            />
          </div>
          <Button className="bg-gradient-warm text-primary-foreground font-display font-semibold hover:opacity-90 transition-opacity rounded-xl px-6">
            Explore
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 justify-center mt-6">
          {["Music", "Food & Drink", "Tech", "Art", "Wellness", "Outdoors"].map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium hover:bg-primary/20 hover:text-primary cursor-pointer transition-colors"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
