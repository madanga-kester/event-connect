import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, MapPin, Users, Edit2, Trash2, PlusCircle, 
  Loader2, AlertCircle, Eye, ArrowLeft 
} from "lucide-react";
import { Event } from "@/lib/types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5260/api";

const MyEvents = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const fetchMyEvents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token");
      
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(`${API_BASE}/events/my-events`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.status === 401) {
        localStorage.removeItem("auth_token");
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }

      const data = await response.json();
      setEvents(data.items || data || []);
    } catch (err) {
      console.error("Failed to fetch my events:", err);
      setError("Could not load your events. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (eventId: number, eventTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${eventTitle}"?`)) return;

    try {
      setDeletingId(eventId);
      const token = localStorage.getItem("auth_token");

      const response = await fetch(`${API_BASE}/events/${eventId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error("Failed to delete event");
      }

      // Remove from local state
      setEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete event. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-KE", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatPrice = (price?: number) => {
    if (!price || price === 0) return "Free";
    return `KES ${price.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-16">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-muted-foreground">Loading your events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background pt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Oops!</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate("/")}>
                Go Home
              </Button>
              <Button onClick={fetchMyEvents}>Try Again</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-2 -ml-2">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-foreground">My Events</h1>
            <p className="text-muted-foreground mt-1">
              Manage events you've created • {events.length} total
            </p>
          </div>
          <Button onClick={() => navigate("/create-event")} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Create New Event
          </Button>
        </div>

        {/* Empty State */}
        {events.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">No events yet</h3>
              <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
                You haven't created any events yet. Start by creating your first event and share it with the community!
              </p>
              <Button onClick={() => navigate("/create-event")} className="gap-2">
                <PlusCircle className="h-4 w-4" />
                Create Your First Event
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Events Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Card key={event.id} className="group overflow-hidden border-border bg-card hover:border-primary/50 transition-all">
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
                  
                  {/* Status Badge */}
                  <Badge 
                    variant={event.isPublished ? "default" : "secondary"}
                    className="absolute top-3 right-3"
                  >
                    {event.isPublished ? "Published" : "Draft"}
                  </Badge>
                </div>

                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {event.title}
                    </h3>
                  </div>
                </CardHeader>

                <CardContent className="pb-4">
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {event.description}
                  </p>
                  
                  <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatDate(event.startTime)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="truncate">{event.location || `${event.city}, ${event.country}`}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      <span>{event.attendeeCount || 0} attending</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 px-2 text-muted-foreground hover:text-primary"
                        onClick={() => navigate(`/events/${event.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 px-2 text-muted-foreground hover:text-primary"
                        onClick={() => navigate(`/create-event?edit=${event.id}`)}
                      >
                        <Edit2 className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(event.id, event.title)}
                      disabled={deletingId === event.id}
                    >
                      {deletingId === event.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyEvents;