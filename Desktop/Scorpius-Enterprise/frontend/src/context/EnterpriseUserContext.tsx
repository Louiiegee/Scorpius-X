/**
 * Enterprise User Management Context
 * Manages team members, roles, and permissions for enterprise accounts
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useLicense } from "@/hooks/useLicense";

// User roles and their capabilities
export const USER_ROLES = {
  admin: {
    name: "Administrator",
    description: "Full system access and user management",
    permissions: [
      "manage_users",
      "manage_billing",
      "manage_settings",
      "access_all_scans",
      "delete_data",
      "export_data",
      "manage_api_keys",
      "view_audit_logs",
      "configure_integrations",
    ],
    features: [
      "advanced_scanning",
      "mev_analysis",
      "team_chat",
      "custom_plugins",
      "ai_analysis",
      "unlimited_scans",
    ],
    tier: "enterprise",
    color: "red",
    icon: "👑",
  },
  manager: {
    name: "Manager",
    description: "Team management and advanced analysis",
    permissions: [
      "manage_team",
      "access_team_scans",
      "export_data",
      "configure_alerts",
      "view_team_analytics",
    ],
    features: [
      "advanced_scanning",
      "mev_analysis",
      "team_chat",
      "ai_analysis",
      "bulk_scanning",
    ],
    tier: "pro",
    color: "blue",
    icon: "👨‍💼",
  },
  senior_analyst: {
    name: "Senior Analyst",
    description: "Advanced security analysis and reporting",
    permissions: [
      "access_own_scans",
      "access_shared_scans",
      "export_reports",
      "configure_personal_alerts",
      "share_scans",
    ],
    features: [
      "advanced_scanning",
      "mev_analysis",
      "team_chat",
      "ai_analysis",
      "custom_rules",
    ],
    tier: "pro",
    color: "purple",
    icon: "🔬",
  },
  analyst: {
    name: "Analyst",
    description: "Standard security analysis capabilities",
    permissions: [
      "access_own_scans",
      "export_basic_reports",
      "configure_personal_alerts",
    ],
    features: ["basic_scanning", "team_chat", "basic_reports"],
    tier: "starter",
    color: "green",
    icon: "🔍",
  },
  viewer: {
    name: "Viewer",
    description: "Read-only access to shared content",
    permissions: ["view_shared_scans", "view_team_analytics"],
    features: ["view_only", "team_chat"],
    tier: "community",
    color: "gray",
    icon: "👁️",
  },
} as const;

export type UserRole = keyof typeof USER_ROLES;

// AI Model access levels
export const AI_MODEL_ACCESS = {
  admin: ["gpt-4", "gpt-3.5-turbo", "claude-3-opus", "claude-3-sonnet"],
  manager: ["gpt-4", "gpt-3.5-turbo", "claude-3-sonnet"],
  senior_analyst: ["gpt-3.5-turbo", "claude-3-sonnet"],
  analyst: ["gpt-3.5-turbo"],
  viewer: [],
} as const;

// Feature access levels
export const FEATURE_ACCESS = {
  admin: ["*"], // All features
  manager: [
    "advanced_scanning",
    "mev_analysis",
    "team_management",
    "bulk_operations",
    "custom_integrations",
    "ai_analysis",
    "export_data",
  ],
  senior_analyst: [
    "advanced_scanning",
    "mev_analysis",
    "custom_rules",
    "ai_analysis",
    "export_reports",
  ],
  analyst: ["basic_scanning", "standard_reports", "basic_ai"],
  viewer: ["view_only"],
} as const;

// Team member interface
export interface TeamMember {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: UserRole;
  status: "active" | "inactive" | "pending";
  tier: string;
  permissions: string[];
  features: string[];
  aiModels: string[];
  createdAt: number;
  lastLogin?: number;
  invitedBy?: string;
  department?: string;
  notes?: string;
  usage: {
    scansThisMonth: number;
    apiCallsThisMonth: number;
    lastScanDate?: number;
    totalScans: number;
  };
  limits: {
    maxScansPerDay: number;
    maxApiCallsPerHour: number;
    maxFileUploadSize: number;
    canInviteUsers: boolean;
    canExportData: boolean;
  };
}

// Invitation interface
export interface TeamInvitation {
  id: string;
  email: string;
  role: UserRole;
  invitedBy: string;
  invitedAt: number;
  expiresAt: number;
  status: "pending" | "accepted" | "expired" | "revoked";
  message?: string;
}

// Enterprise settings
export interface EnterpriseSettings {
  maxTeamSize: number;
  defaultRole: UserRole;
  allowSelfRegistration: boolean;
  requireApprovalForRegistration: boolean;
  sessionTimeout: number;
  enforceSSO: boolean;
  ssoProvider?: string;
  domainRestrictions: string[];
  auditLogging: boolean;
  dataRetentionDays: number;
  allowedFeatures: string[];
  customBranding: {
    enabled: boolean;
    logoUrl?: string;
    primaryColor?: string;
    companyName?: string;
  };
}

// Enterprise state
export interface EnterpriseState {
  organization: {
    id: string;
    name: string;
    plan: string;
    maxUsers: number;
    usedUsers: number;
    owner: string;
    createdAt: number;
  } | null;
  members: TeamMember[];
  invitations: TeamInvitation[];
  settings: EnterpriseSettings;
  currentUser: TeamMember | null;
  isAdmin: boolean;
  isManager: boolean;
  loading: boolean;
}

// Default enterprise settings
const DEFAULT_ENTERPRISE_SETTINGS: EnterpriseSettings = {
  maxTeamSize: 50,
  defaultRole: "analyst",
  allowSelfRegistration: false,
  requireApprovalForRegistration: true,
  sessionTimeout: 480, // 8 hours
  enforceSSO: false,
  domainRestrictions: [],
  auditLogging: true,
  dataRetentionDays: 365,
  allowedFeatures: Object.keys(FEATURE_ACCESS.analyst),
  customBranding: {
    enabled: false,
  },
};

// Action types
type EnterpriseAction =
  | { type: "SET_ORGANIZATION"; payload: EnterpriseState["organization"] }
  | { type: "SET_MEMBERS"; payload: TeamMember[] }
  | { type: "ADD_MEMBER"; payload: TeamMember }
  | {
      type: "UPDATE_MEMBER";
      payload: { id: string; updates: Partial<TeamMember> };
    }
  | { type: "REMOVE_MEMBER"; payload: string }
  | { type: "SET_INVITATIONS"; payload: TeamInvitation[] }
  | { type: "ADD_INVITATION"; payload: TeamInvitation }
  | {
      type: "UPDATE_INVITATION";
      payload: { id: string; updates: Partial<TeamInvitation> };
    }
  | { type: "REMOVE_INVITATION"; payload: string }
  | { type: "SET_SETTINGS"; payload: EnterpriseSettings }
  | { type: "SET_CURRENT_USER"; payload: TeamMember | null }
  | { type: "SET_LOADING"; payload: boolean };

// Initial state
const initialState: EnterpriseState = {
  organization: null,
  members: [],
  invitations: [],
  settings: DEFAULT_ENTERPRISE_SETTINGS,
  currentUser: null,
  isAdmin: false,
  isManager: false,
  loading: true,
};

// Reducer
function enterpriseReducer(
  state: EnterpriseState,
  action: EnterpriseAction,
): EnterpriseState {
  switch (action.type) {
    case "SET_ORGANIZATION":
      return { ...state, organization: action.payload };

    case "SET_MEMBERS":
      return { ...state, members: action.payload };

    case "ADD_MEMBER":
      return { ...state, members: [...state.members, action.payload] };

    case "UPDATE_MEMBER":
      return {
        ...state,
        members: state.members.map((member) =>
          member.id === action.payload.id
            ? { ...member, ...action.payload.updates }
            : member,
        ),
      };

    case "REMOVE_MEMBER":
      return {
        ...state,
        members: state.members.filter((member) => member.id !== action.payload),
      };

    case "SET_INVITATIONS":
      return { ...state, invitations: action.payload };

    case "ADD_INVITATION":
      return { ...state, invitations: [...state.invitations, action.payload] };

    case "UPDATE_INVITATION":
      return {
        ...state,
        invitations: state.invitations.map((invitation) =>
          invitation.id === action.payload.id
            ? { ...invitation, ...action.payload.updates }
            : invitation,
        ),
      };

    case "REMOVE_INVITATION":
      return {
        ...state,
        invitations: state.invitations.filter(
          (inv) => inv.id !== action.payload,
        ),
      };

    case "SET_SETTINGS":
      return { ...state, settings: action.payload };

    case "SET_CURRENT_USER":
      return {
        ...state,
        currentUser: action.payload,
        isAdmin: action.payload?.role === "admin",
        isManager:
          action.payload?.role === "admin" ||
          action.payload?.role === "manager",
      };

    case "SET_LOADING":
      return { ...state, loading: action.payload };

    default:
      return state;
  }
}

// Context interface
interface EnterpriseContextType extends EnterpriseState {
  inviteMember: (
    email: string,
    role: UserRole,
    message?: string,
  ) => Promise<boolean>;
  updateMemberRole: (memberId: string, role: UserRole) => Promise<boolean>;
  removeMember: (memberId: string) => Promise<boolean>;
  updateMemberPermissions: (
    memberId: string,
    permissions: string[],
  ) => Promise<boolean>;
  updateMemberFeatures: (
    memberId: string,
    features: string[],
  ) => Promise<boolean>;
  revokeInvitation: (invitationId: string) => Promise<boolean>;
  resendInvitation: (invitationId: string) => Promise<boolean>;
  updateSettings: (settings: Partial<EnterpriseSettings>) => Promise<boolean>;
  hasPermission: (permission: string, userId?: string) => boolean;
  hasFeature: (feature: string, userId?: string) => boolean;
  canAccessAIModel: (model: string, userId?: string) => boolean;
  getUserLimits: (userId?: string) => TeamMember["limits"] | null;
  getUsageStats: () => {
    totalMembers: number;
    activeMembers: number;
    pendingInvitations: number;
    totalScansThisMonth: number;
    totalApiCallsThisMonth: number;
  };
}

// Create context
const EnterpriseContext = createContext<EnterpriseContextType | null>(null);

// Enterprise provider component
interface EnterpriseProviderProps {
  children: ReactNode;
}

export function EnterpriseProvider({ children }: EnterpriseProviderProps) {
  const [state, dispatch] = useReducer(enterpriseReducer, initialState);
  const { user } = useAuth();
  const { tier } = useLicense();

  // Check if enterprise features are available
  const isEnterpriseEnabled = tier === "enterprise";

  // Load enterprise data
  useEffect(() => {
    if (!isEnterpriseEnabled || !user) {
      dispatch({ type: "SET_LOADING", payload: false });
      return;
    }

    loadEnterpriseData();
  }, [isEnterpriseEnabled, user]);

  // Mock data loading function
  const loadEnterpriseData = async () => {
    try {
      // In real implementation, load from API
      const mockOrganization = {
        id: "org_123",
        name: "Acme Security Corp",
        plan: "Enterprise",
        maxUsers: 50,
        usedUsers: 12,
        owner: user?.id || "",
        createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
      };

      const mockCurrentUser: TeamMember = {
        id: user?.id || "",
        email: user?.email || "",
        username: user?.username || user?.email || "",
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        role: (user?.role as UserRole) || "admin",
        status: "active",
        tier: tier,
        permissions:
          USER_ROLES[(user?.role as UserRole) || "admin"].permissions,
        features: USER_ROLES[(user?.role as UserRole) || "admin"].features,
        aiModels: AI_MODEL_ACCESS[(user?.role as UserRole) || "admin"],
        createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
        lastLogin: Date.now(),
        usage: {
          scansThisMonth: 45,
          apiCallsThisMonth: 1250,
          totalScans: 127,
        },
        limits: {
          maxScansPerDay: 50,
          maxApiCallsPerHour: 1000,
          maxFileUploadSize: 100 * 1024 * 1024, // 100MB
          canInviteUsers: true,
          canExportData: true,
        },
      };

      const mockMembers: TeamMember[] = [
        mockCurrentUser,
        // Add more mock members...
      ];

      const mockInvitations: TeamInvitation[] = [
        {
          id: "inv_1",
          email: "john.doe@example.com",
          role: "analyst",
          invitedBy: user?.id || "",
          invitedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
          expiresAt: Date.now() + 5 * 24 * 60 * 60 * 1000,
          status: "pending",
        },
      ];

      dispatch({ type: "SET_ORGANIZATION", payload: mockOrganization });
      dispatch({ type: "SET_CURRENT_USER", payload: mockCurrentUser });
      dispatch({ type: "SET_MEMBERS", payload: mockMembers });
      dispatch({ type: "SET_INVITATIONS", payload: mockInvitations });
    } catch (error) {
      console.error("Failed to load enterprise data:", error);
      toast.error("Failed to load team data");
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  // Invite member
  const inviteMember = async (
    email: string,
    role: UserRole,
    message?: string,
  ): Promise<boolean> => {
    try {
      if (!state.isAdmin && !state.isManager) {
        toast.error("You don't have permission to invite members");
        return false;
      }

      // Check if user already exists or invited
      const existingMember = state.members.find((m) => m.email === email);
      const existingInvitation = state.invitations.find(
        (i) => i.email === email && i.status === "pending",
      );

      if (existingMember) {
        toast.error("User is already a team member");
        return false;
      }

      if (existingInvitation) {
        toast.error("Invitation already sent to this email");
        return false;
      }

      // Check team size limit
      if (state.members.length >= state.settings.maxTeamSize) {
        toast.error("Team size limit reached");
        return false;
      }

      const invitation: TeamInvitation = {
        id: `inv_${Date.now()}`,
        email,
        role,
        invitedBy: state.currentUser?.id || "",
        invitedAt: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        status: "pending",
        message,
      };

      dispatch({ type: "ADD_INVITATION", payload: invitation });
      toast.success(`Invitation sent to ${email}`);

      // In real implementation, send email invitation
      console.log("Sending invitation email:", invitation);

      return true;
    } catch (error) {
      console.error("Failed to invite member:", error);
      toast.error("Failed to send invitation");
      return false;
    }
  };

  // Update member role
  const updateMemberRole = async (
    memberId: string,
    role: UserRole,
  ): Promise<boolean> => {
    try {
      if (!state.isAdmin) {
        toast.error("Only administrators can change user roles");
        return false;
      }

      const roleInfo = USER_ROLES[role];
      const updates: Partial<TeamMember> = {
        role,
        permissions: roleInfo.permissions,
        features: roleInfo.features,
        aiModels: AI_MODEL_ACCESS[role],
        tier: roleInfo.tier,
      };

      dispatch({ type: "UPDATE_MEMBER", payload: { id: memberId, updates } });
      toast.success("Member role updated successfully");

      return true;
    } catch (error) {
      console.error("Failed to update member role:", error);
      toast.error("Failed to update member role");
      return false;
    }
  };

  // Remove member
  const removeMember = async (memberId: string): Promise<boolean> => {
    try {
      if (!state.isAdmin) {
        toast.error("Only administrators can remove members");
        return false;
      }

      if (memberId === state.currentUser?.id) {
        toast.error("You cannot remove yourself");
        return false;
      }

      dispatch({ type: "REMOVE_MEMBER", payload: memberId });
      toast.success("Member removed from team");

      return true;
    } catch (error) {
      console.error("Failed to remove member:", error);
      toast.error("Failed to remove member");
      return false;
    }
  };

  // Update member permissions
  const updateMemberPermissions = async (
    memberId: string,
    permissions: string[],
  ): Promise<boolean> => {
    try {
      if (!state.isAdmin) {
        toast.error("Only administrators can modify permissions");
        return false;
      }

      dispatch({
        type: "UPDATE_MEMBER",
        payload: { id: memberId, updates: { permissions } },
      });
      toast.success("Member permissions updated");

      return true;
    } catch (error) {
      console.error("Failed to update permissions:", error);
      toast.error("Failed to update permissions");
      return false;
    }
  };

  // Update member features
  const updateMemberFeatures = async (
    memberId: string,
    features: string[],
  ): Promise<boolean> => {
    try {
      if (!state.isAdmin) {
        toast.error("Only administrators can modify feature access");
        return false;
      }

      dispatch({
        type: "UPDATE_MEMBER",
        payload: { id: memberId, updates: { features } },
      });
      toast.success("Member feature access updated");

      return true;
    } catch (error) {
      console.error("Failed to update features:", error);
      toast.error("Failed to update features");
      return false;
    }
  };

  // Revoke invitation
  const revokeInvitation = async (invitationId: string): Promise<boolean> => {
    try {
      dispatch({
        type: "UPDATE_INVITATION",
        payload: { id: invitationId, updates: { status: "revoked" } },
      });
      toast.success("Invitation revoked");
      return true;
    } catch (error) {
      console.error("Failed to revoke invitation:", error);
      toast.error("Failed to revoke invitation");
      return false;
    }
  };

  // Resend invitation
  const resendInvitation = async (invitationId: string): Promise<boolean> => {
    try {
      const newExpiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
      dispatch({
        type: "UPDATE_INVITATION",
        payload: { id: invitationId, updates: { expiresAt: newExpiresAt } },
      });
      toast.success("Invitation resent");
      return true;
    } catch (error) {
      console.error("Failed to resend invitation:", error);
      toast.error("Failed to resend invitation");
      return false;
    }
  };

  // Update settings
  const updateSettings = async (
    settings: Partial<EnterpriseSettings>,
  ): Promise<boolean> => {
    try {
      if (!state.isAdmin) {
        toast.error("Only administrators can update settings");
        return false;
      }

      const newSettings = { ...state.settings, ...settings };
      dispatch({ type: "SET_SETTINGS", payload: newSettings });
      toast.success("Settings updated successfully");

      return true;
    } catch (error) {
      console.error("Failed to update settings:", error);
      toast.error("Failed to update settings");
      return false;
    }
  };

  // Check if user has permission
  const hasPermission = (permission: string, userId?: string): boolean => {
    const member = userId
      ? state.members.find((m) => m.id === userId)
      : state.currentUser;

    if (!member) return false;

    return (
      member.permissions.includes(permission) ||
      member.permissions.includes("*")
    );
  };

  // Check if user has feature access
  const hasFeature = (feature: string, userId?: string): boolean => {
    const member = userId
      ? state.members.find((m) => m.id === userId)
      : state.currentUser;

    if (!member) return false;

    return member.features.includes(feature) || member.features.includes("*");
  };

  // Check AI model access
  const canAccessAIModel = (model: string, userId?: string): boolean => {
    const member = userId
      ? state.members.find((m) => m.id === userId)
      : state.currentUser;

    if (!member) return false;

    return member.aiModels.includes(model);
  };

  // Get user limits
  const getUserLimits = (userId?: string): TeamMember["limits"] | null => {
    const member = userId
      ? state.members.find((m) => m.id === userId)
      : state.currentUser;

    return member?.limits || null;
  };

  // Get usage statistics
  const getUsageStats = () => {
    return {
      totalMembers: state.members.length,
      activeMembers: state.members.filter((m) => m.status === "active").length,
      pendingInvitations: state.invitations.filter(
        (i) => i.status === "pending",
      ).length,
      totalScansThisMonth: state.members.reduce(
        (sum, m) => sum + m.usage.scansThisMonth,
        0,
      ),
      totalApiCallsThisMonth: state.members.reduce(
        (sum, m) => sum + m.usage.apiCallsThisMonth,
        0,
      ),
    };
  };

  const value: EnterpriseContextType = {
    ...state,
    inviteMember,
    updateMemberRole,
    removeMember,
    updateMemberPermissions,
    updateMemberFeatures,
    revokeInvitation,
    resendInvitation,
    updateSettings,
    hasPermission,
    hasFeature,
    canAccessAIModel,
    getUserLimits,
    getUsageStats,
  };

  // Don't render provider if enterprise features are not available
  if (!isEnterpriseEnabled) {
    return <>{children}</>;
  }

  return (
    <EnterpriseContext.Provider value={value}>
      {children}
    </EnterpriseContext.Provider>
  );
}

// Custom hook to use enterprise context
export function useEnterprise(): EnterpriseContextType | null {
  const context = useContext(EnterpriseContext);
  return context;
}
