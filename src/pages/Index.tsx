import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import EventsGrid from "@/components/EventsGrid";
import GroupsPreview from "@/components/GroupsPreview";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <EventsGrid />
      <GroupsPreview />
      <Footer />
    </div>
  );
};

export default Index;
