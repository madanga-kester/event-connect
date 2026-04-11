// @/lib/logout.ts
import { NavigateFunction } from "react-router-dom";

/**
 * Complete logout handler - clears all auth data and resets app state
 * @param navigate - React Router navigate function (optional, for programmatic redirect)
 * @param redirectTo - Path to redirect after logout (default: "/")
 */
export const handleLogout = (navigate?: NavigateFunction, redirectTo: string = "/") => {
 
  localStorage.removeItem("auth_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
  
 
  sessionStorage.removeItem("redirectAfterLogin");
  sessionStorage.removeItem("pending_action");
  

  if (typeof window !== "undefined" && (window as any).queryClient) {
    try {
      (window as any).queryClient.removeQueries({ 
        predicate: (query) => 
          query.queryKey.includes("auth") || 
          query.queryKey.includes("profile") ||
          query.queryKey.includes("user")
      });
    } catch (e) {
      console.warn("QueryClient cleanup skipped:", e);
    }
  }
  

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("auth:logout", { detail: { timestamp: Date.now() } }));
  }
  

  if (navigate && typeof navigate === "function") {
    
    try {
      navigate(redirectTo, { replace: true });
    } catch (e) {
      console.warn("React Router navigate failed, falling back to window.location", e);
      window.location.href = redirectTo;
    }
  } else {

    window.location.href = redirectTo;
  }
  
 
  
 
  console.log("✅ User logged out successfully at", new Date().toISOString());
};


export const silentLogout = () => {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
  sessionStorage.removeItem("redirectAfterLogin");
  
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("auth:logout", { detail: { silent: true } }));
  }
  
  console.log("🔇 Silent logout completed");
};


export const isAuthenticated = (): boolean => {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("auth_token");
};

/**
 * Get current user data (parsed, safe)
 */
export const getCurrentUser = (): {
  id?: number;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
} | null => {
  if (typeof window === "undefined") return null;
  
  try {
    const userData = localStorage.getItem("user");
    if (!userData) return null;
    
    const parsed = JSON.parse(userData);
    return {
      id: parsed.id,
      email: parsed.email,
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      role: parsed.role
    };
  } catch (e) {
    console.warn("Failed to parse user data:", e);
    return null;
  }
};