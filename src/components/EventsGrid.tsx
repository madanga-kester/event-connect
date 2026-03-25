import EventCard from "./EventCard";
import event1 from "@/assets/event-1.jpg";
import event2 from "@/assets/event-2.jpg";
import event3 from "@/assets/event-3.jpg";
import event4 from "@/assets/event-4.jpg";
import event5 from "@/assets/event-5.jpg";
import event6 from "@/assets/event-6.jpg";

const events = [
  { title: "Rooftop Sunset Social", image: event1, date: "Apr 5, 2026 · 7:00 PM", location: "Manhattan, NYC", group: "NYC Foodies", attendees: 142, comments: 23, category: "Nightlife" },
  { title: "Contemporary Art Opening", image: event2, date: "Apr 8, 2026 · 6:30 PM", location: "Chelsea, NYC", group: "Art Lovers", attendees: 89, comments: 12, category: "Art" },
  { title: "Street Food Festival", image: event3, date: "Apr 12, 2026 · 11:00 AM", location: "Williamsburg, Brooklyn", group: "NYC Foodies", attendees: 320, comments: 45, category: "Food" },
  { title: "Morning Yoga in the Park", image: event4, date: "Apr 15, 2026 · 7:00 AM", location: "Central Park, NYC", group: "Wellness NYC", attendees: 67, comments: 8, category: "Wellness" },
  { title: "Startup Demo Night", image: event5, date: "Apr 18, 2026 · 6:00 PM", location: "SoHo, NYC", group: "SF Startups", attendees: 210, comments: 34, category: "Tech" },
  { title: "Live Jazz at Blue Note", image: event6, date: "Apr 20, 2026 · 9:00 PM", location: "Greenwich Village, NYC", group: "Jazz Heads", attendees: 55, comments: 19, category: "Music" },
];

const EventsGrid = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h2 className="font-display text-3xl font-bold text-foreground">Trending Events</h2>
          <p className="text-muted-foreground mt-1">What's happening around you</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard key={event.title} {...event} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default EventsGrid;
