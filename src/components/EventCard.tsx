import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Users, Heart, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Event } from "@/lib/types";

interface EventCardProps {
  event: Event;
  variant?: "default" | "compact";
}

const EventCard = ({ event, variant = "default" }: EventCardProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-KE", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price?: number) => {
    if (!price || price === 0) return "Free";
    return `KES ${price.toLocaleString()}`;
  };

  if (variant === "compact") {
    return (
      <Card className="group overflow-hidden border-border bg-card hover:border-primary/50 transition-all duration-300">
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                <Link to={`/events/${event.id}`}>{event.title}</Link>
              </h3>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 shrink-0" />
                <span className="truncate">{formatDate(event.startTime)}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{event.city}, {event.country}</span>
              </div>
            </div>
            <Badge variant={event.isFree ? "secondary" : "default"} className="shrink-0">
              {formatPrice(event.price)}
            </Badge>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="group overflow-hidden border-border bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
      {/* Event Image */}
      <div className="relative h-40 overflow-hidden">
        <img
          src={event.coverImage || "https://via.placeholder.com/400x200?text=Event"}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x200?text=Event";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        
        {/* Price Badge */}
        <Badge 
          variant={event.isFree ? "secondary" : "default"}
          className="absolute top-3 right-3"
        >
          {formatPrice(event.price)}
        </Badge>
        
        {/* Interest Tags */}
        {event.eventInterests?.slice(0, 2).map((ei) => (
          <Badge 
            key={ei.interestId}
            variant="outline"
            className="absolute top-3 left-3 text-xs bg-background/90 backdrop-blur-sm"
          >
            {ei.interest.name}
          </Badge>
        ))}
      </div>

      <CardHeader className="pb-2">
        <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          <Link to={`/events/${event.id}`}>{event.title}</Link>
        </h3>
      </CardHeader>

      <CardContent className="pb-2">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {event.description}
        </p>
        
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatDate(event.startTime)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            <span>{event.location || `${event.city}, ${event.country}`}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            <span>{event.attendeeCount} attending</span>
            {event.maxAttendees && (
              <span className="text-muted-foreground">/ {event.maxAttendees}</span>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-2">
        <div className="flex items-center justify-between w-full">
          <div className="flex gap-1 flex-wrap">
            {event.eventInterests?.slice(0, 3).map((ei) => (
              <Badge 
                key={ei.interestId}
                variant="secondary"
                className="text-[10px] px-1.5 py-0.5"
              >
                {ei.interest.category}
              </Badge>
            ))}
          </div>
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 px-2 text-muted-foreground hover:text-primary"
            asChild
          >
            <Link to={`/events/${event.id}`}>
              Details
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default EventCard;