import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, AlertCircle, Check, X, Mail, Smartphone, Loader2, KeyRound } from "lucide-react";

const API_BASE = "/api";

interface AuthResponse {
  isSuccess: boolean;
  message: string;
  token?: string;
  refreshToken?: string;
  user?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    role?: string;
  };
  requiresOtpVerification?: boolean;
  errors?: Record<string, string[]>;
}

type AuthMode = "login" | "signup" | "otp-login" | "verify-otp" | "forgot-password";
type OtpPurpose = "Signup" | "Login" | "PasswordReset";
type OtpDeliveryMethod = "Email" | "Phone";

const Login = () => {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [lastSentOtp, setLastSentOtp] = useState<string | null>(null);
  const [otpPurpose, setOtpPurpose] = useState<OtpPurpose>("Signup");
  const [otpIdentifier, setOtpIdentifier] = useState<string>("");
  const [signupEmail, setSignupEmail] = useState<string>("");
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    newPassword: "",
    otpCode: "",
    otpDeliveryMethod: "Email" as OtpDeliveryMethod,
  });

  const getPasswordFeedback = (password: string) => [
    { label: "8+ characters", passed: password.length >= 8 },
    { label: "Uppercase letter", passed: /[A-Z]/.test(password) },
    { label: "Lowercase letter", passed: /[a-z]/.test(password) },
    { label: "Number", passed: /\d/.test(password) },
    { label: "Special character (@$!%*?&)", passed: /[@$!%*?&]/.test(password) },
  ];

  const passwordChecks = getPasswordFeedback(formData.password);
  const newPasswordChecks = getPasswordFeedback(formData.newPassword);
  const isPasswordValid = passwordChecks.every(c => c.passed);
  const isNewPasswordValid = newPasswordChecks.every(c => c.passed);
  const isPhoneValid = /^\+2547\d{8}$/.test(formData.phone);
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    setError(null);
    setSuccessMessage(null);
  };

  const resetForm = () => {
    setFormData({
      firstName: "", lastName: "", email: "", phone: "",
      password: "", newPassword: "", otpCode: "",
      otpDeliveryMethod: "Email",
    });
    setError(null);
    setSuccessMessage(null);
    setLastSentOtp(null);
    setOtpIdentifier("");
    setShowPassword(false);
  };

  const handleModeChange = (mode: AuthMode) => {
    setAuthMode(mode);
    resetForm();
  };

  // ✅Helper: Check interests and redirect AFTER sign in
  const checkAndRedirect = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE}/interest/has-interests`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (response.ok) {
        const result = await response.json();
        navigate(result.hasInterests ? "/" : "/interests");
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error("Interest check failed:", err);
      navigate("/");
    }
  };

  //  API CALLS 

  const handleSignup = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const contactValue = formData.otpDeliveryMethod === "Phone" ? formData.phone : formData.email;
      if (!contactValue) throw new Error(`Please enter your ${formData.otpDeliveryMethod.toLowerCase()}`);

      const response = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          FirstName: formData.firstName.trim(),
          LastName: formData.lastName.trim(),
          Email: formData.email.trim().toLowerCase(),
          Phone: formData.phone.trim(),
          Password: formData.password,
          OtpDeliveryMethod: formData.otpDeliveryMethod,
        }),
      });

      const result: AuthResponse = await response.json();

      if (!response.ok || !result.isSuccess) {
        if (result.errors) {
          const errorMessages = Object.entries(result.errors)
            .map(([field, msgs]) => `${field}: ${msgs.join(", ")}`)
            .join("; ");
          throw new Error(errorMessages);
        }
        throw new Error(result.message || "Signup failed");
      }

      setOtpIdentifier(contactValue);
      setOtpPurpose("Signup");
      setSuccessMessage(`Verification code sent to ${contactValue}`);
      setAuthMode("verify-otp");
      
    } catch (err: any) {
      setError(err.message || "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Email: formData.email.trim().toLowerCase(),
          Password: formData.password,
        }),
      });

      const result: AuthResponse = await response.json();

      if (!response.ok || !result.isSuccess) {
        if (result.errors) {
          const errorMessages = Object.entries(result.errors)
            .map(([field, msgs]) => `${field}: ${msgs.join(", ")}`)
            .join("; ");
          throw new Error(errorMessages);
        }
        throw new Error(result.message || "Login failed");
      }

      if (result.token) localStorage.setItem("auth_token", result.token);
      if (result.refreshToken) localStorage.setItem("refresh_token", result.refreshToken);
      if (result.user) localStorage.setItem("user", JSON.stringify(result.user));

      await checkAndRedirect(result.token!);
      
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpLoginRequest = async () => {
    setIsLoading(true);
    setError(null);

    try {
      //  For Phone: User must enter email + phone (to verify they match)
      //  For Email: User only enters email
      if (formData.otpDeliveryMethod === "Phone") {
        if (!formData.email || !formData.phone) {
          throw new Error("Please enter both email and phone number");
        }
        if (!isEmailValid) throw new Error("Please enter a valid email");
        if (!isPhoneValid) throw new Error("Phone must be +2547XXXXXXXX");
      } else {
        if (!formData.email) throw new Error("Please enter your email");
        if (!isEmailValid) throw new Error("Please enter a valid email");
      }

      const response = await fetch(`${API_BASE}/auth/otp-login-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Email: formData.email.trim().toLowerCase(),
          Phone: formData.otpDeliveryMethod === "Phone" ? formData.phone.trim() : null,
          OtpDeliveryMethod: formData.otpDeliveryMethod,
        }),
      });

      const result: AuthResponse = await response.json();

      if (!response.ok || !result.isSuccess) {
        if (result.errors) {
          const errorMessages = Object.entries(result.errors)
            .map(([field, msgs]) => `${field}: ${msgs.join(", ")}`)
            .join("; ");
          throw new Error(errorMessages);
        }
        throw new Error(result.message || "Failed to send OTP");
      }

      const identifier = formData.otpDeliveryMethod === "Phone" ? formData.phone : formData.email;
      setOtpIdentifier(identifier);
      setOtpPurpose("Login");
      setSuccessMessage(`Code sent to your ${formData.otpDeliveryMethod.toLowerCase()}`);
      setAuthMode("verify-otp");
      
    } catch (err: any) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordRequest = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!formData.email) throw new Error("Please enter your email address");

      const response = await fetch(`${API_BASE}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ OTP: formData.email.trim().toLowerCase() }),
      });

      const result: AuthResponse = await response.json();

      if (!response.ok || !result.isSuccess) {
        if (result.errors) {
          const errorMessages = Object.entries(result.errors)
            .map(([field, msgs]) => `${field}: ${msgs.join(", ")}`)
            .join("; ");
          throw new Error(errorMessages);
        }
        throw new Error(result.message || "Failed to send reset code");
      }

      setOtpIdentifier(formData.email.trim().toLowerCase());
      setOtpPurpose("PasswordReset");
      setSuccessMessage("Reset code sent to your email");
      setAuthMode("verify-otp");
      
    } catch (err: any) {
      setError(err.message || "Failed to send reset code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!otpIdentifier) throw new Error("Missing contact information");

      let endpoint: string;
      let requestBody: any;

      if (otpPurpose === "Signup") {
        endpoint = "/auth/activate-account";
        requestBody = { OTP: otpIdentifier, Code: formData.otpCode, Purpose: "Signup" };
      } else if (otpPurpose === "Login") {
        endpoint = "/auth/otp-login-verify";
        requestBody = { Email: formData.email || otpIdentifier, Code: formData.otpCode };
      } else if (otpPurpose === "PasswordReset") {
        endpoint = "/auth/verify-password";
        requestBody = { OTP: formData.otpCode, Password: formData.newPassword };
      } else {
        throw new Error("Unknown OTP purpose");
      }

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const contentType = response.headers.get("content-type");
      let result: AuthResponse;

      if (contentType?.includes("application/json")) {
        result = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server error: ${response.status} - ${text.substring(0, 300)}`);
      }

      if (!response.ok || !result.isSuccess) {
        if (result.errors) {
          const errorMessages = Object.entries(result.errors)
            .map(([field, msgs]) => `${field}: ${msgs.join(", ")}`)
            .join("; ");
          throw new Error(errorMessages);
        }
        throw new Error(result.message || "Verification failed");
      }

      if (otpPurpose === "PasswordReset") {
        setSuccessMessage("Password reset successful! Please sign in.");
        setTimeout(() => {
          setAuthMode("login");
          resetForm();
        }, 2000);
      } 
      else if (otpPurpose === "Signup") {
        setSignupEmail(otpIdentifier);
        setSuccessMessage("Account activated! Please sign in to continue.");
        setAuthMode("login");
        setFormData(prev => ({ ...prev, email: otpIdentifier }));
      } 
      else if (otpPurpose === "Login") {
        if (result.token) localStorage.setItem("auth_token", result.token);
        if (result.refreshToken) localStorage.setItem("refresh_token", result.refreshToken);
        if (result.user) localStorage.setItem("user", JSON.stringify(result.user));
        setSuccessMessage("Verification successful! Redirecting...");
        await checkAndRedirect(result.token!);
      }
      
    } catch (err: any) {
      setError(err.message || "OTP verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevShowOtp = () => {
    const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setLastSentOtp(mockOtp);
    setFormData(prev => ({ ...prev, otpCode: mockOtp }));
    setSuccessMessage(`[DEV] OTP auto-filled: ${mockOtp}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (authMode === "signup") {
      if (!isPasswordValid) return setError("Password does not meet requirements");
      if (formData.otpDeliveryMethod === "Phone" && !isPhoneValid) return setError("Phone must be +2547XXXXXXXX");
      if (formData.otpDeliveryMethod === "Email" && !isEmailValid) return setError("Please enter a valid email");
      await handleSignup();
    } else if (authMode === "login") {
      await handlePasswordLogin();
    } else if (authMode === "otp-login") {
      await handleOtpLoginRequest();
    } else if (authMode === "forgot-password") {
      await handleForgotPasswordRequest();
    } else if (authMode === "verify-otp") {
      if (formData.otpCode.length !== 6 || !/^\d{6}$/.test(formData.otpCode)) return setError("Please enter a valid 6-digit code");
      if (otpPurpose === "PasswordReset" && !isNewPasswordValid) return setError("New password does not meet requirements");
      await handleVerifyOtp();
    }
  };

  // RENDER 

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-gradient font-display text-4xl font-bold tracking-tight mb-2">LinkUp254</h1>
          <p className="text-muted-foreground text-lg">
            {authMode === "login" && "Welcome back"}
            {authMode === "signup" && "Create your account"}
            {authMode === "otp-login" && "Sign in with code"}
            {authMode === "forgot-password" && "Reset your password"}
            {authMode === "verify-otp" && "Enter verification code"}
          </p>
        </div>

        <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-2xl flex items-start gap-3 text-destructive text-sm">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-2xl flex items-start gap-3 text-green-600 text-sm">
              <Check className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">











            {/* SIGN UP  */}
            {authMode === "signup" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" placeholder="John" value={formData.firstName} onChange={handleChange} required />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Doe" value={formData.lastName} onChange={handleChange} required />
                  </div>
                </div>

                <div>
                  <Label>Send verification code via</Label>
                  <div className="flex gap-3 mt-2">
                    {(["Email", "Phone"] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, otpDeliveryMethod: method }))}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 border rounded-2xl text-sm transition-all ${
                          formData.otpDeliveryMethod === method
                            ? "border-primary bg-primary/10 text-primary font-medium"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        {method === "Email" ? <Mail className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor={formData.otpDeliveryMethod === "Phone" ? "phone" : "email"}>
                    {formData.otpDeliveryMethod === "Phone" ? "Phone Number" : "Email Address"}
                  </Label>
                  {formData.otpDeliveryMethod === "Phone" ? (
                    <Input id="phone" type="tel" placeholder="+254712345678" value={formData.phone} onChange={handleChange} required />
                  ) : (
                    <Input id="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} required />
                  )}
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {formData.otpDeliveryMethod === "Phone" 
                      ? " OTP code will be sent to this phone number" 
                      : " OTP code will be sent to this email address"}
                  </p>
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {formData.password && (
                    <div className="mt-3 p-4 bg-muted/50 rounded-2xl space-y-2 text-xs">
                      {passwordChecks.map((check, i) => (
                        <div key={i} className="flex items-center gap-2">
                          {check.passed ? <Check className="h-3.5 w-3.5 text-green-500" /> : <X className="h-3.5 w-3.5 text-destructive" />}
                          <span className={check.passed ? "text-green-600" : "text-muted-foreground"}>{check.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isLoading || !isPasswordValid}>
                  {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Creating account...</> : "Create Account"}
                </Button>
              </>
            )}













            {/*  SIGN IN (Password)  */}
            {authMode === "login" && (
              <>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} required />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <Label htmlFor="password">Password</Label>
                    <button
                      type="button"
                      onClick={() => handleModeChange("forgot-password")}
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isLoading}>
                  {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Signing in...</> : "Sign In"}
                </Button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => handleModeChange("otp-login")}
                    className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 mx-auto"
                  >
                    <KeyRound className="h-4 w-4" />
                    Sign in with verification code instead
                  </button>
                </div>
              </>
            )}











            {/*  SIGN IN WITH CODE */}
            {authMode === "otp-login" && (
              <>
                <div>
                  <Label>Send code to</Label>
                  <div className="flex gap-3 mt-2">
                    {(["Email", "Phone"] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, otpDeliveryMethod: method }))}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 border rounded-2xl text-sm transition-all ${
                          formData.otpDeliveryMethod === method
                            ? "border-primary bg-primary/10 text-primary font-medium"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        {method === "Email" ? <Mail className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Email Field (Always Required for Account Lookup) */}
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/*  Phone Field (Only if Phone selected) */}
                {formData.otpDeliveryMethod === "Phone" && (
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+254712345678"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">
                       This phone number must be linked to your email
                    </p>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  {formData.otpDeliveryMethod === "Phone" 
                    ? " OTP code will be sent to this phone number" 
                    : " OTP code will be sent to this email address"}
                </p>

                <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isLoading}>
                  {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Sending code...</> : "Send Code"}
                </Button>
              </>
            )}









            {/*  FORGOT PASSWORD  */}
            {authMode === "forgot-password" && (
              <>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} required />
                  <p className="text-xs text-muted-foreground mt-1.5">We'll send a reset code to this email</p>
                </div>

                <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isLoading}>
                  {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Sending code...</> : "Send Reset Code"}
                </Button>
              </>
            )}












            {/*  VERIFY OTP */}
            {authMode === "verify-otp" && (
              <>
                <div className="text-center mb-2">
                  <p className="text-sm text-muted-foreground">We sent a 6-digit code to</p>
                  <p className="font-medium mt-1 break-all">{otpIdentifier}</p>
                </div>

                <div>
                  <Label htmlFor="otpCode">Verification Code</Label>
                  <Input
                    id="otpCode"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={formData.otpCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setFormData(prev => ({ ...prev, otpCode: val }));
                    }}
                    className="text-center text-3xl tracking-[0.75em] font-mono h-16"
                    required
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    Expires in 5 minutes
                  </p>
                </div>

                {otpPurpose === "PasswordReset" && (
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.newPassword}
                        onChange={handleChange}
                        className="pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {formData.newPassword && (
                      <div className="mt-3 p-4 bg-muted/50 rounded-2xl space-y-2 text-xs">
                        {newPasswordChecks.map((check, i) => (
                          <div key={i} className="flex items-center gap-2">
                            {check.passed ? <Check className="h-3.5 w-3.5 text-green-500" /> : <X className="h-3.5 w-3.5 text-destructive" />}
                            <span className={check.passed ? "text-green-600" : "text-muted-foreground"}>{check.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Dev OTP Mock (Kept for testing) */}
                {!otpIdentifier.includes("@") && otpPurpose !== "PasswordReset" && (
                  <div className="text-center text-xs text-amber-600 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
                    <Button type="button" variant="outline" size="sm" className="mt-3" onClick={handleDevShowOtp}>
                      Show Mock OTP
                    </Button>
                    {lastSentOtp && <p className="mt-2 font-mono text-lg">OTP: {lastSentOtp}</p>}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold"
                  disabled={isLoading || formData.otpCode.length !== 6 || (otpPurpose === "PasswordReset" && !isNewPasswordValid)}
                >
                  {isLoading
                    ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> {otpPurpose === "PasswordReset" ? "Resetting..." : "Verifying..."}</>
                    : otpPurpose === "PasswordReset" ? "Reset Password" : "Verify Code"}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-sm text-muted-foreground"
                  onClick={async () => {
                    setIsLoading(true);
                    try {
                      await fetch(`${API_BASE}/auth/send-otp`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ OTP: otpIdentifier }),
                      });
                      setSuccessMessage("New code sent!");
                    } catch {
                      setError("Failed to resend code");
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                >
                  Didn't receive the code? Resend
                </Button>
              </>
            )}
          </form>

          {/* Footer Navigation */}
          <div className="mt-8 text-center text-sm text-muted-foreground">
            {authMode === "login" && (
              <>Don't have an account?{" "}
                <button onClick={() => handleModeChange("signup")} className="text-primary hover:underline font-medium">Create Account</button>
              </>
            )}
            {authMode === "signup" && (
              <>Already have an account?{" "}
                <button onClick={() => handleModeChange("login")} className="text-primary hover:underline font-medium">Sign In</button>
              </>
            )}
            {(authMode === "otp-login" || authMode === "forgot-password" || authMode === "verify-otp") && (
              <button onClick={() => handleModeChange("login")} className="text-primary hover:underline font-medium">
                ← Back to Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;