import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useUserData } from "@/hooks/useStorage";

interface User {
  username: string;
  email: string;
  role: string;
  isAuthenticated: boolean;
  licenseVerified: boolean;
  firstTimeUser: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLicenseVerified: boolean;
  isFirstTimeUser: boolean;
  isLoading: boolean;
  isInitializingWarRoom: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  verifyLicense: (licenseKey: string) => Promise<boolean>;
  updateUserProfile: (profile: Partial<User>) => void;
  completeWarRoomInitialization: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializingWarRoom, setIsInitializingWarRoom] = useState(false);
  const { data: userData, updateProfile } = useUserData();

  // Initialize authentication state
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);

      // Check for existing authentication
      const authToken = localStorage.getItem("scorpius_auth_token");
      const licenseStatus = localStorage.getItem("scorpius_license_verified");
      const userSession = localStorage.getItem("scorpius_user_session");
      const firstRunFlag = localStorage.getItem("scorpius_first_run");

      // Determine if this is a first-time user
      const isFirstTimeUser = firstRunFlag === null || firstRunFlag === "true";

      if (userSession) {
        try {
          const sessionData = JSON.parse(userSession);
          const isLicenseVerified =
            licenseStatus === "true" || licenseStatus === "demo";

          setUser({
            username: sessionData.username || userData.profile.username || "",
            email: sessionData.email || userData.profile.email || "",
            role: sessionData.role || userData.profile.role || "user",
            isAuthenticated: !!authToken,
            licenseVerified: isLicenseVerified,
            firstTimeUser: isFirstTimeUser,
          });
        } catch (error) {
          console.error("Failed to parse user session:", error);
          // Clear corrupted session data
          localStorage.removeItem("scorpius_user_session");
        }
      } else {
        // New user - check if they need license verification
        const isLicenseVerified =
          licenseStatus === "true" || licenseStatus === "demo";

        setUser({
          username: "",
          email: "",
          role: "user",
          isAuthenticated: false,
          licenseVerified: isLicenseVerified,
          firstTimeUser: isFirstTimeUser,
        });
      }
    } catch (error) {
      console.error("Failed to initialize auth:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyLicense = async (licenseKey: string): Promise<boolean> => {
    try {
      setIsLoading(true);

      // Validate input
      if (
        !licenseKey ||
        typeof licenseKey !== "string" ||
        licenseKey.trim() === ""
      ) {
        console.error("Invalid license key provided:", licenseKey);
        return false;
      }

      // Simulate license verification API call
      // In a real implementation, this would call your backend
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Valid license keys
      const validLicenses = [
        "SCORPIUS-ELITE-2024",
        "SCORPIUS-PRO-2024",
        "SCORPIUS-DEMO-2024",
      ];

      const normalizedLicenseKey = licenseKey.trim().toUpperCase();
      const isValidLicense = validLicenses.includes(normalizedLicenseKey);

      if (isValidLicense) {
        // Store license verification
        localStorage.setItem("scorpius_license_verified", "true");
        localStorage.setItem("scorpius_license_key", normalizedLicenseKey);
        localStorage.setItem("scorpius_license_date", new Date().toISOString());

        // Mark as no longer first-time user
        localStorage.setItem("scorpius_first_run", "false");

        // Update user state
        setUser((prev) =>
          prev
            ? {
                ...prev,
                licenseVerified: true,
                firstTimeUser: false,
              }
            : null,
        );

        // Initialize user data storage
        await updateProfile({
          username: "CyberOps_User",
          email: "user@scorpius.net",
          role: "Security Analyst",
        });

        return true;
      }

      return false;
    } catch (error) {
      console.error("License verification failed:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (
    username: string,
    password: string,
  ): Promise<boolean> => {
    try {
      setIsLoading(true);

      // Simulate login API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Demo authentication - in production, validate against backend
      const validCredentials = [
        { username: "admin", password: "scorpius2024" },
        { username: "user", password: "password123" },
        { username: "demo", password: "demo" },
        { username: "alice", password: "admin123" }, // Added login page credentials
      ];

      const isValidCredentials = validCredentials.some(
        (cred) => cred.username === username && cred.password === password,
      );

      if (isValidCredentials) {
        // Generate auth token (in production, this comes from backend)
        const authToken = `scorpius_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Store authentication data
        localStorage.setItem("scorpius_auth_token", authToken);
        localStorage.setItem(
          "scorpius_user_session",
          JSON.stringify({
            username,
            email: `${username}@scorpius.net`,
            role: username === "admin" ? "Administrator" : "Security Analyst",
            loginTime: new Date().toISOString(),
          }),
        );

        // Update user state
        const userData = {
          username,
          email: `${username}@scorpius.net`,
          role: username === "admin" ? "Administrator" : "Security Analyst",
          isAuthenticated: true,
          licenseVerified: true, // Already verified at this point
          firstTimeUser: false,
        };

        setUser(userData);

        // Update storage with user profile
        await updateProfile({
          username: userData.username,
          email: userData.email,
          role: userData.role,
        });

        // Start War Room initialization
        setIsInitializingWarRoom(true);

        return true;
      }

      return false;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Clear authentication data
    localStorage.removeItem("scorpius_auth_token");
    localStorage.removeItem("scorpius_user_session");

    // Note: We keep license verification status for convenience
    // If you want to force re-verification, uncomment these lines:
    // localStorage.removeItem('scorpius_license_verified');
    // localStorage.removeItem('scorpius_license_key');

    // Update user state
    setUser((prev) =>
      prev
        ? {
            ...prev,
            isAuthenticated: false,
            username: "",
            email: "",
            role: "user",
          }
        : null,
    );
  };

  const updateUserProfile = (profile: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...profile } : null));

    // Update session storage
    const currentSession = localStorage.getItem("scorpius_user_session");
    if (currentSession) {
      try {
        const sessionData = JSON.parse(currentSession);
        const updatedSession = { ...sessionData, ...profile };
        localStorage.setItem(
          "scorpius_user_session",
          JSON.stringify(updatedSession),
        );
      } catch (error) {
        console.error("Failed to update user session:", error);
      }
    }
  };

  const completeWarRoomInitialization = () => {
    setIsInitializingWarRoom(false);
  };

  const contextValue: AuthContextType = {
    user,
    isAuthenticated: user?.isAuthenticated || false,
    isLicenseVerified: user?.licenseVerified || false,
    isFirstTimeUser: user?.firstTimeUser || false,
    isLoading,
    isInitializingWarRoom,
    login,
    logout,
    verifyLicense,
    updateUserProfile,
    completeWarRoomInitialization,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
