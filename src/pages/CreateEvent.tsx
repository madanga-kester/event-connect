import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import CreateEventForm from "@/components/CreateEventForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const CreateEvent = () => {
  const { isAuthenticated, loading } = useAuth();

  // Show loading while auth state is being determined
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: "/create-event" }} replace />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/events">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Events
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Create New Event</h1>
      </div>

      {/* Form */}
      <CreateEventForm onSuccess={() => {
        // Optional: Show success toast here
      }} />
    </div>
  );
};

export default CreateEvent;