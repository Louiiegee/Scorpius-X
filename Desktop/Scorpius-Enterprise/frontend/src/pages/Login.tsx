import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Eye,
  EyeOff,
  Lock,
  User,
  Mail,
  AlertCircle,
  CheckCircle,
  Loader2,
  Fingerprint,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { FlickeringGrid } from "@/components/ui/flickering-grid";
import { TextEffect } from "@/components/ui/text-effect";
import { useAuth } from "@/hooks/useAuth";
import { useLicense } from "@/hooks/useLicense";

interface LoginFormData {
  email: string;
  password: string;
  licenseKey?: string;
  rememberMe: boolean;
}

interface TierInfo {
  name: string;
  color: string;
  features: string[];
  limits: {
    maxConcurrentScans: number;
    exportLevel: string;
    accessWasm: boolean;
    apiCallsPerHour: number;
  };
}

const TIER_INFO: Record<string, TierInfo> = {
  community: {
    name: "Community",
    color: "rgb(107, 114, 128)",
    features: ["Basic scanning", "Public reports", "Community support"],
    limits: {
      maxConcurrentScans: 1,
      exportLevel: "basic",
      accessWasm: false,
      apiCallsPerHour: 100,
    },
  },
  starter: {
    name: "Starter",
    color: "rgb(59, 130, 246)",
    features: [
      "Advanced scanning",
      "PDF exports",
      "Email support",
      "Basic integrations",
    ],
    limits: {
      maxConcurrentScans: 3,
      exportLevel: "standard",
      accessWasm: true,
      apiCallsPerHour: 1000,
    },
  },
  pro: {
    name: "Pro",
    color: "rgb(16, 185, 129)",
    features: [
      "All Starter features",
      "MEV analysis",
      "Advanced exports",
      "Priority support",
      "Custom integrations",
    ],
    limits: {
      maxConcurrentScans: 10,
      exportLevel: "advanced",
      accessWasm: true,
      apiCallsPerHour: 5000,
    },
  },
  enterprise: {
    name: "Enterprise",
    color: "rgb(245, 158, 11)",
    features: [
      "All Pro features",
      "White-label dashboard",
      "Dedicated support",
      "Custom deployment",
      "SLA guarantees",
    ],
    limits: {
      maxConcurrentScans: 50,
      exportLevel: "enterprise",
      accessWasm: true,
      apiCallsPerHour: 25000,
    },
  },
};

export function LoginPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
    licenseKey: "",
    rememberMe: false,
  });

  const { login, register, loginWithFIDO2, isAuthenticated } = useAuth();
  const { validateLicense, getLicenseInfo } = useLicense();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    console.log('📝 Form submission started with data:', formData);

    try {      if (isLogin) {
        // Validate license if provided
        let licenseInfo = null;
        if (formData.licenseKey && formData.licenseKey.trim()) {
          console.log('🔑 Validating license key...');
          licenseInfo = await validateLicense(formData.licenseKey);
          if (!licenseInfo.valid) {
            throw new Error("Invalid license key");
          }
        } else {
          console.log('⏭️ Skipping license validation (no license key provided)');
        }

        console.log('🚀 Calling login function...');
        
        // Perform login
        const result = await login({
          email: formData.email,
          password: formData.password,
          licenseKey: formData.licenseKey,
          rememberMe: formData.rememberMe,
        });        console.log('📤 Login result:', result);        if (result.success) {
          console.log('✅ Login successful, navigating to dashboard...');
          // Give a small delay to ensure auth state is updated
          setTimeout(() => {
            console.log('⏰ Delayed navigation executing...');
            navigate("/", { replace: true });
          }, 100);
        } else {
          console.error('❌ Login failed:', result.error);
          setError(result.error || "Login failed");
        }
      } else {
        // Registration flow
        if (!formData.licenseKey) {
          setError("License key is required for registration");
          return;
        }

        const licenseInfo = await validateLicense(formData.licenseKey);
        if (!licenseInfo.valid) {
          setError("Invalid license key");
          return;
        }

        const result = await register({
          email: formData.email,
          password: formData.password,
          licenseKey: formData.licenseKey,
        });

        if (result.success) {
          setIsLogin(true);
          setError(null);
          // Show success message
        } else {
          setError(result.error || "Registration failed");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFIDO2Login = async () => {
    setIsLoading(true);
    try {
      const result = await loginWithFIDO2();      if (result.success) {
        navigate("/", { replace: true });
      } else {
        setError(result.error || "FIDO2 authentication failed");
      }
    } catch (err) {
      setError("FIDO2 authentication is not available");
    } finally {
      setIsLoading(false);
    }
  };

  const getTierFromLicense = (licenseKey: string): string => {
    // Simple tier detection based on license key format
    if (!licenseKey) return "community";
    if (licenseKey.startsWith("ENT-")) return "enterprise";
    if (licenseKey.startsWith("PRO-")) return "pro";
    if (licenseKey.startsWith("STR-")) return "starter";
    return "community";
  };

  const currentTier = getTierFromLicense(formData.licenseKey || "");
  const tierInfo = TIER_INFO[currentTier];

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center">
      <FlickeringGrid
        color="rgb(59, 130, 246)"
        maxOpacity={0.3}
        flickerChance={0.1}
        width={1400}
        height={900}
        className="absolute inset-0"
      />

      <div className="relative z-10 w-full max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Branding */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            <div className="flex items-center justify-center lg:justify-start gap-4 mb-6">
              <div className="relative">
                <Shield className="h-16 w-16 text-blue-400 drop-shadow-[0_0_20px_rgba(59,130,246,0.8)] animate-pulse" />
              </div>
              <div>
                <TextEffect
                  per="char"
                  className="text-4xl font-bold text-white"
                >
                  Scorpius
                </TextEffect>
                <p className="text-blue-400 text-sm mt-1">
                  Analyze. Simulate. Exploit.
                </p>
              </div>
            </div>

            <div className="space-y-4 text-gray-300">
              <h2 className="text-2xl font-semibold text-white">
                Blockchain Security Analysis Platform
              </h2>
              <p className="text-lg">
                Advanced vulnerability detection, MEV analysis, and smart
                contract security with enterprise-grade protection.
              </p>

              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="text-center p-4 bg-white/5 rounded-lg border border-blue-500/20">
                  <div className="text-2xl font-bold text-blue-400">10M+</div>
                  <div className="text-sm text-gray-400">
                    Contracts Analyzed
                  </div>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-lg border border-blue-500/20">
                  <div className="text-2xl font-bold text-blue-400">99.9%</div>
                  <div className="text-sm text-gray-400">Accuracy Rate</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Side - Login Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="bg-white/10 backdrop-blur-xl border-blue-500/20 shadow-[0_0_50px_rgba(59,130,246,0.3)]">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-white">
                  {isLogin ? "Sign In" : "Create Account"}
                </CardTitle>
                <p className="text-gray-400">
                  {isLogin
                    ? "Access your Scorpius dashboard"
                    : "Join the Scorpius security platform"}
                </p>
              </CardHeader>

              <CardContent className="space-y-6">
                {error && (
                  <Alert className="border-red-500/50 bg-red-500/10">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-red-300">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="pl-10 bg-white/5 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-blue-400"
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        className="pl-10 pr-10 bg-white/5 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-blue-400"
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-white"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {(!isLogin || formData.licenseKey) && (
                    <div className="space-y-2">
                      <Label htmlFor="licenseKey" className="text-white">
                        License Key {!isLogin && "*"}
                      </Label>
                      <div className="relative">
                        <Shield className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="licenseKey"
                          type="text"
                          value={formData.licenseKey}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              licenseKey: e.target.value,
                            })
                          }
                          className="pl-10 bg-white/5 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-blue-400"
                          placeholder="ENT-XXXX-XXXX-XXXX or leave empty for Community"
                          required={!isLogin}
                        />
                      </div>

                      {formData.licenseKey && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-3 p-3 bg-white/5 rounded-lg border border-gray-600"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: tierInfo.color }}
                            />
                            <span
                              className="font-semibold"
                              style={{ color: tierInfo.color }}
                            >
                              {tierInfo.name} Tier
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 space-y-1">
                            <div>
                              Max Scans: {tierInfo.limits.maxConcurrentScans}
                            </div>
                            <div>
                              API Calls: {tierInfo.limits.apiCallsPerHour}/hour
                            </div>
                            <div>
                              WASM Access:{" "}
                              {tierInfo.limits.accessWasm ? "Yes" : "No"}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {isLogin && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <input
                          id="rememberMe"
                          type="checkbox"
                          checked={formData.rememberMe}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              rememberMe: e.target.checked,
                            })
                          }
                          className="rounded border-gray-600 bg-white/5 text-blue-400 focus:ring-blue-400"
                        />
                        <Label
                          htmlFor="rememberMe"
                          className="text-sm text-gray-400"
                        >
                          Remember me
                        </Label>
                      </div>
                      <button
                        type="button"
                        className="text-sm text-blue-400 hover:text-blue-300"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-4 rounded-lg transition-all duration-200 hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] text-lg"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    🔑 {isLogin ? "Sign In with Password" : "Create Account"}
                  </Button>
                </form>

                <div className="relative">
                  <Separator className="bg-gray-600" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-black/80 px-3 text-gray-400 text-sm">
                      or
                    </span>
                  </div>
                </div>                <Button
                  type="button"
                  variant="outline"
                  onClick={handleFIDO2Login}
                  disabled={true}
                  className="w-full border-gray-600 text-gray-500 bg-gray-800 cursor-not-allowed opacity-50"
                >
                  <Fingerprint className="w-4 h-4 mr-2" />
                  FIDO2 / WebAuthn (Not Available)
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    {isLogin
                      ? "Don't have an account? Sign up"
                      : "Already have an account? Sign in"}
                  </button>
                </div>

                {!isLogin && (
                  <div className="text-xs text-gray-500 text-center">
                    By creating an account, you agree to our{" "}
                    <a href="/terms" className="text-blue-400 hover:underline">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a
                      href="/privacy"
                      className="text-blue-400 hover:underline"
                    >
                      Privacy Policy
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
