import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EventCard from "@/components/EventCard";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { Event, EventFilters, PagedResult } from "@/lib/types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5260/api";

const PersonalizedFeed = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<EventFilters>({
    limit: 12,
    offset: 0,
    sortBy: "relevance",
  });
  const [pagination, setPagination] = useState({ hasMore: true });

  const fetchEvents = async (isLoadMore = false) => {
    const token = localStorage.getItem("auth_token");
    
    // If not logged in, redirect to login or show fallback
    if (!token) {
      navigate("/login", { state: { from: "/profile" } });
      return;
    }

    const params = new URLSearchParams();
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.offset) params.append("offset", filters.offset.toString());
    if (filters.sortBy) params.append("sortBy", filters.sortBy);
    if (filters.city) params.append("city", filters.city);
    if (filters.country) params.append("country", filters.country);
    if (filters.interestIds?.length) {
      params.append("interestIds", filters.interestIds.join(","));
    }

    try {
      if (!isLoadMore) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      const response = await fetch(
        `${API_BASE}/events/personalized?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("auth_token");
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.status}`);
      }

      const data: PagedResult<Event> = await response.json();
      
      if (isLoadMore) {
        setEvents((prev) => [...prev, ...data.items]);
      } else {
        setEvents(data.items);
      }
      
      setPagination({ hasMore: data.hasMore });
    } catch (err) {
      console.error("Failed to fetch personalized events:", err);
      setError("Could not load personalized events. Please try again.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleRefresh = () => {
    setFilters((prev) => ({ ...prev, offset: 0 }));
    fetchEvents();
  };

  const handleLoadMore = () => {
    if (pagination.hasMore && !loadingMore) {
      setFilters((prev) => ({
        ...prev,
        offset: (prev.offset || 0) + (prev.limit || 12),
      }));
      fetchEvents(true);
    }
  };

  if (loading) {
    return (
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading your events...</span>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center py-12">
            <AlertCircle className="h-8 w-8 text-destructive mr-3" />
            <div>
              <p className="font-medium text-foreground">{error}</p>
              <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-2">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">For You</h2>
            <p className="text-muted-foreground text-sm">
              Events matched to your interests and location
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRefresh}
            disabled={loading}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Events Grid */}
        {events.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>

            {/* Load More */}
            {pagination.hasMore && (
              <div className="flex justify-center mt-8">
                <Button 
                  variant="outline" 
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="gap-2"
                >
                  {loadingMore ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Load More Events"
                  )}
                </Button>
              </div>
            )}
          </>
        ) : (
          /* Empty State */
          <div className="text-center py-12 border border-dashed rounded-xl">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground mb-1">No events found</h3>
            <p className="text-muted-foreground text-sm mb-4 max-w-md mx-auto">
              We couldn't find events matching your interests. Try updating your interests or explore trending events below.
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={() => navigate("/interests")}>
                Update Interests
              </Button>
              <Button size="sm" onClick={() => navigate("/#trending")}>
                View Trending
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default PersonalizedFeed;