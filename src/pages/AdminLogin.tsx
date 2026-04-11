import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, AlertCircle, Check, Loader2, Shield } from "lucide-react";

const ADMIN_API_BASE = "/api/admin/auth";

interface AdminAuthResponse {
  isSuccess: boolean;
  message: string;
  token?: string;
  refreshToken?: string;
  user?: { id: number; email: string; firstName: string; lastName: string; phoneNumber?: string; role: string };
  errors?: Record<string, string[]>;
}

type AdminAuthMode = "password" | "otp-request" | "otp-verify";

const AdminLogin = () => {
  const [authMode, setAuthMode] = useState<AdminAuthMode>("password");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    setError(null);
  };

  const resetForm = () => {
    setFormData({ email: "", password: "" });
    setOtpCode("");
    setError(null);
    setSuccessMessage(null);
  };

  const handlePasswordLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${ADMIN_API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Email: formData.email.trim().toLowerCase(), Password: formData.password }),
      });
      const result: AdminAuthResponse = await response.json();
      if (!response.ok || !result.isSuccess) {
        if (result.errors) throw new Error(Object.entries(result.errors).map(([f, m]) => `${f}: ${m.join(", ")}`).join("; "));
        throw new Error(result.message || "Admin login failed");
      }
      if (result.token) localStorage.setItem("admin_auth_token", result.token);
      if (result.refreshToken) localStorage.setItem("admin_refresh_token", result.refreshToken);
      if (result.user) localStorage.setItem("admin_user", JSON.stringify(result.user));
      setSuccessMessage("Admin login successful! Redirecting...");
      setTimeout(() => navigate("/admin"), 1000);
    } catch (err: any) {
      setError(err.message || "Admin login failed");
      console.error("Admin login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpRequest = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${ADMIN_API_BASE}/otp-login-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Email: formData.email.trim().toLowerCase() }),
      });
      const result: AdminAuthResponse = await response.json();
      if (!response.ok || !result.isSuccess) {
        if (result.errors) throw new Error(Object.entries(result.errors).map(([f, m]) => `${f}: ${m.join(", ")}`).join("; "));
        throw new Error(result.message || "Failed to send admin OTP");
      }
      setSuccessMessage("Admin OTP sent to email. Check Mailtrap.");
      setAuthMode("otp-verify");
    } catch (err: any) {
      setError(err.message || "Failed to send admin OTP");
      console.error("Admin OTP request error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerify = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${ADMIN_API_BASE}/otp-login-verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ OTP: formData.email.trim().toLowerCase(), Code: otpCode, Purpose: "AdminLogin" }),
      });
      const contentType = response.headers.get("content-type");
      let result: AdminAuthResponse;
      if (contentType?.includes("application/json")) {
        result = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server error: ${response.status} - ${text.substring(0, 300)}`);
      }
      if (!response.ok || !result.isSuccess) {
        if (result.errors) throw new Error(Object.entries(result.errors).map(([f, m]) => `${f}: ${m.join(", ")}`).join("; "));
        throw new Error(result.message || `Verification failed (status: ${response.status})`);
      }
      if (result.token) localStorage.setItem("admin_auth_token", result.token);
      if (result.refreshToken) localStorage.setItem("admin_refresh_token", result.refreshToken);
      if (result.user) localStorage.setItem("admin_user", JSON.stringify(result.user));
      setSuccessMessage("Admin verification successful! Redirecting...");
      setTimeout(() => navigate("/admin"), 1000);
    } catch (err: any) {
      setError(err.message || "Admin OTP verification failed");
      console.error("Admin OTP verify error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === "password") await handlePasswordLogin();
    else if (authMode === "otp-request") await handleOtpRequest();
    else if (authMode === "otp-verify") {
      if (otpCode.length !== 6) { setError("Please enter the 6-digit OTP code"); return; }
      await handleOtpVerify();
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-gradient font-display text-3xl font-bold tracking-tight mb-2">Admin Portal</h1>
          <p className="text-muted-foreground">
            {authMode === "password" && "Admin sign in"}
            {authMode === "otp-request" && "Request admin OTP"}
            {authMode === "otp-verify" && "Enter admin verification code"}
          </p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6">
          {error && <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center gap-2 text-destructive text-sm"><AlertCircle className="h-4 w-4 flex-shrink-0" /><span>{error}</span></div>}
          {successMessage && <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2 text-green-600 text-sm"><Check className="h-4 w-4 flex-shrink-0" /><span>{successMessage}</span></div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <Input id="email" name="email" type="email" placeholder="admin@linkup254.com" value={formData.email} onChange={handleChange} required disabled={authMode === "otp-verify"} />
            </div>
            {authMode === "password" && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={formData.password} onChange={handleChange} required className="pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}
            {authMode === "otp-verify" && (
              <div className="space-y-2">
                <Label htmlFor="otpCode">Enter 6-digit code</Label>
                <Input id="otpCode" name="otpCode" type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6} placeholder="000000" value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))} className="text-center text-2xl tracking-[0.5em] font-mono" required autoFocus />
                <p className="text-xs text-muted-foreground text-center">Sent to {formData.email} • Expires in 5 min</p>
                <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-xs text-blue-600">
                  <p className="font-medium">📧 Checking for admin OTP?</p>
                  <a href="https://mailtrap.io/inboxes" target="_blank" rel="noopener" className="underline hover:text-blue-700">Open Mailtrap Inbox</a>
                  <p className="mt-1 text-muted-foreground">Username: <code className="bg-muted px-1 rounded">f60d0ccb568ff7</code></p>
                </div>
              </div>
            )}
            <Button type="submit" className="w-full bg-gradient-warm text-primary-foreground font-display font-semibold hover:opacity-90 disabled:opacity-50" disabled={isLoading}>
              {isLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{authMode === "password" && "Signing In..."}{authMode === "otp-request" && "Sending OTP..."}{authMode === "otp-verify" && "Verifying..."}</> : authMode === "password" ? "Admin Sign In" : authMode === "otp-request" ? "Send OTP Code" : "Verify Code"}
            </Button>
          </form>
          <div className="mt-6 space-y-3">
            {authMode === "password" && (<>
              <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or</span></div></div>
              <Button type="button" variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" onClick={() => { setAuthMode("otp-request"); resetForm(); }}>Login with OTP code instead</Button>
            </>)}
            <div className="text-center text-sm text-muted-foreground">
              {authMode === "password" ? <><button onClick={() => navigate("/login")} className="text-primary hover:underline font-medium">← Back to User Login</button></> :
               authMode === "otp-request" ? <><button onClick={() => { setAuthMode("password"); resetForm(); }} className="text-primary hover:underline font-medium">← Back to Password Login</button></> :
               <><button onClick={() => { setAuthMode("password"); resetForm(); }} className="text-primary hover:underline font-medium">← Back to Login</button></>}
            </div>
          </div>
        </div>
        <div className="mt-6 text-center text-xs text-muted-foreground"><p> Admin access is restricted and logged.</p><p>Use only authorized credentials.</p></div>
      </div>
    </div>
  );
};

export default AdminLogin;