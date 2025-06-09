import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      username: "System",
      avatar: "🔰",
      message: "Welcome to Scorpius Team Chat! Secure communications enabled.",
      timestamp: new Date(Date.now() - 300000),
      type: "system",
    },
    {
      id: "2",
      username: "Alice",
      avatar: "👩‍💻",
      message:
        "Just finished analyzing the latest smart contract. Found 3 critical vulnerabilities.",
      timestamp: new Date(Date.now() - 240000),
      type: "message",
    },
    {
      id: "3",
      username: "Bob",
      avatar: "🛡️",
      message:
        "Great work! I'm running the exploit simulation now. ETA 5 minutes.",
      timestamp: new Date(Date.now() - 180000),
      type: "message",
    },
    {
      id: "4",
      username: "Charlie",
      avatar: "⚡",
      message:
        "MEV bot detected unusual activity in block 18,432,156. Investigating...",
      timestamp: new Date(Date.now() - 120000),
      type: "message",
    },
  ]);

  const [onlineUsers] = useState<User[]>([
    {
      id: "1",
      username: "Alice",
      avatar: "👩‍💻",
      status: "online",
      role: "Security Analyst",
    },
    {
      id: "2",
      username: "Bob",
      avatar: "🛡️",
      status: "online",
      role: "Exploit Developer",
    },
    {
      id: "3",
      username: "Charlie",
      avatar: "⚡",
      status: "away",
      role: "MEV Specialist",
    },
    {
      id: "4",
      username: "David",
      avatar: "🔍",
      status: "busy",
      role: "Code Auditor",
    },
    {
      id: "5",
      username: "Eve",
      avatar: "🦂",
      status: "online",
      role: "Team Lead",
    },
  ]);

  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [unreadCount, setUnreadCount] = useState(2);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  // Simulate typing indicator
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.8) {
        const users = ["Alice", "Bob", "Charlie"];
        const randomUser = users[Math.floor(Math.random() * users.length)];
        setTypingUsers([randomUser]);
        setTimeout(() => setTypingUsers([]), 2000);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Simulate new messages
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const sampleMessages = [
          "Target contract deployed at 0x742d35Cc6570C4...c06fA2b6",
          "Running automated test suite on new findings",
          "Gas optimization complete - 23% reduction achieved",
          "New threat detected in DeFi protocol",
          "Flashloan attack vector identified",
        ];
        const users = ["Alice", "Bob", "Charlie", "David", "Eve"];
        const avatars = ["👩‍💻", "🛡️", "⚡", "🔍", "🦂"];

        const randomUser = users[Math.floor(Math.random() * users.length)];
        const randomAvatar = avatars[users.indexOf(randomUser)];
        const randomMessage =
          sampleMessages[Math.floor(Math.random() * sampleMessages.length)];

        const newMessage: Message = {
          id: Date.now().toString(),
          username: randomUser,
          avatar: randomAvatar,
          message: randomMessage,
          timestamp: new Date(),
          type: "message",
        };

        setMessages((prev) => [...prev, newMessage]);
        if (!isOpen) {
          setUnreadCount((prev) => prev + 1);
        }
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const sendMessage = () => {
    if (!message.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      username: user?.username || "Agent",
      avatar: "🦂",
      message: message.trim(),
      timestamp: new Date(),
      type: "message",
    };

    setMessages((prev) => [...prev, newMessage]);
    setMessage("");
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
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

  if (!isOpen) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(true)}
          className="relative p-4 rounded-full bg-gradient-to-r from-cyan-600 to-blue-700 text-white shadow-lg"
          style={{
            boxShadow: "0 0 30px rgba(0, 255, 255, 0.5)",
          }}
        >
          <MessageCircle className="w-6 h-6" />

          {/* Unread count */}
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                boxShadow: "0 0 15px rgba(255, 68, 68, 0.8)",
              }}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
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
      }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800">
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
                          {formatTime(msg.timestamp)}
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
              {typingUsers.length > 0 && (
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
                  <span>{typingUsers[0]} is typing...</span>
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
                    ref={inputRef}
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="w-full bg-gray-800 border border-gray-600 rounded-xl px-3 py-2 text-white font-mono text-sm focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={sendMessage}
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

export default WebChat;
