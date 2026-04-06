import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Calendar, MapPin, Users, DollarSign, Clock, Share2,
  Heart, ArrowLeft, Loader2, AlertCircle, CheckCircle,
  Facebook, Twitter, Link as LinkIcon, Mail
} from "lucide-react";

interface Event {
  id: number;
  title: string;
  description: string;
  city: string;
  country: string;
  location: string;
  startTime: string;
  endTime: string;
  price?: number;
  isFree: boolean;
  coverImage?: string;
  organizerId: number;
  organizer?: {
    id: number;
    firstName: string;
    lastName: string;
    email?: string;
  };
  isActive: boolean;
  isPublished: boolean;
  attendeeCount: number;
  viewCount: number;
  likeCount: number;
  maxAttendees?: number;
  isFull: boolean;
  eventInterests: Array<{
    interest: {
      id: number;
      name: string;
      category: string;
      icon?: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5260/api";

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  useEffect(() => {
    if (id) {
      fetchEvent(id);
    }
  }, [id]);

  const fetchEvent = async (eventId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/events/${eventId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Event not found");
        }
        throw new Error("Failed to fetch event");
      }

      const data = await response.json();
      setEvent(data);
    } catch (err: any) {
      console.error("Failed to fetch event:", err);
      setError(err.message || "Could not load event details");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    // TODO: Implement registration/ticket purchase
    setIsRegistered(true);
    alert("Registration feature coming soon!");
  };

  const handleLike = () => {
    // TODO: Implement like functionality with API call
    setIsLiked(!isLiked);
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = `Check out this event: ${event?.title}`;

    switch (platform) {
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
        break;
      case "twitter":
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, "_blank");
        break;
      case "whatsapp":
        window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`, "_blank");
        break;
      case "email":
        window.location.href = `mailto:?subject=${encodeURIComponent(event?.title)}&body=${encodeURIComponent(text + " " + url)}`;
        break;
      case "copy":
        navigator.clipboard.writeText(url);
        alert("Link copied to clipboard!");
        break;
    }
    setShowShareMenu(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-KE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-KE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price?: number) => {
    if (!price || price === 0) return "Free";
    return `KES ${price.toLocaleString()}`;
  };

  const getCapacityStatus = () => {
    if (!event?.maxAttendees) return null;
    const percentage = (event.attendeeCount / event.maxAttendees) * 100;
    if (percentage >= 90) return { text: "Almost Full", color: "text-destructive" };
    if (percentage >= 50) return { text: "Filling Fast", color: "text-orange-500" };
    return { text: "Available", color: "text-green-600" };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-16">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-muted-foreground">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-background pt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Oops!</h2>
            <p className="text-muted-foreground mb-6">{error || "Event not found"}</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate("/")}>
                Go Home
              </Button>
              <Button onClick={() => navigate("/events")}>
                Browse Events
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const capacityStatus = getCapacityStatus();

  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Hero Image */}
      <div className="relative h-64 md:h-96 w-full overflow-hidden">
        <img
          src={event.coverImage || "https://via.placeholder.com/1200x400?text=Event"}
          alt={event.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://via.placeholder.com/1200x400?text=Event";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm hover:bg-background/90"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>

        {/* Share & Like Buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLike}
            className="bg-background/80 backdrop-blur-sm hover:bg-background/90"
          >
            <Heart className={`h-5 w-5 ${isLiked ? "fill-destructive text-destructive" : "text-foreground"}`} />
          </Button>
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="bg-background/80 backdrop-blur-sm hover:bg-background/90"
            >
              <Share2 className="h-5 w-5 text-foreground" />
            </Button>
            
            {showShareMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowShareMenu(false)} />
                <div className="absolute right-0 top-10 z-50 w-48 rounded-lg border border-border bg-card shadow-lg p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare("facebook")}
                    className="w-full justify-start gap-2"
                  >
                    <Facebook className="h-4 w-4" />
                    Facebook
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare("twitter")}
                    className="w-full justify-start gap-2"
                  >
                    <Twitter className="h-4 w-4" />
                    Twitter
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare("whatsapp")}
                    className="w-full justify-start gap-2"
                  >
                    <LinkIcon className="h-4 w-4" />
                    WhatsApp
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare("email")}
                    className="w-full justify-start gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare("copy")}
                    className="w-full justify-start gap-2"
                  >
                    <LinkIcon className="h-4 w-4" />
                    Copy Link
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Header */}
            <div>
              <div className="flex flex-wrap gap-2 mb-4">
                {event.eventInterests?.map((ei) => (
                  <Badge key={ei.interest.id} variant="secondary">
                    {ei.interest.icon && <span className="mr-1">{ei.interest.icon}</span>}
                    {ei.interest.name}
                  </Badge>
                ))}
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {event.title}
              </h1>

              {/* Quick Info */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(event.startTime)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  <span>{event.location || `${event.city}, ${event.country}`}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <Card className="border-primary/20">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    onClick={handleRegister}
                    disabled={event.isFull}
                    className="flex-1 gap-2"
                  >
                    {event.isFull ? (
                      <>
                        <AlertCircle className="h-4 w-4" />
                        Event Full
                      </>
                    ) : isRegistered ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Registered
                      </>
                    ) : (
                      <>
                        <Calendar className="h-4 w-4" />
                        {event.isFree ? "Register Free" : "Get Tickets"}
                      </>
                    )}
                  </Button>
                  
                  {event.price && event.price > 0 && (
                    <div className="flex items-center justify-center sm:justify-end">
                      <div className="text-2xl font-bold text-primary">
                        {formatPrice(event.price)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Capacity Status */}
                {capacityStatus && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {event.attendeeCount} of {event.maxAttendees} spots filled
                      </span>
                      <span className={`font-medium ${capacityStatus.color}`}>
                        {capacityStatus.text}
                      </span>
                    </div>
                    <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${(event.attendeeCount / event.maxAttendees!) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Event Description */}
            <Card>
              <CardHeader>
                <CardTitle>About This Event</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground leading-relaxed whitespace-pre-line">
                  {event.description}
                </p>
              </CardContent>
            </Card>

            {/* Location Map Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video w-full bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Map integration coming soon</p>
                    <p className="text-sm">{event.location || `${event.city}, ${event.country}`}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Organizer Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Organizer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-semibold">
                      {event.organizer?.firstName?.charAt(0)}{event.organizer?.lastName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">
                      {event.organizer?.firstName} {event.organizer?.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">Event Organizer</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-4">
                  Contact Organizer
                </Button>
              </CardContent>
            </Card>

            {/* Event Details Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Date</p>
                    <p className="text-sm text-muted-foreground">{formatDate(event.startTime)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Time</p>
                    <p className="text-sm text-muted-foreground">
                      {formatTime(event.startTime)} - {formatTime(event.endTime)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Location</p>
                    <p className="text-sm text-muted-foreground">
                      {event.location || `${event.city}, ${event.country}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Price</p>
                    <p className="text-sm text-muted-foreground">{formatPrice(event.price)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Attendees</p>
                    <p className="text-sm text-muted-foreground">
                      {event.attendeeCount} {event.maxAttendees ? `/ ${event.maxAttendees}` : "going"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Share Widget */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Share Event</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleShare("facebook")}
                    className="h-10 w-10"
                  >
                    <Facebook className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleShare("twitter")}
                    className="h-10 w-10"
                  >
                    <Twitter className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleShare("whatsapp")}
                    className="h-10 w-10"
                  >
                    <LinkIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleShare("copy")}
                    className="h-10 w-10"
                  >
                    <LinkIcon className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;