/**
 * Team Chat Component
 * Real-time team communication interface for enterprise users
 */

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Users,
  Settings,
  Plus,
  Search,
  Hash,
  Lock,
  Globe,
  Crown,
  Shield,
  Send,
  Paperclip,
  Smile,
  MoreHorizontal,
  Edit,
  Trash2,
  Reply,
  Share,
  X,
  Minimize2,
  Maximize2,
  Bell,
  BellOff,
  UserPlus,
  LogOut,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useTeamChat,
  ChatMessage,
  ChatRoom,
  TeamMember,
} from "@/context/TeamChatContext";
import { useLicense } from "@/hooks/useLicense";
import { toast } from "sonner";

// Room list component
function RoomList() {
  const teamChat = useTeamChat();
  const [searchTerm, setSearchTerm] = useState("");

  if (!teamChat) return null;

  const { rooms, activeRoomId, setActiveRoom, unreadTotal } = teamChat;

  const filteredRooms = rooms.filter((room) =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getRoomIcon = (type: ChatRoom["type"]) => {
    switch (type) {
      case "public":
        return <Hash className="h-4 w-4" />;
      case "private":
        return <Lock className="h-4 w-4" />;
      case "dm":
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <div className="w-64 bg-gray-50 border-r">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Team Chat</h3>
          <Badge variant="secondary" className="text-xs">
            {unreadTotal}
          </Badge>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search rooms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-8 text-sm"
          />
        </div>
      </div>

      {/* Rooms */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredRooms.map((room) => (
            <Button
              key={room.id}
              variant={activeRoomId === room.id ? "secondary" : "ghost"}
              onClick={() => setActiveRoom(room.id)}
              className="w-full justify-start h-auto p-2"
            >
              <div className="flex items-center space-x-2 w-full">
                <div className="text-muted-foreground">
                  {getRoomIcon(room.type)}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm truncate">
                    {room.name}
                  </div>
                  {room.unreadCount > 0 && (
                    <Badge variant="destructive" className="text-xs h-4 px-1">
                      {room.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </ScrollArea>

      {/* Create Room Button */}
      <div className="p-3 border-t">
        <CreateRoomDialog />
      </div>
    </div>
  );
}

// Create room dialog
function CreateRoomDialog() {
  const teamChat = useTeamChat();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ChatRoom["type"]>("public");

  if (!teamChat) return null;

  const { createRoom, canAccessFeature } = teamChat;

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error("Room name is required");
      return;
    }

    createRoom(name, description, type, []);
    setName("");
    setDescription("");
    setType("public");
    setIsOpen(false);
    toast.success("Room created successfully");
  };

  if (!canAccessFeature("create_rooms")) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Create Room
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Room</DialogTitle>
          <DialogDescription>
            Create a new chat room for your team
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Room Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter room name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Type</label>
            <Select
              value={type}
              onValueChange={(value: ChatRoom["type"]) => setType(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">
                  <div className="flex items-center space-x-2">
                    <Hash className="h-4 w-4" />
                    <span>Public - Anyone can join</span>
                  </div>
                </SelectItem>
                <SelectItem value="private">
                  <div className="flex items-center space-x-2">
                    <Lock className="h-4 w-4" />
                    <span>Private - Invite only</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim()}>
            Create Room
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Message component
interface MessageComponentProps {
  message: ChatMessage;
  isOwn: boolean;
  onEdit: (messageId: string, content: string) => void;
  onDelete: (messageId: string) => void;
  onReply: (messageId: string) => void;
  onReaction: (messageId: string, emoji: string) => void;
}

function MessageComponent({
  message,
  isOwn,
  onEdit,
  onDelete,
  onReply,
  onReaction,
}: MessageComponentProps) {
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const handleEdit = () => {
    onEdit(message.id, editContent);
    setIsEditing(false);
  };

  const getMessageTypeIcon = () => {
    switch (message.type) {
      case "file":
        return <Paperclip className="h-3 w-3" />;
      case "scan_result":
        return <Shield className="h-3 w-3" />;
      case "system":
        return <Settings className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group flex gap-3 p-3 hover:bg-gray-50 ${isOwn ? "flex-row-reverse" : ""}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <Avatar className="w-8 h-8">
        <AvatarImage src={message.userAvatar} />
        <AvatarFallback>
          {message.username.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Message Content */}
      <div className={`flex-1 ${isOwn ? "text-right" : ""}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">{message.username}</span>
          <span className="text-xs text-muted-foreground">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
          {getMessageTypeIcon()}
          {message.edited && (
            <Badge variant="outline" className="text-xs">
              edited
            </Badge>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <Input
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleEdit()}
              className="text-sm"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleEdit}>
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-800 whitespace-pre-wrap">
            {message.content}
          </div>
        )}

        {/* Reactions */}
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className="flex gap-1 mt-2">
            {Object.entries(message.reactions).map(([emoji, users]) => (
              <Button
                key={emoji}
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => onReaction(message.id, emoji)}
              >
                {emoji} {users.length}
              </Button>
            ))}
          </div>
        )}

        {/* Actions */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex gap-1 mt-2"
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onReaction(message.id, "👍")}
                    >
                      <Smile className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Add reaction</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onReply(message.id)}
                    >
                      <Reply className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Reply</TooltipContent>
                </Tooltip>

                {isOwn && (
                  <>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsEditing(true)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit message</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(message.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete message</TooltipContent>
                    </Tooltip>
                  </>
                )}
              </TooltipProvider>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// Chat area component
function ChatArea() {
  const teamChat = useTeamChat();
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  if (!teamChat) return null;

  const {
    activeRoomId,
    messages,
    rooms,
    currentUser,
    typingUsers,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    setTyping,
  } = teamChat;

  const activeRoom = rooms.find((room) => room.id === activeRoomId);
  const roomMessages = activeRoomId ? messages[activeRoomId] || [] : [];
  const typing = activeRoomId ? typingUsers[activeRoomId] || [] : [];

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [roomMessages]);

  const handleSendMessage = () => {
    if (!message.trim() || !activeRoomId) return;

    sendMessage(activeRoomId, message);
    setMessage("");
    handleTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = (typing: boolean) => {
    if (!activeRoomId) return;

    setIsTyping(typing);
    setTyping(activeRoomId, typing);

    if (typing) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        setTyping(activeRoomId, false);
      }, 3000);
    }
  };

  const handleEditMessage = (messageId: string, content: string) => {
    if (activeRoomId) {
      editMessage(activeRoomId, messageId, content);
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    if (activeRoomId) {
      deleteMessage(activeRoomId, messageId);
    }
  };

  const handleReaction = (messageId: string, emoji: string) => {
    if (activeRoomId) {
      addReaction(activeRoomId, messageId, emoji);
    }
  };

  const handleReply = (messageId: string) => {
    // Implementation for reply functionality
    console.log("Reply to message:", messageId);
  };

  if (!activeRoom) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-2">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto" />
          <h3 className="text-lg font-medium">No room selected</h3>
          <p className="text-muted-foreground">
            Select a room to start chatting with your team
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {activeRoom.type === "public" && <Hash className="h-4 w-4" />}
            {activeRoom.type === "private" && <Lock className="h-4 w-4" />}
            {activeRoom.type === "dm" && <MessageSquare className="h-4 w-4" />}
            <h2 className="font-semibold">{activeRoom.name}</h2>
          </div>
          {activeRoom.description && (
            <span className="text-sm text-muted-foreground">
              {activeRoom.description}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-xs">
            {activeRoom.members.length} members
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Members
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Room Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <LogOut className="h-4 w-4 mr-2" />
                Leave Room
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-0">
        <div className="space-y-0">
          {roomMessages.map((msg) => (
            <MessageComponent
              key={msg.id}
              message={msg}
              isOwn={msg.userId === currentUser?.id}
              onEdit={handleEditMessage}
              onDelete={handleDeleteMessage}
              onReply={handleReply}
              onReaction={handleReaction}
            />
          ))}

          {/* Typing Indicator */}
          {typing.length > 0 && (
            <div className="flex items-center gap-3 p-3 text-sm text-muted-foreground">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                />
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
              </div>
              <span>
                {typing.length === 1
                  ? "Someone is"
                  : `${typing.length} people are`}{" "}
                typing...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t">
        <div className="flex items-center space-x-2">
          <Input
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (!isTyping && e.target.value.length > 0) {
                handleTyping(true);
              }
            }}
            onKeyPress={handleKeyPress}
            placeholder={`Message #${activeRoom.name}`}
            className="flex-1"
          />
          <Button variant="ghost" size="sm">
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Member list component
function MemberList() {
  const teamChat = useTeamChat();

  if (!teamChat) return null;

  const { members, activeRoomId, rooms, isOnline } = teamChat;
  const activeRoom = rooms.find((room) => room.id === activeRoomId);
  const roomMembers = activeRoom?.members || [];

  const getRoleIcon = (role: TeamMember["role"]) => {
    switch (role) {
      case "admin":
        return <Crown className="h-3 w-3 text-yellow-600" />;
      case "manager":
        return <Shield className="h-3 w-3 text-blue-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: TeamMember["status"]) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      case "busy":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div className="w-64 bg-gray-50 border-l">
      <div className="p-4 border-b">
        <h3 className="font-semibold mb-3">Members ({roomMembers.length})</h3>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {roomMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center space-x-2 p-2 rounded hover:bg-gray-100"
            >
              <div className="relative">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={member.avatar} />
                  <AvatarFallback>
                    {member.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(member.status)}`}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1">
                  <span className="text-sm font-medium truncate">
                    {member.username}
                  </span>
                  {getRoleIcon(member.role)}
                </div>
                <div className="text-xs text-muted-foreground capitalize">
                  {member.role}
                </div>
              </div>

              {isOnline(member.id) && (
                <div className="w-2 h-2 bg-green-500 rounded-full" />
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// Main Team Chat component
export function TeamChat() {
  const { tier } = useLicense();
  const teamChat = useTeamChat();
  const [isMinimized, setIsMinimized] = useState(false);

  // Check if team chat is available
  if (tier !== "enterprise") {
    return (
      <Card className="m-4">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Team Chat
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="text-muted-foreground">
            Team Chat is available for Enterprise tier users only.
          </div>
          <Button>
            <Crown className="h-4 w-4 mr-2" />
            Upgrade to Enterprise
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!teamChat) {
    return (
      <Card className="m-4">
        <CardContent className="text-center p-8">
          <div className="text-muted-foreground">
            Team Chat is not available. Please check your connection.
          </div>
        </CardContent>
      </Card>
    );
  }

  const { connectionStatus } = teamChat;

  return (
    <div className="fixed bottom-4 right-4 z-30">
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-[800px] h-[600px] bg-white rounded-lg shadow-2xl border flex"
          >
            <RoomList />
            <ChatArea />
            <MemberList />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.div
        className="absolute bottom-0 right-0"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => setIsMinimized(!isMinimized)}
                className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
              >
                <motion.div
                  animate={{ rotate: isMinimized ? 0 : 180 }}
                  transition={{ duration: 0.3 }}
                >
                  {isMinimized ? (
                    <Users className="h-5 w-5" />
                  ) : (
                    <Minimize2 className="h-5 w-5" />
                  )}
                </motion.div>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              {isMinimized ? "Open Team Chat" : "Minimize Team Chat"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Connection Status Indicator */}
        <div className="absolute -top-1 -left-1">
          <div
            className={`w-3 h-3 rounded-full ${
              connectionStatus === "connected"
                ? "bg-green-500"
                : connectionStatus === "connecting"
                  ? "bg-yellow-500 animate-pulse"
                  : "bg-red-500"
            }`}
          />
        </div>
      </motion.div>
    </div>
  );
}
