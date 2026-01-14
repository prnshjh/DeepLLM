import { useState, useRef, useCallback, KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2 } from 'lucide-react';

interface TerminalInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  onClearChat: () => void;
}

const TerminalInput = ({ onSend, isLoading, onClearChat }: TerminalInputProps) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    if (input.trim() && !isLoading) {
      onSend(input.trim());
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  }, [input, isLoading, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // Ctrl + L to clear chat
      if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        onClearChat();
        return;
      }

      // Enter to send (Shift + Enter for new line)
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit, onClearChat]
  );

  const handleInput = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, []);

  return (
    <div className="border-t border-border/50 bg-card/80 backdrop-blur-sm p-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="flex items-end gap-3 glow-border rounded-lg p-3 bg-input/50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Prompt prefix */}
          <div className="flex-shrink-0 pb-1">
          
            <span className="text-terminal-cyan ml-1">$</span>
          </div>

          {/* Input area */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder="Enter command..."
            disabled={isLoading}
            rows={1}
            className="flex-1 bg-transparent border-none outline-none resize-none text-foreground placeholder-muted-foreground text-sm min-h-[24px] max-h-[200px]"
            style={{ lineHeight: '1.5' }}
          />

          {/* Send button */}
          <motion.button
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 p-2 rounded btn-terminal disabled:opacity-30 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </motion.button>
        </motion.div>

       
        
        
      </div>
    </div>
  );
};

export default TerminalInput;
