import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  Send,
  X,
  Users,
  Minimize2,
  Maximize2,
  Paperclip,
  Smile,
  MoreVertical,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWebSocket } from "@/hooks/useWebSocket";

interface Message {
  id: string;
  username: string;
  avatar: string;
  message: string;
  timestamp: Date;
  type: "message" | "system" | "file";
  reactions?: { emoji: string; users: string[] }[];
}

interface User {
  id: string;
  username: string;
  avatar: string;
  status: "online" | "away" | "busy" | "offline";
  role: string;
}

const WebChat = () => {
  const { user } = useAuth();
  const {
    isConnected,
    messages: wsMessages,
    onlineUsers: wsOnlineUsers,
    sendMessage,
    sendTyping,
  } = useWebSocket();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Convert WebSocket messages to local format
  const messages: Message[] = wsMessages.map((msg) => ({
    ...msg,
    timestamp: new Date(msg.timestamp),
  }));

  // Convert WebSocket users to local format
  const onlineUsers: User[] = wsOnlineUsers.map((user) => ({
    ...user,
    status: user.status as "online" | "away" | "busy" | "offline",
  }));

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (message.trim() && isConnected) {
      sendMessage(message.trim());
      setMessage("");
      setIsTyping(false);
      sendTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = (value: string) => {
    setMessage(value);

    if (!isTyping && value.length > 0) {
      setIsTyping(true);
      sendTyping(true);
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTyping(false);
    }, 1000);
  };

  if (!isOpen) {
    return (
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.1}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={(event, info) => {
          setIsDragging(false);
          setPosition({ x: info.point.x, y: info.point.y });
        }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-6 right-6 z-50 cursor-move"
        style={{
          x: position.x,
          y: position.y,
        }}
      >
        <motion.button
          whileHover={!isDragging ? { scale: 1.1 } : {}}
          whileTap={!isDragging ? { scale: 0.9 } : {}}
          onClick={(e) => {
            if (!isDragging) {
              setIsOpen(true);
            }
            e.preventDefault();
          }}
          className="relative p-4 rounded-full bg-gradient-to-r from-cyan-600 to-blue-700 text-white shadow-lg"
          style={{
            boxShadow: "0 0 30px rgba(0, 255, 255, 0.5)",
            pointerEvents: isDragging ? "none" : "auto",
          }}
        >
          <MessageCircle className="w-6 h-6" />

          {/* Unread count */}
          {wsMessages.length > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                boxShadow: "0 0 15px rgba(255, 68, 68, 0.8)",
              }}
            >
              {wsMessages.length > 99 ? "99+" : wsMessages.length}
            </motion.div>
          )}

          {/* Online pulse */}
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.7, 0, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-green-400"
          />
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.1}
      dragConstraints={{
        top: -window.innerHeight + 100,
        left: -window.innerWidth + 100,
        right: window.innerWidth - 100,
        bottom: window.innerHeight - 100,
      }}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(event, info) => {
        setIsDragging(false);
        setPosition({ x: info.point.x, y: info.point.y });
      }}
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        height: isMinimized ? 60 : 500,
        width: isMinimized ? 250 : 400,
      }}
      className="fixed bottom-6 right-6 z-50 bg-black/95 border-2 border-cyan-500/50 rounded-2xl overflow-hidden"
      style={{
        boxShadow:
          "0 0 40px rgba(0, 255, 255, 0.3), inset 0 0 20px rgba(0, 255, 255, 0.1)",
        backdropFilter: "blur(20px)",
        x: position.x,
        y: position.y,
        cursor: isDragging ? "grabbing" : "grab",
      }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800 cursor-move">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Users className="w-5 h-5 text-cyan-400" />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full"
              />
            </div>
            <div>
              <h3 className="font-mono font-bold text-white text-sm">
                Team Chat
              </h3>
              <p className="font-mono text-xs text-gray-400">
                {onlineUsers.filter((u) => u.status === "online").length} online
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-cyan-400 transition-colors"
            >
              {isMinimized ? (
                <Maximize2 className="w-4 h-4" />
              ) : (
                <Minimize2 className="w-4 h-4" />
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-red-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col h-96"
          >
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${msg.type === "system" ? "justify-center" : ""}`}
                >
                  {msg.type !== "system" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-sm flex-shrink-0">
                      {msg.avatar}
                    </div>
                  )}

                  <div
                    className={`flex-1 ${msg.type === "system" ? "text-center" : ""}`}
                  >
                    {msg.type !== "system" && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-cyan-400">
                          {msg.username}
                        </span>
                        <span className="font-mono text-xs text-gray-500">
                          {msg.timestamp.toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          })}
                        </span>
                      </div>
                    )}

                    <div
                      className={`font-mono text-xs leading-relaxed ${
                        msg.type === "system"
                          ? "text-green-400 bg-green-900/20 px-3 py-1 rounded-lg inline-block"
                          : "text-gray-200"
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-xs text-gray-400 font-mono"
                >
                  <div className="flex gap-1">
                    {[1, 2, 3].map((dot) => (
                      <motion.div
                        key={dot}
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          delay: dot * 0.1,
                        }}
                        className="w-1 h-1 bg-cyan-400 rounded-full"
                      />
                    ))}
                  </div>
                  <span>{user.username} is typing...</span>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Online Users */}
            <div className="px-4 py-2 border-t border-gray-700">
              <div className="flex items-center gap-2 overflow-x-auto">
                {onlineUsers.slice(0, 6).map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-1 bg-gray-800/50 rounded-lg px-2 py-1 flex-shrink-0"
                  >
                    <div className="relative">
                      <span className="text-xs">{user.avatar}</span>
                      <div
                        className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-black"
                        style={{ backgroundColor: getStatusColor(user.status) }}
                      />
                    </div>
                    <span className="font-mono text-xs text-gray-300">
                      {user.username}
                    </span>
                  </div>
                ))}
                {onlineUsers.length > 6 && (
                  <span className="font-mono text-xs text-gray-500">
                    +{onlineUsers.length - 6}
                  </span>
                )}
              </div>
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-700">
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => handleTyping(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="w-full bg-gray-800 border border-gray-600 rounded-xl px-3 py-2 text-white font-mono text-sm focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  className="p-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "online":
      return "#00ff88";
    case "away":
      return "#ffaa00";
    case "busy":
      return "#ff4444";
    default:
      return "#666666";
  }
};

export default WebChat;
