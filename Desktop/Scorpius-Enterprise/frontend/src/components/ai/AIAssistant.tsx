/**
 * AI Assistant Component
 * Floating AI chat interface that appears at the top of the page
 */

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  MessageCircle,
  X,
  Send,
  Minimize2,
  Maximize2,
  Trash2,
  Download,
  Settings,
  Brain,
  Zap,
  Crown,
  Shield,
  Sparkles,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Plus,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAIChat, AI_MODELS, AIModelKey } from "@/context/AIChatContext";
import { toast } from "sonner";

// Message component
interface MessageProps {
  message: {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: number;
    metadata?: any;
  };
  onCopy: (content: string) => void;
  onFeedback: (messageId: string, type: "up" | "down") => void;
}

function Message({ message, onCopy, onFeedback }: MessageProps) {
  const isUser = message.role === "user";
  const [showActions, setShowActions] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 p-3 ${!isUser ? "bg-gray-50" : ""} rounded-lg`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"
        }`}
      >
        {isUser ? (
          <div className="w-5 h-5 bg-blue-600 rounded-full" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium">
            {isUser ? "You" : "Scorpius AI"}
          </span>
          <div className="flex items-center space-x-1">
            {message.metadata?.model && (
              <Badge variant="secondary" className="text-xs">
                {AI_MODELS[message.metadata.model as AIModelKey]?.name}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {new Date(message.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>

        <div className="text-sm text-gray-800 whitespace-pre-wrap">
          {message.content}
        </div>

        {/* Metadata */}
        {message.metadata && (
          <div className="flex items-center space-x-2 mt-2 text-xs text-muted-foreground">
            {message.metadata.tokens && (
              <span>{message.metadata.tokens} tokens</span>
            )}
            {message.metadata.processingTime && (
              <span>{message.metadata.processingTime}ms</span>
            )}
            {message.metadata.context && (
              <Badge variant="outline" className="text-xs">
                {message.metadata.context}
              </Badge>
            )}
          </div>
        )}

        {/* Actions */}
        <AnimatePresence>
          {showActions && !isUser && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center space-x-1 mt-2"
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onCopy(message.content)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy message</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onFeedback(message.id, "up")}
                    >
                      <ThumbsUp className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Good response</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onFeedback(message.id, "down")}
                    >
                      <ThumbsDown className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Poor response</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// Model selector
function ModelSelector() {
  const { currentModel, availableModels, setCurrentModel, canUseModel } =
    useAIChat();

  const getModelIcon = (model: AIModelKey) => {
    const modelInfo = AI_MODELS[model];
    switch (modelInfo.tier) {
      case "community":
        return <Sparkles className="h-3 w-3" />;
      case "starter":
        return <Zap className="h-3 w-3" />;
      case "pro":
        return <Crown className="h-3 w-3" />;
      case "enterprise":
        return <Shield className="h-3 w-3" />;
      default:
        return <Brain className="h-3 w-3" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "community":
        return "text-gray-600";
      case "starter":
        return "text-blue-600";
      case "pro":
        return "text-purple-600";
      case "enterprise":
        return "text-orange-600";
      default:
        return "text-gray-600";
    }
  };

  if (availableModels.length === 0) {
    return (
      <div className="text-xs text-muted-foreground p-2 text-center">
        No AI models available. Please configure API keys in settings.
      </div>
    );
  }

  return (
    <Select
      value={currentModel}
      onValueChange={(value) => setCurrentModel(value as AIModelKey)}
    >
      <SelectTrigger className="h-8 text-xs">
        <div className="flex items-center space-x-1">
          {getModelIcon(currentModel)}
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(AI_MODELS).map(([key, model]) => {
          const canUse = canUseModel(key as AIModelKey);
          return (
            <SelectItem
              key={key}
              value={key}
              disabled={!canUse}
              className={!canUse ? "opacity-50" : ""}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2">
                  <span className={getTierColor(model.tier)}>
                    {getModelIcon(key as AIModelKey)}
                  </span>
                  <span>{model.name}</span>
                </div>
                <Badge variant="outline" className="text-xs ml-2">
                  {model.tier}
                </Badge>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

// Quick suggestions
function QuickSuggestions() {
  const { suggestions, sendMessage } = useAIChat();
  const [showAll, setShowAll] = useState(false);

  const displaySuggestions = showAll ? suggestions : suggestions.slice(0, 3);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Quick Suggestions
        </span>
        {suggestions.length > 3 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="h-6 text-xs"
          >
            {showAll ? "Show Less" : "Show All"}
            <ChevronDown
              className={`h-3 w-3 ml-1 transition-transform ${showAll ? "rotate-180" : ""}`}
            />
          </Button>
        )}
      </div>
      <div className="grid gap-1">
        {displaySuggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            onClick={() => sendMessage(suggestion)}
            className="justify-start h-auto p-2 text-xs text-left whitespace-normal"
          >
            {suggestion}
          </Button>
        ))}
      </div>
    </div>
  );
}

// Main AI Assistant component
export function AIAssistant() {
  const {
    conversations,
    activeConversationId,
    isMinimized,
    isTyping,
    toggleMinimized,
    sendMessage,
    createConversation,
    clearHistory,
    usage,
  } = useAIChat();

  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId,
  );

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const currentMessage = message;
    setMessage("");
    setShowSuggestions(false);

    await sendMessage(currentMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Message copied to clipboard");
  };

  const handleFeedback = (messageId: string, type: "up" | "down") => {
    toast.success(`Feedback received! This helps improve our AI.`);
  };

  const handleNewChat = () => {
    createConversation("New Chat", "general");
    setMessage("");
    setShowSuggestions(true);
  };

  return (
    <>
      {/* Floating AI Button */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed top-4 right-4 z-50"
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => setIsOpen(!isOpen)}
                className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg border-0"
              >
                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {isOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Bot className="h-5 w-5" />
                  )}
                </motion.div>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              {isOpen ? "Close AI Assistant" : "Open AI Assistant"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </motion.div>

      {/* AI Chat Interface */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="fixed top-20 right-4 z-40 w-80 md:w-96"
          >
            <Card className="shadow-2xl border-purple-200">
              {/* Header */}
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">Scorpius AI</CardTitle>
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span>Online</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button variant="ghost" size="sm" onClick={toggleMinimized}>
                      {isMinimized ? (
                        <Maximize2 className="h-4 w-4" />
                      ) : (
                        <Minimize2 className="h-4 w-4" />
                      )}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleNewChat}>
                          <Plus className="h-4 w-4 mr-2" />
                          New Chat
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={clearHistory}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Clear History
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          Export Chat
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Model Selector */}
                <div className="space-y-2">
                  <ModelSelector />

                  {/* Usage Stats */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{usage.requestsToday} requests today</span>
                    <span>{usage.tokensUsed} tokens used</span>
                  </div>
                </div>
              </CardHeader>

              {/* Chat Content */}
              <AnimatePresence>
                {!isMinimized && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <CardContent className="p-0">
                      {/* Messages */}
                      <ScrollArea className="h-64 p-3">
                        {activeConversation?.messages.length === 0 &&
                        showSuggestions ? (
                          <QuickSuggestions />
                        ) : (
                          <div className="space-y-3">
                            {activeConversation?.messages.map((msg) => (
                              <Message
                                key={msg.id}
                                message={msg}
                                onCopy={handleCopyMessage}
                                onFeedback={handleFeedback}
                              />
                            ))}
                            {isTyping && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center space-x-2 p-3"
                              >
                                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                  <Bot className="h-4 w-4 text-purple-600" />
                                </div>
                                <div className="flex space-x-1">
                                  <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" />
                                  <div
                                    className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"
                                    style={{ animationDelay: "0.1s" }}
                                  />
                                  <div
                                    className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"
                                    style={{ animationDelay: "0.2s" }}
                                  />
                                </div>
                              </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                          </div>
                        )}
                      </ScrollArea>

                      <Separator />

                      {/* Input */}
                      <div className="p-3">
                        <div className="flex items-center space-x-2">
                          <Input
                            ref={inputRef}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Ask me anything about blockchain security..."
                            className="flex-1 border-0 focus-visible:ring-1"
                            disabled={isTyping}
                          />
                          <Button
                            onClick={handleSendMessage}
                            disabled={!message.trim() || isTyping}
                            size="sm"
                            className="px-3"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
