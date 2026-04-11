import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { UserProfile, AuthResponse } from "@/lib/types";

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  logout: () => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5260/api";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("user");  
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user:", e);
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      const data: AuthResponse = await response.json();
      
      if (data.isSuccess && data.token && data.user) {
        
        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));  
        setToken(data.token);
        setUser(data.user);
      }
      
      return data;
    } catch (error) {
      console.error("Login failed:", error);
      return { isSuccess: false, message: "Network error. Please try again." };
    }
  };

  const logout = () => {
    
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user"); 
    setToken(null);
    setUser(null);
  };

  const updateUser = (updates: Partial<UserProfile>) => {
    if (user) {
      const updated = { ...user, ...updates };
      setUser(updated);
      localStorage.setItem("user", JSON.stringify(updated));  
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!token,
      login,
      logout,
      updateUser,
      loading,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};