/**
 * Enterprise Management Page
 * Comprehensive team and user management for enterprise accounts
 */

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  UserPlus,
  Settings,
  Shield,
  Crown,
  Mail,
  Clock,
  Activity,
  TrendingUp,
  BarChart3,
  Key,
  Brain,
  Download,
  Upload,
  Edit,
  Trash2,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  useEnterprise,
  USER_ROLES,
  UserRole,
  AI_MODEL_ACCESS,
  FEATURE_ACCESS,
} from "@/context/EnterpriseUserContext";
import { useLicense } from "@/hooks/useLicense";
import { toast } from "sonner";

// Statistics cards
function StatsOverview() {
  const enterprise = useEnterprise();

  if (!enterprise) return null;

  const stats = enterprise.getUsageStats();

  const statCards = [
    {
      title: "Total Members",
      value: stats.totalMembers,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "Active Members",
      value: stats.activeMembers,
      icon: Activity,
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      title: "Pending Invites",
      value: stats.pendingInvitations,
      icon: Mail,
      color: "text-orange-600",
      bg: "bg-orange-100",
    },
    {
      title: "Scans This Month",
      value: stats.totalScansThisMonth,
      icon: BarChart3,
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

// Invite member dialog
function InviteMemberDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("analyst");
  const [message, setMessage] = useState("");
  const enterprise = useEnterprise();

  if (!enterprise) return null;

  const handleInvite = async () => {
    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    const success = await enterprise.inviteMember(email, role, message);
    if (success) {
      setEmail("");
      setMessage("");
      setIsOpen(false);
    }
  };

  const getRoleColor = (role: UserRole) => {
    return USER_ROLES[role].color;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Send an invitation to join your enterprise team
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={role}
              onValueChange={(value: UserRole) => setRole(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(USER_ROLES).map(([key, roleInfo]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center space-x-2">
                      <span>{roleInfo.icon}</span>
                      <span>{roleInfo.name}</span>
                      <Badge
                        variant="outline"
                        className={`text-xs text-${getRoleColor(key as UserRole)}-600`}
                      >
                        {roleInfo.tier}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {USER_ROLES[role].description}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Welcome Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Welcome to our security team! Looking forward to working with you."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleInvite} disabled={!email.trim()}>
            Send Invitation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Members table
function MembersTable() {
  const [search, setSearch] = useState("");
  const enterprise = useEnterprise();

  if (!enterprise) return null;

  const { members, updateMemberRole, removeMember } = enterprise;

  const filteredMembers = members.filter(
    (member) =>
      member.email.toLowerCase().includes(search.toLowerCase()) ||
      member.username.toLowerCase().includes(search.toLowerCase()) ||
      member.role.toLowerCase().includes(search.toLowerCase()),
  );

  const getRoleIcon = (role: UserRole) => {
    return USER_ROLES[role].icon;
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (USER_ROLES[role].color) {
      case "red":
        return "bg-red-100 text-red-700";
      case "blue":
        return "bg-blue-100 text-blue-700";
      case "purple":
        return "bg-purple-100 text-purple-700";
      case "green":
        return "bg-green-100 text-green-700";
      case "gray":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatLastLogin = (timestamp?: number) => {
    if (!timestamp) return "Never";
    const diff = Date.now() - timestamp;
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-64"
          />
        </div>
        <InviteMemberDialog />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback>
                        {member.firstName?.[0] || member.email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {member.firstName && member.lastName
                          ? `${member.firstName} ${member.lastName}`
                          : member.username}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {member.email}
                      </p>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getRoleIcon(member.role)}</span>
                    <Badge
                      className={`text-xs ${getRoleBadgeColor(member.role)}`}
                    >
                      {USER_ROLES[member.role].name}
                    </Badge>
                  </div>
                </TableCell>

                <TableCell>
                  <Badge
                    variant={
                      member.status === "active" ? "default" : "secondary"
                    }
                  >
                    {member.status}
                  </Badge>
                </TableCell>

                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {formatLastLogin(member.lastLogin)}
                  </span>
                </TableCell>

                <TableCell>
                  <div className="text-sm">
                    <div>{member.usage.scansThisMonth} scans</div>
                    <div className="text-muted-foreground">
                      {member.usage.apiCallsThisMonth} API calls
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Member
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Key className="h-4 w-4 mr-2" />
                        Manage Permissions
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Brain className="h-4 w-4 mr-2" />
                        AI Model Access
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => removeMember(member.id)}
                        className="text-red-600"
                        disabled={member.role === "admin"}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove Member
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// Pending invitations
function PendingInvitations() {
  const enterprise = useEnterprise();

  if (!enterprise) return null;

  const { invitations, revokeInvitation, resendInvitation } = enterprise;

  const pendingInvitations = invitations.filter(
    (inv) => inv.status === "pending",
  );

  if (pendingInvitations.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No pending invitations</p>
        </CardContent>
      </Card>
    );
  }

  const formatTimeLeft = (expiresAt: number) => {
    const diff = expiresAt - Date.now();
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return "Expiring soon";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pending Invitations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {pendingInvitations.map((invitation) => (
            <div
              key={invitation.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{invitation.email}</span>
                  <Badge variant="outline" className="text-xs">
                    {USER_ROLES[invitation.role].name}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Expires in {formatTimeLeft(invitation.expiresAt)}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => resendInvitation(invitation.id)}
                >
                  Resend
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => revokeInvitation(invitation.id)}
                >
                  Revoke
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Organization settings
function OrganizationSettings() {
  const enterprise = useEnterprise();

  if (!enterprise) return null;

  const { settings, updateSettings } = enterprise;

  const handleSettingChange = (key: string, value: any) => {
    updateSettings({ [key]: value });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Maximum Team Size</Label>
              <Input
                type="number"
                value={settings.maxTeamSize}
                onChange={(e) =>
                  handleSettingChange("maxTeamSize", parseInt(e.target.value))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Default Role for New Members</Label>
              <Select
                value={settings.defaultRole}
                onValueChange={(value) =>
                  handleSettingChange("defaultRole", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(USER_ROLES).map(([key, role]) => (
                    <SelectItem key={key} value={key}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Allow Self Registration</Label>
                <p className="text-sm text-muted-foreground">
                  Allow users with your domain to register automatically
                </p>
              </div>
              <Switch
                checked={settings.allowSelfRegistration}
                onCheckedChange={(checked) =>
                  handleSettingChange("allowSelfRegistration", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Require Approval for Registration</Label>
                <p className="text-sm text-muted-foreground">
                  New registrations require admin approval
                </p>
              </div>
              <Switch
                checked={settings.requireApprovalForRegistration}
                onCheckedChange={(checked) =>
                  handleSettingChange("requireApprovalForRegistration", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Audit Logging</Label>
                <p className="text-sm text-muted-foreground">
                  Log all user actions for compliance
                </p>
              </div>
              <Switch
                checked={settings.auditLogging}
                onCheckedChange={(checked) =>
                  handleSettingChange("auditLogging", checked)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Session Timeout (minutes)</Label>
            <Input
              type="number"
              value={settings.sessionTimeout}
              onChange={(e) =>
                handleSettingChange("sessionTimeout", parseInt(e.target.value))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Data Retention Period (days)</Label>
            <Input
              type="number"
              value={settings.dataRetentionDays}
              onChange={(e) =>
                handleSettingChange(
                  "dataRetentionDays",
                  parseInt(e.target.value),
                )
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Enforce SSO</Label>
              <p className="text-sm text-muted-foreground">
                Require single sign-on for all users
              </p>
            </div>
            <Switch
              checked={settings.enforceSSO}
              onCheckedChange={(checked) =>
                handleSettingChange("enforceSSO", checked)
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Main Enterprise page
export function EnterprisePage() {
  const { tier } = useLicense();
  const enterprise = useEnterprise();

  if (tier !== "enterprise") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <Crown className="h-12 w-12 mx-auto mb-4 text-orange-600" />
              <CardTitle className="text-2xl">Enterprise Features</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Enterprise team management is available for Enterprise tier
                users only.
              </p>
              <Button>
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Enterprise
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!enterprise || enterprise.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading enterprise data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Crown className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-orange-800 bg-clip-text text-transparent">
                    Enterprise Management
                  </h1>
                  <p className="text-gray-600">
                    Manage your team, roles, and enterprise settings
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="text-xs">
                {enterprise.organization?.name}
              </Badge>
              <Badge className="text-xs bg-orange-100 text-orange-700">
                Enterprise Plan
              </Badge>
            </div>
          </div>

          {/* Stats Overview */}
          <StatsOverview />
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs defaultValue="members" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="invitations">Invitations</TabsTrigger>
              <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="members">
              <MembersTable />
            </TabsContent>

            <TabsContent value="invitations">
              <PendingInvitations />
            </TabsContent>

            <TabsContent value="roles">
              <Card>
                <CardHeader>
                  <CardTitle>Role Management</CardTitle>
                  <CardDescription>
                    Configure roles, permissions, and feature access
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {Object.entries(USER_ROLES).map(([key, role]) => (
                      <Card key={key}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl">{role.icon}</span>
                              <div>
                                <h4 className="font-medium">{role.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {role.description}
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className={`text-${role.color}-600`}
                            >
                              {role.tier}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <h5 className="font-medium mb-2">Permissions</h5>
                              <div className="space-y-1">
                                {role.permissions.slice(0, 3).map((perm) => (
                                  <div
                                    key={perm}
                                    className="text-muted-foreground"
                                  >
                                    • {perm.replace("_", " ")}
                                  </div>
                                ))}
                                {role.permissions.length > 3 && (
                                  <div className="text-muted-foreground">
                                    +{role.permissions.length - 3} more
                                  </div>
                                )}
                              </div>
                            </div>

                            <div>
                              <h5 className="font-medium mb-2">Features</h5>
                              <div className="space-y-1">
                                {role.features.slice(0, 3).map((feature) => (
                                  <div
                                    key={feature}
                                    className="text-muted-foreground"
                                  >
                                    • {feature.replace("_", " ")}
                                  </div>
                                ))}
                                {role.features.length > 3 && (
                                  <div className="text-muted-foreground">
                                    +{role.features.length - 3} more
                                  </div>
                                )}
                              </div>
                            </div>

                            <div>
                              <h5 className="font-medium mb-2">AI Models</h5>
                              <div className="space-y-1">
                                {AI_MODEL_ACCESS[key as UserRole].map(
                                  (model) => (
                                    <div
                                      key={model}
                                      className="text-muted-foreground"
                                    >
                                      • {model}
                                    </div>
                                  ),
                                )}
                                {AI_MODEL_ACCESS[key as UserRole].length ===
                                  0 && (
                                  <div className="text-muted-foreground">
                                    No AI access
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <OrganizationSettings />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}

export default EnterprisePage;
