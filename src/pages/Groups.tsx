import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Users, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const allGroups = [
  { name: "NYC Foodies", members: 2340, description: "Discover NYC's best food scene together", category: "Food & Drink" },
  { name: "Berlin Techno", members: 5120, description: "Underground and mainstream electronic music", category: "Music" },
  { name: "SF Startup Meetups", members: 1890, description: "Weekly startup demos and networking", category: "Tech" },
  { name: "Tokyo Art Scene", members: 980, description: "Contemporary art exhibitions and gallery crawls", category: "Art" },
  { name: "Wellness NYC", members: 1450, description: "Yoga, meditation, and mindful living", category: "Wellness" },
  { name: "Jazz Heads", members: 760, description: "Live jazz events across the city", category: "Music" },
  { name: "Outdoor Adventures", members: 3200, description: "Hiking, kayaking, and nature escapes", category: "Outdoors" },
  { name: "Photography Club", members: 1120, description: "Photo walks and critique sessions", category: "Art" },
  { name: "Book Worms NYC", members: 890, description: "Monthly book club and author events", category: "Culture" },
  { name: "Code & Coffee", members: 2100, description: "Casual coding sessions with great coffee", category: "Tech" },
  { name: "Vegan Eats", members: 640, description: "Plant-based food events and tastings", category: "Food & Drink" },
  { name: "Film Buffs", members: 1340, description: "Indie screenings and film discussions", category: "Culture" },
];

const categories = ["All", "Food & Drink", "Music", "Tech", "Art", "Wellness", "Outdoors", "Culture"];

const Groups = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = allGroups.filter((g) => {
    const matchesSearch = g.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "All" || g.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-4xl font-bold text-foreground">Groups</h1>
              <p className="text-muted-foreground mt-1">Find your community</p>
            </div>
            <Button className="bg-gradient-warm text-primary-foreground font-display font-semibold hover:opacity-90">
              <Plus className="h-4 w-4 mr-1" /> Create Group
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search groups..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-primary/20 hover:text-primary"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((group) => (
              <div
                key={group.name}
                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/30 hover:shadow-glow transition-all duration-300 cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-warm flex items-center justify-center mb-4">
                  <Users className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xs text-primary font-medium">{group.category}</span>
                <h3 className="font-display font-semibold text-foreground text-lg mt-1">{group.name}</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">{group.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{group.members.toLocaleString()} members</span>
                  <Button size="sm" variant="outline" className="text-xs h-8">
                    Join
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Groups;
