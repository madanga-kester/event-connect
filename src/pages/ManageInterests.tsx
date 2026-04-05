import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import InterestSelector from "@/components/InterestSelector";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const InterestsPage = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: "/interests" }} replace />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/profile">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Profile
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Manage Your Interests</h1>
      </div>

      {/* Interest Selector */}
      <InterestSelector 
        onComplete={() => {
          // Optional: Show toast or redirect
        }}
      />
      
      {/* Helper Text */}
      <div className="mt-8 text-center text-sm text-muted-foreground max-w-md mx-auto">
        <p>
          💡 <strong>Tip:</strong> The more interests you select, the better your personalized event recommendations will be.
        </p>
        <p className="mt-2">
          Your selections help us show you events for <strong>Live Music</strong>, <strong>Tech Meetups</strong>, <strong>Food Festivals</strong>, and more.
        </p>
      </div>
    </div>
  );
};

export default InterestsPage;