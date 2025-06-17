/**
 * Team Chat Context
 * Manages real-time team communication via WebSocket
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useLicense } from "@/hooks/useLicense";

// Message types
export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  userAvatar?: string;
  content: string;
  type: "text" | "image" | "file" | "system" | "scan_result" | "alert";
  timestamp: number;
  edited?: boolean;
  editedAt?: number;
  replyTo?: string;
  reactions?: Record<string, string[]>; // emoji -> userIds
  metadata?: {
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    scanId?: string;
    alertType?: string;
  };
}

// Chat room types
export interface ChatRoom {
  id: string;
  name: string;
  description: string;
  type: "public" | "private" | "dm";
  members: TeamMember[];
  admins: string[]; // user IDs
  createdAt: number;
  lastActivity: number;
  unreadCount: number;
  isArchived: boolean;
  settings: {
    allowFileUploads: boolean;
    allowScanSharing: boolean;
    retentionDays: number;
    notificationsEnabled: boolean;
  };
}

// Team member interface
export interface TeamMember {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  role: "admin" | "manager" | "senior_analyst" | "analyst" | "viewer";
  tier: "community" | "starter" | "pro" | "enterprise";
  status: "online" | "away" | "busy" | "offline";
  lastSeen: number;
  permissions: string[];
  isBot?: boolean;
}

// Connection status
export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

// Team Chat State
export interface TeamChatState {
  rooms: ChatRoom[];
  activeRoomId: string | null;
  messages: Record<string, ChatMessage[]>; // roomId -> messages
  members: TeamMember[];
  onlineMembers: string[];
  currentUser: TeamMember | null;
  connectionStatus: ConnectionStatus;
  typingUsers: Record<string, string[]>; // roomId -> userIds
  unreadTotal: number;
  notifications: boolean;
  soundEnabled: boolean;
}

// Default state
const DEFAULT_STATE: TeamChatState = {
  rooms: [],
  activeRoomId: null,
  messages: {},
  members: [],
  onlineMembers: [],
  currentUser: null,
  connectionStatus: "disconnected",
  typingUsers: {},
  unreadTotal: 0,
  notifications: true,
  soundEnabled: false,
};

// Action types
type TeamChatAction =
  | { type: "SET_CONNECTION_STATUS"; payload: ConnectionStatus }
  | { type: "SET_CURRENT_USER"; payload: TeamMember }
  | { type: "SET_ROOMS"; payload: ChatRoom[] }
  | { type: "ADD_ROOM"; payload: ChatRoom }
  | { type: "UPDATE_ROOM"; payload: { id: string; updates: Partial<ChatRoom> } }
  | { type: "REMOVE_ROOM"; payload: string }
  | { type: "SET_ACTIVE_ROOM"; payload: string | null }
  | { type: "SET_MEMBERS"; payload: TeamMember[] }
  | {
      type: "UPDATE_MEMBER";
      payload: { id: string; updates: Partial<TeamMember> };
    }
  | { type: "SET_ONLINE_MEMBERS"; payload: string[] }
  | { type: "ADD_MESSAGE"; payload: { roomId: string; message: ChatMessage } }
  | {
      type: "UPDATE_MESSAGE";
      payload: {
        roomId: string;
        messageId: string;
        updates: Partial<ChatMessage>;
      };
    }
  | { type: "DELETE_MESSAGE"; payload: { roomId: string; messageId: string } }
  | {
      type: "SET_MESSAGES";
      payload: { roomId: string; messages: ChatMessage[] };
    }
  | { type: "SET_TYPING"; payload: { roomId: string; userIds: string[] } }
  | { type: "UPDATE_UNREAD"; payload: { roomId: string; count: number } }
  | { type: "MARK_ROOM_READ"; payload: string }
  | { type: "SET_NOTIFICATIONS"; payload: boolean }
  | { type: "SET_SOUND_ENABLED"; payload: boolean };

// Reducer
function teamChatReducer(
  state: TeamChatState,
  action: TeamChatAction,
): TeamChatState {
  switch (action.type) {
    case "SET_CONNECTION_STATUS":
      return { ...state, connectionStatus: action.payload };

    case "SET_CURRENT_USER":
      return { ...state, currentUser: action.payload };

    case "SET_ROOMS":
      return { ...state, rooms: action.payload };

    case "ADD_ROOM":
      return { ...state, rooms: [...state.rooms, action.payload] };

    case "UPDATE_ROOM":
      return {
        ...state,
        rooms: state.rooms.map((room) =>
          room.id === action.payload.id
            ? { ...room, ...action.payload.updates }
            : room,
        ),
      };

    case "REMOVE_ROOM":
      return {
        ...state,
        rooms: state.rooms.filter((room) => room.id !== action.payload),
        activeRoomId:
          state.activeRoomId === action.payload ? null : state.activeRoomId,
      };

    case "SET_ACTIVE_ROOM":
      return { ...state, activeRoomId: action.payload };

    case "SET_MEMBERS":
      return { ...state, members: action.payload };

    case "UPDATE_MEMBER":
      return {
        ...state,
        members: state.members.map((member) =>
          member.id === action.payload.id
            ? { ...member, ...action.payload.updates }
            : member,
        ),
      };

    case "SET_ONLINE_MEMBERS":
      return { ...state, onlineMembers: action.payload };

    case "ADD_MESSAGE":
      const { roomId, message } = action.payload;
      return {
        ...state,
        messages: {
          ...state.messages,
          [roomId]: [...(state.messages[roomId] || []), message],
        },
      };

    case "UPDATE_MESSAGE":
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.roomId]:
            state.messages[action.payload.roomId]?.map((msg) =>
              msg.id === action.payload.messageId
                ? { ...msg, ...action.payload.updates }
                : msg,
            ) || [],
        },
      };

    case "DELETE_MESSAGE":
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.roomId]:
            state.messages[action.payload.roomId]?.filter(
              (msg) => msg.id !== action.payload.messageId,
            ) || [],
        },
      };

    case "SET_MESSAGES":
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.roomId]: action.payload.messages,
        },
      };

    case "SET_TYPING":
      return {
        ...state,
        typingUsers: {
          ...state.typingUsers,
          [action.payload.roomId]: action.payload.userIds,
        },
      };

    case "UPDATE_UNREAD":
      return {
        ...state,
        rooms: state.rooms.map((room) =>
          room.id === action.payload.roomId
            ? { ...room, unreadCount: action.payload.count }
            : room,
        ),
        unreadTotal: state.rooms.reduce(
          (total, room) =>
            total +
            (room.id === action.payload.roomId
              ? action.payload.count
              : room.unreadCount),
          0,
        ),
      };

    case "MARK_ROOM_READ":
      return {
        ...state,
        rooms: state.rooms.map((room) =>
          room.id === action.payload ? { ...room, unreadCount: 0 } : room,
        ),
        unreadTotal: state.rooms.reduce(
          (total, room) =>
            total + (room.id === action.payload ? 0 : room.unreadCount),
          0,
        ),
      };

    case "SET_NOTIFICATIONS":
      return { ...state, notifications: action.payload };

    case "SET_SOUND_ENABLED":
      return { ...state, soundEnabled: action.payload };

    default:
      return state;
  }
}

// WebSocket event types
interface WebSocketEvent {
  type: string;
  payload: any;
  timestamp?: number;
}

// Context interface
interface TeamChatContextType extends TeamChatState {
  sendMessage: (
    roomId: string,
    content: string,
    type?: ChatMessage["type"],
  ) => void;
  editMessage: (roomId: string, messageId: string, content: string) => void;
  deleteMessage: (roomId: string, messageId: string) => void;
  addReaction: (roomId: string, messageId: string, emoji: string) => void;
  removeReaction: (roomId: string, messageId: string, emoji: string) => void;
  createRoom: (
    name: string,
    description: string,
    type: ChatRoom["type"],
    members: string[],
  ) => void;
  updateRoom: (roomId: string, updates: Partial<ChatRoom>) => void;
  deleteRoom: (roomId: string) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  setActiveRoom: (roomId: string | null) => void;
  markRoomAsRead: (roomId: string) => void;
  setTyping: (roomId: string, isTyping: boolean) => void;
  shareFile: (roomId: string, file: File) => void;
  shareScanResult: (roomId: string, scanId: string) => void;
  inviteMember: (email: string, role: TeamMember["role"]) => void;
  removeMember: (memberId: string) => void;
  updateMemberRole: (memberId: string, role: TeamMember["role"]) => void;
  connect: () => void;
  disconnect: () => void;
  isOnline: (userId: string) => boolean;
  canAccessFeature: (feature: string) => boolean;
}

// Create context
const TeamChatContext = createContext<TeamChatContextType | null>(null);

// Team Chat provider component
interface TeamChatProviderProps {
  children: ReactNode;
}

export function TeamChatProvider({ children }: TeamChatProviderProps) {
  const [state, dispatch] = useReducer(teamChatReducer, DEFAULT_STATE);
  const { user } = useAuth();
  const { tier } = useLicense();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const typingTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Check if team chat is available for current tier
  const canUseTeamChat = tier === "enterprise";

  // WebSocket connection management
  const connect = () => {
    if (!canUseTeamChat || !user) return;

    dispatch({ type: "SET_CONNECTION_STATUS", payload: "connecting" });    // In real implementation, use actual WebSocket URL
    const wsUrl = `ws://localhost:3001/ws/team-chat?token=${user.token}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        dispatch({ type: "SET_CONNECTION_STATUS", payload: "connected" });
        toast.success("Connected to team chat");
      };

      ws.onmessage = (event) => {
        try {
          const data: WebSocketEvent = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      ws.onclose = () => {
        dispatch({ type: "SET_CONNECTION_STATUS", payload: "disconnected" });

        // Auto-reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          if (canUseTeamChat) {
            connect();
          }
        }, 3000);
      };

      ws.onerror = () => {
        dispatch({ type: "SET_CONNECTION_STATUS", payload: "error" });
        toast.error("Team chat connection failed");
      };
    } catch (error) {
      dispatch({ type: "SET_CONNECTION_STATUS", payload: "error" });
      console.error("WebSocket connection error:", error);
    }
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    dispatch({ type: "SET_CONNECTION_STATUS", payload: "disconnected" });
  };

  // Handle WebSocket messages
  const handleWebSocketMessage = (event: WebSocketEvent) => {
    switch (event.type) {
      case "message":
        dispatch({
          type: "ADD_MESSAGE",
          payload: {
            roomId: event.payload.roomId,
            message: event.payload.message,
          },
        });

        // Play notification sound
        if (
          state.soundEnabled &&
          event.payload.message.userId !== state.currentUser?.id
        ) {
          playNotificationSound();
        }
        break;

      case "message_updated":
        dispatch({
          type: "UPDATE_MESSAGE",
          payload: {
            roomId: event.payload.roomId,
            messageId: event.payload.messageId,
            updates: event.payload.updates,
          },
        });
        break;

      case "message_deleted":
        dispatch({
          type: "DELETE_MESSAGE",
          payload: {
            roomId: event.payload.roomId,
            messageId: event.payload.messageId,
          },
        });
        break;

      case "user_typing":
        dispatch({
          type: "SET_TYPING",
          payload: {
            roomId: event.payload.roomId,
            userIds: event.payload.userIds,
          },
        });
        break;

      case "room_created":
        dispatch({ type: "ADD_ROOM", payload: event.payload.room });
        break;

      case "room_updated":
        dispatch({
          type: "UPDATE_ROOM",
          payload: { id: event.payload.roomId, updates: event.payload.updates },
        });
        break;

      case "member_joined":
        dispatch({
          type: "UPDATE_MEMBER",
          payload: {
            id: event.payload.memberId,
            updates: event.payload.member,
          },
        });
        break;

      case "members_online":
        dispatch({
          type: "SET_ONLINE_MEMBERS",
          payload: event.payload.userIds,
        });
        break;

      default:
        console.log("Unknown WebSocket event:", event.type);
    }
  };

  // Send WebSocket message
  const sendWebSocketMessage = (type: string, payload: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ type, payload, timestamp: Date.now() }),
      );
    }
  };

  // Play notification sound
  const playNotificationSound = () => {
    // In real implementation, play actual notification sound
    console.log("🔔 New message notification");
  };

  // Initialize connection and current user
  useEffect(() => {
    if (canUseTeamChat && user) {
      const currentUser: TeamMember = {
        id: user.id,
        username: user.username || user.email,
        email: user.email,
        avatar: user.avatar,
        role: user.role || "analyst",
        tier: tier,
        status: "online",
        lastSeen: Date.now(),
        permissions: user.permissions || [],
      };

      dispatch({ type: "SET_CURRENT_USER", payload: currentUser });
      connect();
    }

    return () => {
      disconnect();
    };
  }, [canUseTeamChat, user, tier]);

  // Context methods
  const sendMessage = (
    roomId: string,
    content: string,
    type: ChatMessage["type"] = "text",
  ) => {
    if (!state.currentUser) return;

    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random()}`,
      userId: state.currentUser.id,
      username: state.currentUser.username,
      userAvatar: state.currentUser.avatar,
      content,
      type,
      timestamp: Date.now(),
    };

    sendWebSocketMessage("send_message", { roomId, message });
  };

  const editMessage = (roomId: string, messageId: string, content: string) => {
    sendWebSocketMessage("edit_message", { roomId, messageId, content });
  };

  const deleteMessage = (roomId: string, messageId: string) => {
    sendWebSocketMessage("delete_message", { roomId, messageId });
  };

  const addReaction = (roomId: string, messageId: string, emoji: string) => {
    sendWebSocketMessage("add_reaction", { roomId, messageId, emoji });
  };

  const removeReaction = (roomId: string, messageId: string, emoji: string) => {
    sendWebSocketMessage("remove_reaction", { roomId, messageId, emoji });
  };

  const createRoom = (
    name: string,
    description: string,
    type: ChatRoom["type"],
    members: string[],
  ) => {
    sendWebSocketMessage("create_room", { name, description, type, members });
  };

  const updateRoom = (roomId: string, updates: Partial<ChatRoom>) => {
    sendWebSocketMessage("update_room", { roomId, updates });
  };

  const deleteRoom = (roomId: string) => {
    sendWebSocketMessage("delete_room", { roomId });
  };

  const joinRoom = (roomId: string) => {
    sendWebSocketMessage("join_room", { roomId });
  };

  const leaveRoom = (roomId: string) => {
    sendWebSocketMessage("leave_room", { roomId });
  };

  const setActiveRoom = (roomId: string | null) => {
    dispatch({ type: "SET_ACTIVE_ROOM", payload: roomId });
    if (roomId) {
      markRoomAsRead(roomId);
    }
  };

  const markRoomAsRead = (roomId: string) => {
    dispatch({ type: "MARK_ROOM_READ", payload: roomId });
    sendWebSocketMessage("mark_read", { roomId });
  };

  const setTyping = (roomId: string, isTyping: boolean) => {
    if (typingTimeoutRef.current[roomId]) {
      clearTimeout(typingTimeoutRef.current[roomId]);
    }

    sendWebSocketMessage("typing", { roomId, isTyping });

    if (isTyping) {
      typingTimeoutRef.current[roomId] = setTimeout(() => {
        sendWebSocketMessage("typing", { roomId, isTyping: false });
      }, 3000);
    }
  };

  const shareFile = (roomId: string, file: File) => {
    // In real implementation, upload file and send message with file info
    const message = `📎 Shared file: ${file.name}`;
    sendMessage(roomId, message, "file");
  };

  const shareScanResult = (roomId: string, scanId: string) => {
    const message = `🔍 Shared scan result: ${scanId}`;
    sendMessage(roomId, message, "scan_result");
  };

  const inviteMember = (email: string, role: TeamMember["role"]) => {
    sendWebSocketMessage("invite_member", { email, role });
  };

  const removeMember = (memberId: string) => {
    sendWebSocketMessage("remove_member", { memberId });
  };

  const updateMemberRole = (memberId: string, role: TeamMember["role"]) => {
    sendWebSocketMessage("update_member_role", { memberId, role });
  };

  const isOnline = (userId: string): boolean => {
    return state.onlineMembers.includes(userId);
  };

  const canAccessFeature = (feature: string): boolean => {
    if (!state.currentUser) return false;

    const rolePermissions = {
      admin: ["*"],
      manager: [
        "invite",
        "remove",
        "update_roles",
        "create_rooms",
        "delete_rooms",
      ],
      senior_analyst: ["create_rooms", "share_scans"],
      analyst: ["share_scans"],
      viewer: ["view_only"],
    };

    const permissions = rolePermissions[state.currentUser.role] || [];
    return permissions.includes("*") || permissions.includes(feature);
  };

  const value: TeamChatContextType = {
    ...state,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    createRoom,
    updateRoom,
    deleteRoom,
    joinRoom,
    leaveRoom,
    setActiveRoom,
    markRoomAsRead,
    setTyping,
    shareFile,
    shareScanResult,
    inviteMember,
    removeMember,
    updateMemberRole,
    connect,
    disconnect,
    isOnline,
    canAccessFeature,
  };

  // Don't render provider if team chat is not available
  if (!canUseTeamChat) {
    return <>{children}</>;
  }

  return (
    <TeamChatContext.Provider value={value}>
      {children}
    </TeamChatContext.Provider>
  );
}

// Custom hook to use team chat
export function useTeamChat(): TeamChatContextType | null {
  const context = useContext(TeamChatContext);
  return context;
}
