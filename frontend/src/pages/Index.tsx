import { useEffect } from 'react';
import Header from '@/components/Header';
import ChatWindow from '@/components/ChatWindow';
import TerminalInput from '@/components/TerminalInput';
import { useChat } from '@/hooks/useChat';

const Index = () => {
  const { messages, isLoading, isConnected, sendMessage, clearChat } = useChat();

  // Global keyboard shortcut for Ctrl+L
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        clearChat();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearChat]);

  return (
    <div className="flex flex-col h-screen bg-background grid-bg scanlines overflow-hidden">
      <Header isConnected={isConnected} onClearChat={clearChat} />
      
      <ChatWindow messages={messages} isLoading={isLoading} />
      
      <TerminalInput
        onSend={sendMessage}
        isLoading={isLoading}
        onClearChat={clearChat}
      />
    </div>
  );
};

export default Index;
