import { MapPin, Calendar, MessageCircle, Heart, Users } from "lucide-react";
import { useState } from "react";

interface EventCardProps {
  title: string;
  image: string;
  date: string;
  location: string;
  group: string;
  attendees: number;
  comments: number;
  category: string;
}

const EventCard = ({ title, image, date, location, group, attendees, comments, category }: EventCardProps) => {
  const [liked, setLiked] = useState(false);

  return (
    <div className="group bg-card border border-border rounded-2xl overflow-hidden hover:shadow-glow transition-all duration-300 hover:border-primary/30">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={title}
          loading="lazy"
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 rounded-full bg-primary/90 text-primary-foreground text-xs font-semibold font-display">
            {category}
          </span>
        </div>
        <button
          onClick={() => setLiked(!liked)}
          className="absolute top-3 right-3 p-2 rounded-full bg-background/60 backdrop-blur-sm hover:bg-background/80 transition-colors"
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-primary text-primary" : "text-foreground"}`} />
        </button>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <Calendar className="h-3 w-3" />
          <span>{date}</span>
        </div>

        <h3 className="font-display font-semibold text-foreground text-lg leading-tight mb-2 group-hover:text-primary transition-colors">
          {title}
        </h3>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
          <MapPin className="h-3 w-3 text-primary" />
          <span>{location}</span>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>{attendees} going</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MessageCircle className="h-3 w-3" />
            <span>{comments}</span>
          </div>
          <span className="text-xs text-primary font-medium">{group}</span>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
