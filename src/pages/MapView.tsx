import Navbar from "@/components/Navbar";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";

const events = [
  { title: "Rooftop Sunset Social", lat: 40.7484, lng: -73.9857, date: "Apr 5", category: "Nightlife" },
  { title: "Contemporary Art Opening", lat: 40.7465, lng: -74.0014, date: "Apr 8", category: "Art" },
  { title: "Street Food Festival", lat: 40.7081, lng: -73.9571, date: "Apr 12", category: "Food" },
  { title: "Morning Yoga in the Park", lat: 40.7829, lng: -73.9654, date: "Apr 15", category: "Wellness" },
  { title: "Startup Demo Night", lat: 40.7233, lng: -73.9985, date: "Apr 18", category: "Tech" },
  { title: "Live Jazz at Blue Note", lat: 40.7308, lng: -74.0005, date: "Apr 20", category: "Music" },
];

const customIcon = new Icon({
  iconUrl: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const MapView = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16 h-screen flex flex-col">
        <div className="px-4 py-4">
          <h1 className="font-display text-2xl font-bold text-foreground">Event Map</h1>
          <p className="text-muted-foreground text-sm">Discover events near you</p>
        </div>
        <div className="flex-1 relative">
          <MapContainer
            center={[40.7484, -73.9857]}
            zoom={12}
            className="h-full w-full z-0"
            style={{ minHeight: "500px" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {events.map((event) => (
              <Marker key={event.title} position={[event.lat, event.lng]} icon={customIcon}>
                <Popup>
                  <div className="font-sans">
                    <strong className="text-sm">{event.title}</strong>
                    <br />
                    <span className="text-xs text-gray-600">{event.date} · {event.category}</span>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </main>
    </div>
  );
};

export default MapView;
