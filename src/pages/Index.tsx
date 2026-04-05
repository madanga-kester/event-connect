import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import EventsGrid from "@/components/EventsGrid";
import GroupsPreview from "@/components/GroupsPreview";
import Footer from "@/components/Footer";
import ProfileNudge from "@/components/ProfileNudge";
import PersonalizedFeed from "@/components/PersonalizedFeed";


const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <ProfileNudge />
      <HeroSection />
      <PersonalizedFeed />
            <EventsGrid 
        title="Trending Events" 
        subtitle="Popular events near you"
        endpoint="trending"
      />
      <GroupsPreview />
      <Footer />
    </div>
  );
};

export default Index;
