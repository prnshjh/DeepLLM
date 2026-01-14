import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Message } from '@/types/chat';
import MessageBubble from './MessageBubble';
import LoadingIndicator from './LoadingIndicator';
import { Terminal } from 'lucide-react';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
}

const ChatWindow = ({ messages, isLoading }: ChatWindowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto scrollbar-thin"
    >
      {messages.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col items-center justify-center h-full px-4 py-12 text-center"
        >
          <motion.div
            className="relative mb-6"
            animate={{ 
              filter: ['drop-shadow(0 0 20px hsl(160 100% 50% / 0.3))', 'drop-shadow(0 0 40px hsl(160 100% 50% / 0.5))', 'drop-shadow(0 0 20px hsl(160 100% 50% / 0.3))']
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Terminal className="w-16 h-16 text-primary" />
          </motion.div>
          
          <h2 className="text-2xl font-bold text-primary text-glow mb-3">
            Welcome to DeepLLM
          </h2>
          
          <p className="text-muted-foreground max-w-md mb-8">
            Your private AI from Deep Algorithms Solutions
           
        
          </p>

        

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-8 text-xs text-muted-foreground/50"
          >
            <span className="text-terminal-amber">TIP:</span> Use{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground text-[10px]">Shift + Enter</kbd>
            {' '}for new line,{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground text-[10px]">Ctrl + L</kbd>
            {' '}to clear
          </motion.div>
        </motion.div>
      ) : (
        <div className="py-4">
          <AnimatePresence mode="popLayout">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </AnimatePresence>
          
          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <LoadingIndicator />
          )}
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
