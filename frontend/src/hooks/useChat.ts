import { useState, useCallback, useEffect } from 'react';
import { Message, ChatState } from '@/types/chat';

const STORAGE_KEY = 'deepllm-chat-history';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://192.168.0.124:5000';

export const useChat = () => {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    isConnected: true,
    error: null,
  });

  // Load messages from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState(prev => ({
          ...prev,
          messages: parsed.map((m: Message) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          })),
        }));
      } catch (e) {
        console.error('Failed to parse saved messages:', e);
      }
    }
  }, []);

  // Save messages to localStorage
  useEffect(() => {
    if (state.messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.messages));
    }
  }, [state.messages]);

  const addMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    const newMessage: Message = {
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: new Date(),
    };
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage],
    }));
    return newMessage;
  }, []);

  const updateLastMessage = useCallback((content: string, isStreaming: boolean = false) => {
    setState(prev => {
      const messages = [...prev.messages];
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.role === 'assistant') {
        messages[messages.length - 1] = {
          ...lastMessage,
          content,
          isStreaming,
        };
      }
      return { ...prev, messages };
    });
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || state.isLoading) return;

    // Add user message
    addMessage('user', content);

    // Add placeholder for assistant
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, assistantMessage],
      isLoading: true,
      error: null,
    }));

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          history: state.messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;
          updateLastMessage(fullContent, true);
        }
      }

      updateLastMessage(fullContent, false);
      setState(prev => ({ ...prev, isLoading: false, isConnected: true }));
    } catch (error) {
      console.error('Chat error:', error);
      
      // For demo purposes, simulate a response if backend is not available
      const demoResponse = `I received your message: "${content}"\n\nHowever, I'm currently running in demo mode because the backend server is not connected. To fully use DeepLLM, please ensure:\n\n\`\`\`bash\n# Your Flask backend is running on\n${API_BASE_URL}\n\`\`\`\n\nOnce connected, I'll be able to provide responses.`;
      
      updateLastMessage(demoResponse, false);
      setState(prev => ({
        ...prev,
        isLoading: false,
        isConnected: false,
        error: 'Backend not connected - running in demo mode',
      }));
    }
  }, [state.messages, state.isLoading, addMessage, updateLastMessage]);

  const clearChat = useCallback(() => {
    setState(prev => ({
      ...prev,
      messages: [],
      error: null,
    }));
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const checkConnection = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      setState(prev => ({ ...prev, isConnected: response.ok }));
    } catch {
      setState(prev => ({ ...prev, isConnected: false }));
    }
  }, []);

  // Check connection periodically
  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, [checkConnection]);

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    isConnected: state.isConnected,
    error: state.error,
    sendMessage,
    clearChat,
  };
};
