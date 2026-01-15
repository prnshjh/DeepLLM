import { useState, useCallback, useEffect } from 'react';
import { Message, ChatState } from '@/types/chat';

const STORAGE_KEY = 'deepllm-chat-history';

// IMPORTANT: base URL ONLY (no /chat, no /stream)
const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://192.168.0.124:5000';

export const useChat = () => {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    isConnected: true,
    error: null,
  });

  /* ---------------- Load chat history ---------------- */
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      const parsed: Message[] = JSON.parse(saved);
      setState(prev => ({
        ...prev,
        messages: parsed.map(m => ({
          ...m,
          timestamp: new Date(m.timestamp),
        })),
      }));
    } catch (err) {
      console.error('Failed to load chat history', err);
    }
  }, []);

  /* ---------------- Save chat history ---------------- */
  useEffect(() => {
    if (state.messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.messages));
    }
  }, [state.messages]);

  /* ---------------- Helpers ---------------- */
  const addMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    const message: Message = {
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: new Date(),
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, message],
    }));

    return message;
  }, []);

  const updateLastAssistant = useCallback((content: string, isStreaming: boolean) => {
    setState(prev => {
      const messages = [...prev.messages];
      const last = messages[messages.length - 1];

      if (last && last.role === 'assistant') {
        messages[messages.length - 1] = {
          ...last,
          content,
          isStreaming,
        };
      }

      return { ...prev, messages };
    });
  }, []);

  /* ---------------- Send message (STREAMING) ---------------- */
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || state.isLoading) return;

      addMessage('user', content);

      setState(prev => ({
        ...prev,
        messages: [
          ...prev.messages,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            isStreaming: true,
          },
        ],
        isLoading: true,
        error: null,
      }));

      try {
        const response = await fetch(`${API_BASE_URL}/chat/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: content }),
        });

        if (!response.ok || !response.body) {
          throw new Error(`Request failed: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let buffer = '';
        let fullContent = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim()) continue;

            const json = JSON.parse(line);
            if (json.response) {
              fullContent += json.response;
              updateLastAssistant(fullContent, true);
            }
          }
        }

        updateLastAssistant(fullContent, false);
        setState(prev => ({ ...prev, isLoading: false, isConnected: true }));
      } catch (err) {
        console.error('Chat error:', err);

        updateLastAssistant(
          '⚠️ Unable to connect to the AI server. Please try again later.',
          false
        );

        setState(prev => ({
          ...prev,
          isLoading: false,
          isConnected: false,
          error: 'Backend not reachable',
        }));
      }
    },
    [state.isLoading, addMessage, updateLastAssistant]
  );

  /* ---------------- Clear chat ---------------- */
  const clearChat = useCallback(() => {
    setState(prev => ({
      ...prev,
      messages: [],
      error: null,
    }));
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  /* ---------------- Health check ---------------- */
  const checkConnection = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      setState(prev => ({ ...prev, isConnected: res.ok }));
    } catch {
      setState(prev => ({ ...prev, isConnected: false }));
    }
  }, []);

  useEffect(() => {
    checkConnection();
    const id = setInterval(checkConnection, 30000);
    return () => clearInterval(id);
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