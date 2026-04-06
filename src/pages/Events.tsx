import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Calendar, MapPin, Search, Filter, ArrowUpDown,
  ChevronLeft, ChevronRight, Loader2, AlertCircle,
  DollarSign, Clock, Users, TrendingUp
} from "lucide-react";
import { Event } from "@/lib/types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5260/api";

interface EventsResponse {
  items: Event[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

const Events = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [limit] = useState(12); // Events per page

  // Filters from URL params
  const page = parseInt(searchParams.get("page") || "1");
  const search = searchParams.get("search") || "";
  const sortBy = searchParams.get("sortBy") || "date_desc";
  const city = searchParams.get("city") || "";
  const country = searchParams.get("country") || "";
  const isFree = searchParams.get("isFree") || "";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";

  // Local filter state
  const [searchInput, setSearchInput] = useState(search);
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    city,
    country,
    isFree,
    startDate,
    endDate,
  });

  useEffect(() => {
    fetchEvents();
    setSearchInput(search);
    setLocalFilters({ city, country, isFree, startDate, endDate });
  }, [page, search, sortBy, city, country, isFree, startDate, endDate]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: ((page - 1) * limit).toString(),
        sortBy,
      });

      if (search) params.append("search", search);
      if (city) params.append("city", city);
      if (country) params.append("country", country);
      if (isFree) params.append("isFree", isFree);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(`${API_BASE}/events?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }

      const data = await response.json();  
      setEvents(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setError("Could not load events. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Update URL params
  const updateFilters = (newFilters: Partial<Record<string, string>>) => {
    const newParams = new URLSearchParams(searchParams);
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });

    // Reset to page 1 when filters change
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchInput.trim(), page: "1" });
  };

  const handleSortChange = (value: string) => {
    updateFilters({ sortBy: value });
  };

  const handleFilterChange = (field: string, value: string) => {
    setLocalFilters(prev => ({ ...prev, [field]: value }));
  };

  const applyFilters = () => {
    updateFilters({
      city: localFilters.city,
      country: localFilters.country,
      isFree: localFilters.isFree,
      startDate: localFilters.startDate,
      endDate: localFilters.endDate,
    });
    setShowFilters(false);
  };

  const clearFilters = () => {
    const newParams = new URLSearchParams({
      page: "1",
      limit: limit.toString(),
    });
    setSearchParams(newParams);
    setLocalFilters({ city: "", country: "", isFree: "", startDate: "", endDate: "" });
    setSearchInput("");
  };

  const handlePageChange = (newPage: number) => {
    updateFilters({ page: newPage.toString() });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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

  // Calculate pagination
  const totalPages = Math.ceil(total / limit);
  const currentPage = page;
  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, total);

  // Sort options
  const sortOptions = [
    { value: "date_asc", label: "Date: Soonest First" },
    { value: "date_desc", label: "Date: Latest First" },
    { value: "price_asc", label: "Price: Low to High" },
    { value: "price_desc", label: "Price: High to Low" },
    { value: "popularity", label: "Most Popular" },
    { value: "relevance", label: "Most Relevant" },
  ];

  if (loading && events.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-16">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-muted-foreground">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">All Events</h1>
            <p className="text-muted-foreground mt-1">
              {total > 0 ? `Showing ${startItem}-${endItem} of ${total} events` : "No events found"}
            </p>
          </div>
          <Button onClick={() => navigate("/create-event")} className="gap-2">
            Create Event
          </Button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search events by name, description, or location..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" variant="secondary">
              Search
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {(city || country || isFree || startDate || endDate) && (
                <Badge variant="default" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  { [city, country, isFree, startDate, endDate].filter(Boolean).length }
                </Badge>
              )}
            </Button>
          </form>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card className="mb-6 border-border bg-card">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="filter-city">City</Label>
                  <Input
                    id="filter-city"
                    value={localFilters.city}
                    onChange={(e) => handleFilterChange("city", e.target.value)}
                    placeholder="Nairobi"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filter-country">Country</Label>
                  <Input
                    id="filter-country"
                    value={localFilters.country}
                    onChange={(e) => handleFilterChange("country", e.target.value)}
                    placeholder="Kenya"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filter-price">Price</Label>
                  <select
                    id="filter-price"
                    value={localFilters.isFree}
                    onChange={(e) => handleFilterChange("isFree", e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="">All Prices</option>
                    <option value="true">Free Only</option>
                    <option value="false">Paid Only</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filter-start">Start Date</Label>
                  <Input
                    id="filter-start"
                    type="date"
                    value={localFilters.startDate}
                    onChange={(e) => handleFilterChange("startDate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filter-end">End Date</Label>
                  <Input
                    id="filter-end"
                    type="date"
                    value={localFilters.endDate}
                    onChange={(e) => handleFilterChange("endDate", e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t">
                <Button onClick={applyFilters} className="gap-2">
                  Apply Filters
                </Button>
                <Button variant="outline" onClick={clearFilters}>
                  Clear All
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sort & Results Info */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="sort" className="text-sm text-muted-foreground">Sort by:</Label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="h-9 px-3 rounded-md border border-input bg-background text-sm"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-destructive/50">
            <CardContent className="py-8 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">Oops!</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchEvents}>Try Again</Button>
            </CardContent>
          </Card>
        )}

        {/* Events Grid */}
        {!loading && events.length === 0 && !error && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">No events found</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Try adjusting your search or filters to find what you're looking for.
              </p>
              <Button variant="outline" onClick={clearFilters}>Clear All Filters</Button>
            </CardContent>
          </Card>
        )}

        {!loading && events.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <Card key={event.id} className="group overflow-hidden border-border bg-card hover:border-primary/50 transition-all hover:shadow-lg">
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
                    
                    {/* Badges */}
                    <div className="absolute top-3 right-3 flex gap-2">
                      <Badge variant={event.isFree ? "secondary" : "default"}>
                        {formatPrice(event.price)}
                      </Badge>
                    </div>
                  </div>

                  <CardHeader className="pb-2">
                    <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {event.title}
                    </h3>
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

                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => navigate(`/events/${event.id}`)}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                    // Show first, last, current, and adjacent pages
                    const shouldShow =
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1);

                    if (!shouldShow) {
                      // Show ellipsis for skipped pages
                      const prevShown = Array.from({ length: totalPages }, (_, i) => i + 1)
                        .slice(0, pageNum - 1)
                        .some(n => n === 1 || n === totalPages || (n >= currentPage - 1 && n <= currentPage + 1));
                      if (prevShown) return null;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="w-10 h-10 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Results Summary */}
            <div className="text-center text-sm text-muted-foreground mt-6">
              Page {currentPage} of {totalPages} • {total} total events
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Events;