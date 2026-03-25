import { Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const groups = [
  { name: "NYC Foodies", members: 2340, color: "from-primary to-secondary" },
  { name: "Berlin Techno", members: 5120, color: "from-primary to-secondary" },
  { name: "SF Startup Meetups", members: 1890, color: "from-primary to-secondary" },
  { name: "Tokyo Art Scene", members: 980, color: "from-primary to-secondary" },
];

const GroupsPreview = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl font-bold text-foreground">Popular Groups</h2>
            <p className="text-muted-foreground mt-1">Join communities that share your vibe</p>
          </div>
          <Button variant="ghost" className="text-primary hover:text-primary/80 font-display">
            View All <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {groups.map((group) => (
            <div
              key={group.name}
              className="bg-card border border-border rounded-2xl p-5 hover:border-primary/30 hover:shadow-glow transition-all duration-300 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-warm flex items-center justify-center mb-4">
                <Users className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-1">{group.name}</h3>
              <p className="text-xs text-muted-foreground">{group.members.toLocaleString()} members</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GroupsPreview;
