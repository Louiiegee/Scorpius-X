/**
 * AI Chat Context
 * Manages global AI assistant state and conversation history
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import { toast } from "sonner";
import { useApiKey } from "@/context/SettingsContext";
import { useLicense } from "@/hooks/useLicense";

// AI Models and capabilities
export const AI_MODELS = {
  "gpt-4": {
    name: "GPT-4",
    provider: "openai",
    capabilities: ["analysis", "code_review", "explanation", "debugging"],
    tier: "pro",
    maxTokens: 8192,
    costPer1kTokens: 0.03,
  },
  "gpt-3.5-turbo": {
    name: "GPT-3.5 Turbo",
    provider: "openai",
    capabilities: ["analysis", "explanation"],
    tier: "starter",
    maxTokens: 4096,
    costPer1kTokens: 0.002,
  },
  "claude-3-opus": {
    name: "Claude 3 Opus",
    provider: "anthropic",
    capabilities: ["analysis", "code_review", "security", "advanced_reasoning"],
    tier: "enterprise",
    maxTokens: 200000,
    costPer1kTokens: 0.015,
  },
  "claude-3-sonnet": {
    name: "Claude 3 Sonnet",
    provider: "anthropic",
    capabilities: ["analysis", "code_review", "explanation"],
    tier: "pro",
    maxTokens: 200000,
    costPer1kTokens: 0.003,
  },
} as const;

export type AIModelKey = keyof typeof AI_MODELS;

// Message types
export interface AIMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  metadata?: {
    model?: AIModelKey;
    tokens?: number;
    cost?: number;
    processingTime?: number;
    context?: string; // scanner, mev, bytecode, etc.
  };
}

// Conversation types
export interface AIConversation {
  id: string;
  title: string;
  messages: AIMessage[];
  model: AIModelKey;
  context: string; // Which module/feature
  createdAt: number;
  updatedAt: number;
  userId?: string;
  shared?: boolean;
}

// AI Context State
export interface AIChatState {
  conversations: AIConversation[];
  activeConversationId: string | null;
  isMinimized: boolean;
  isTyping: boolean;
  availableModels: AIModelKey[];
  currentModel: AIModelKey;
  usage: {
    tokensUsed: number;
    costToday: number;
    requestsToday: number;
    dailyLimit: number;
  };
  suggestions: string[];
}

// Default state
const DEFAULT_STATE: AIChatState = {
  conversations: [],
  activeConversationId: null,
  isMinimized: false,
  isTyping: false,
  availableModels: ["gpt-3.5-turbo"],
  currentModel: "gpt-3.5-turbo",
  usage: {
    tokensUsed: 0,
    costToday: 0,
    requestsToday: 0,
    dailyLimit: 100,
  },
  suggestions: [
    "Analyze this smart contract for vulnerabilities",
    "Explain this MEV opportunity",
    "Review this bytecode for potential issues",
    "Help me understand this transaction flow",
    "Identify security risks in this code",
  ],
};

// Action types
type AIChatAction =
  | { type: "SET_CONVERSATIONS"; payload: AIConversation[] }
  | { type: "ADD_CONVERSATION"; payload: AIConversation }
  | {
      type: "UPDATE_CONVERSATION";
      payload: { id: string; conversation: Partial<AIConversation> };
    }
  | { type: "DELETE_CONVERSATION"; payload: string }
  | { type: "SET_ACTIVE_CONVERSATION"; payload: string | null }
  | {
      type: "ADD_MESSAGE";
      payload: { conversationId: string; message: AIMessage };
    }
  | { type: "SET_MINIMIZED"; payload: boolean }
  | { type: "SET_TYPING"; payload: boolean }
  | { type: "SET_CURRENT_MODEL"; payload: AIModelKey }
  | { type: "SET_AVAILABLE_MODELS"; payload: AIModelKey[] }
  | { type: "UPDATE_USAGE"; payload: Partial<AIChatState["usage"]> }
  | { type: "SET_SUGGESTIONS"; payload: string[] };

// Reducer
function aiChatReducer(state: AIChatState, action: AIChatAction): AIChatState {
  switch (action.type) {
    case "SET_CONVERSATIONS":
      return { ...state, conversations: action.payload };

    case "ADD_CONVERSATION":
      return {
        ...state,
        conversations: [action.payload, ...state.conversations],
        activeConversationId: action.payload.id,
      };

    case "UPDATE_CONVERSATION":
      return {
        ...state,
        conversations: state.conversations.map((conv) =>
          conv.id === action.payload.id
            ? { ...conv, ...action.payload.conversation, updatedAt: Date.now() }
            : conv,
        ),
      };

    case "DELETE_CONVERSATION":
      const newConversations = state.conversations.filter(
        (conv) => conv.id !== action.payload,
      );
      return {
        ...state,
        conversations: newConversations,
        activeConversationId:
          state.activeConversationId === action.payload
            ? newConversations[0]?.id || null
            : state.activeConversationId,
      };

    case "SET_ACTIVE_CONVERSATION":
      return { ...state, activeConversationId: action.payload };

    case "ADD_MESSAGE":
      return {
        ...state,
        conversations: state.conversations.map((conv) =>
          conv.id === action.payload.conversationId
            ? {
                ...conv,
                messages: [...conv.messages, action.payload.message],
                updatedAt: Date.now(),
              }
            : conv,
        ),
      };

    case "SET_MINIMIZED":
      return { ...state, isMinimized: action.payload };

    case "SET_TYPING":
      return { ...state, isTyping: action.payload };

    case "SET_CURRENT_MODEL":
      return { ...state, currentModel: action.payload };

    case "SET_AVAILABLE_MODELS":
      return { ...state, availableModels: action.payload };

    case "UPDATE_USAGE":
      return {
        ...state,
        usage: { ...state.usage, ...action.payload },
      };

    case "SET_SUGGESTIONS":
      return { ...state, suggestions: action.payload };

    default:
      return state;
  }
}

// Context interface
interface AIChatContextType extends AIChatState {
  sendMessage: (message: string, context?: string) => Promise<void>;
  createConversation: (title: string, context: string) => string;
  deleteConversation: (id: string) => void;
  setActiveConversation: (id: string | null) => void;
  toggleMinimized: () => void;
  setCurrentModel: (model: AIModelKey) => void;
  clearHistory: () => void;
  exportConversation: (id: string) => string;
  getModelCapabilities: (model: AIModelKey) => string[];
  canUseModel: (model: AIModelKey) => boolean;
}

// Create context
const AIChatContext = createContext<AIChatContextType | null>(null);

// AI Chat provider component
interface AIChatProviderProps {
  children: ReactNode;
}

export function AIChatProvider({ children }: AIChatProviderProps) {
  const [state, dispatch] = useReducer(aiChatReducer, DEFAULT_STATE);
  const { tier } = useLicense();
  const openaiKey = useApiKey("openai");
  const anthropicKey = useApiKey("anthropic");

  // Update available models based on API keys and tier
  useEffect(() => {
    const available: AIModelKey[] = [];

    if (openaiKey) {
      available.push("gpt-3.5-turbo");
      if (tier === "pro" || tier === "enterprise") {
        available.push("gpt-4");
      }
    }

    if (anthropicKey) {
      if (tier === "pro" || tier === "enterprise") {
        available.push("claude-3-sonnet");
      }
      if (tier === "enterprise") {
        available.push("claude-3-opus");
      }
    }

    dispatch({ type: "SET_AVAILABLE_MODELS", payload: available });

    // Set default model if current one is not available
    if (!available.includes(state.currentModel) && available.length > 0) {
      dispatch({ type: "SET_CURRENT_MODEL", payload: available[0] });
    }
  }, [openaiKey, anthropicKey, tier, state.currentModel]);

  // Mock AI API call
  const callAI = async (
    messages: AIMessage[],
    model: AIModelKey,
  ): Promise<string> => {
    // In real implementation, this would call the actual AI API
    await new Promise((resolve) =>
      setTimeout(resolve, 1000 + Math.random() * 2000),
    );

    const responses = [
      "I'll analyze this for potential vulnerabilities. Based on the code structure, I can see several areas that require attention...",
      "This contract shows some interesting patterns. Let me break down the key security considerations...",
      "Looking at this transaction flow, I notice some potential MEV opportunities and risks...",
      "The bytecode analysis reveals some optimization opportunities and potential security concerns...",
      "Based on my analysis, here are the main findings and recommendations...",
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  };

  // Send message function
  const sendMessage = async (content: string, context = "general") => {
    let conversationId = state.activeConversationId;

    // Create new conversation if none exists
    if (!conversationId) {
      conversationId = createConversation("New Chat", context);
    }

    const userMessage: AIMessage = {
      id: `msg_${Date.now()}_${Math.random()}`,
      role: "user",
      content,
      timestamp: Date.now(),
      metadata: { context },
    };

    // Add user message
    dispatch({
      type: "ADD_MESSAGE",
      payload: { conversationId, message: userMessage },
    });

    dispatch({ type: "SET_TYPING", payload: true });

    try {
      const conversation = state.conversations.find(
        (c) => c.id === conversationId,
      );
      const messages = conversation
        ? [...conversation.messages, userMessage]
        : [userMessage];

      const response = await callAI(messages, state.currentModel);

      const assistantMessage: AIMessage = {
        id: `msg_${Date.now()}_${Math.random()}`,
        role: "assistant",
        content: response,
        timestamp: Date.now(),
        metadata: {
          model: state.currentModel,
          tokens: Math.floor(response.length / 4), // Rough estimate
          context,
        },
      };

      dispatch({
        type: "ADD_MESSAGE",
        payload: { conversationId, message: assistantMessage },
      });

      // Update usage
      dispatch({
        type: "UPDATE_USAGE",
        payload: {
          tokensUsed:
            state.usage.tokensUsed + (assistantMessage.metadata?.tokens || 0),
          requestsToday: state.usage.requestsToday + 1,
        },
      });
    } catch (error) {
      console.error("AI request failed:", error);
      toast.error("Failed to get AI response. Please try again.");
    } finally {
      dispatch({ type: "SET_TYPING", payload: false });
    }
  };

  // Create new conversation
  const createConversation = (title: string, context: string): string => {
    const conversation: AIConversation = {
      id: `conv_${Date.now()}_${Math.random()}`,
      title,
      messages: [],
      model: state.currentModel,
      context,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    dispatch({ type: "ADD_CONVERSATION", payload: conversation });
    return conversation.id;
  };

  // Delete conversation
  const deleteConversation = (id: string) => {
    dispatch({ type: "DELETE_CONVERSATION", payload: id });
    toast.success("Conversation deleted");
  };

  // Set active conversation
  const setActiveConversation = (id: string | null) => {
    dispatch({ type: "SET_ACTIVE_CONVERSATION", payload: id });
  };

  // Toggle minimized state
  const toggleMinimized = () => {
    dispatch({ type: "SET_MINIMIZED", payload: !state.isMinimized });
  };

  // Set current model
  const setCurrentModel = (model: AIModelKey) => {
    if (canUseModel(model)) {
      dispatch({ type: "SET_CURRENT_MODEL", payload: model });
      toast.success(`Switched to ${AI_MODELS[model].name}`);
    } else {
      toast.error(
        `${AI_MODELS[model].name} requires ${AI_MODELS[model].tier} tier or API key`,
      );
    }
  };

  // Clear all history
  const clearHistory = () => {
    dispatch({ type: "SET_CONVERSATIONS", payload: [] });
    dispatch({ type: "SET_ACTIVE_CONVERSATION", payload: null });
    toast.success("Chat history cleared");
  };

  // Export conversation
  const exportConversation = (id: string): string => {
    const conversation = state.conversations.find((c) => c.id === id);
    if (!conversation) return "";

    return JSON.stringify(conversation, null, 2);
  };

  // Get model capabilities
  const getModelCapabilities = (model: AIModelKey): string[] => {
    return AI_MODELS[model].capabilities;
  };

  // Check if user can use specific model
  const canUseModel = (model: AIModelKey): boolean => {
    const modelInfo = AI_MODELS[model];

    // Check API key availability
    const hasApiKey =
      modelInfo.provider === "openai" ? !!openaiKey : !!anthropicKey;
    if (!hasApiKey) return false;

    // Check tier requirements
    const tierOrder = ["community", "starter", "pro", "enterprise"];
    const userTierIndex = tierOrder.indexOf(tier);
    const requiredTierIndex = tierOrder.indexOf(modelInfo.tier);

    return userTierIndex >= requiredTierIndex;
  };

  const value: AIChatContextType = {
    ...state,
    sendMessage,
    createConversation,
    deleteConversation,
    setActiveConversation,
    toggleMinimized,
    setCurrentModel,
    clearHistory,
    exportConversation,
    getModelCapabilities,
    canUseModel,
  };

  return (
    <AIChatContext.Provider value={value}>{children}</AIChatContext.Provider>
  );
}

// Custom hook to use AI chat
export function useAIChat(): AIChatContextType {
  const context = useContext(AIChatContext);
  if (!context) {
    throw new Error("useAIChat must be used within an AIChatProvider");
  }
  return context;
}
