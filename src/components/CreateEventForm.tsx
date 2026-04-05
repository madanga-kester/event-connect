import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MapPin, Calendar, DollarSign, Image as ImageIcon } from "lucide-react";

interface CreateEventFormProps {
  onSuccess?: () => void;
}

const CreateEventForm = ({ onSuccess }: CreateEventFormProps) => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    city: user?.city || "",
    country: user?.country || "",
    location: "",
    startDate: "",
    endDate: "",
    price: "",
    imageUrl: "",
    interestIds: [] as number[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      navigate("/login", { state: { from: "/create-event" } });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Format dates to ISO 8601
      const startDate = new Date(formData.startDate).toISOString();
      const endDate = formData.endDate ? new Date(formData.endDate).toISOString() : undefined;

      const response = await fetch("http://localhost:5260/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          city: formData.city,
          country: formData.country,
          location: formData.location,
          startDate,
          endDate,
          price: formData.price ? parseFloat(formData.price) : undefined,
          imageUrl: formData.imageUrl || undefined,
          interestIds: formData.interestIds.length > 0 ? formData.interestIds : undefined,
        }),
      });

      const result = await response.json();

      if (result.isSuccess) {
        // Reset form
        setFormData({
          title: "", description: "", city: "", country: "", location: "",
          startDate: "", endDate: "", price: "", imageUrl: "", interestIds: [],
        });
        onSuccess?.();
        navigate("/events"); // Redirect to events page
      } else {
        setError(result.message || "Failed to create event");
      }
    } catch (err) {
      setError("Network error. Please check your connection.");
      console.error("Create event failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | number | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Simple interest selector (replace with full InterestSelector component later)
  const availableInterests = [
    { id: 1, name: "Live Music", category: "Music" },
    { id: 9, name: "Startup Meetups", category: "Tech" },
    { id: 5, name: "Street Food", category: "Food & Drink" },
    { id: 17, name: "Yoga", category: "Wellness" },
    { id: 13, name: "Contemporary Art", category: "Art" },
  ];

  const toggleInterest = (id: number) => {
    handleChange("interestIds", 
      formData.interestIds.includes(id)
        ? formData.interestIds.filter(i => i !== id)
        : [...formData.interestIds, id]
    );
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Create New Event</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="e.g., Nairobi Tech Meetup"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Describe your event..."
              rows={4}
              required
            />
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city" className="flex items-center gap-1">
                <MapPin className="h-4 w-4" /> City
              </Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange("city", e.target.value)}
                placeholder="Nairobi"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => handleChange("country", e.target.value)}
                placeholder="Kenya"
              />
            </div>
            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="location">Venue/Location *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
                placeholder="e.g., iHub, Kilimani"
                required
              />
            </div>
          </div>

          {/* Date/Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="flex items-center gap-1">
                <Calendar className="h-4 w-4" /> Start Date & Time *
              </Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => handleChange("startDate", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date & Time</Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => handleChange("endDate", e.target.value)}
              />
            </div>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price" className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" /> Price (KES) - Leave blank for free
            </Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) => handleChange("price", e.target.value)}
              placeholder="0 for free events"
            />
          </div>

          {/* Cover Image */}
          <div className="space-y-2">
            <Label htmlFor="imageUrl" className="flex items-center gap-1">
              <ImageIcon className="h-4 w-4" /> Cover Image URL
            </Label>
            <Input
              id="imageUrl"
              type="url"
              value={formData.imageUrl}
              onChange={(e) => handleChange("imageUrl", e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
            <p className="text-xs text-muted-foreground">
              Use a public URL. Tip: Upload to Imgur or use Unsplash.
            </p>
          </div>

          {/* Interests */}
          <div className="space-y-2">
            <Label>Categories (Optional)</Label>
            <div className="flex flex-wrap gap-2">
              {availableInterests.map((interest) => (
                <Button
                  key={interest.id}
                  type="button"
                  variant={formData.interestIds.includes(interest.id) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleInterest(interest.id)}
                  className="text-xs"
                >
                  {interest.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full"
            disabled={loading || !token}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Event...
              </>
            ) : !token ? (
              "Login to Create Event"
            ) : (
              "Create Event"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateEventForm;