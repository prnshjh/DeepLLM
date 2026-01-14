import { Terminal, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import StatusIndicator from './StatusIndicator';

interface HeaderProps {
  isConnected: boolean;
  onClearChat: () => void;
}

const Header = ({ isConnected, onClearChat }: HeaderProps) => {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card/50 backdrop-blur-sm">
      <motion.div 
        className="flex items-center gap-3"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative">
          <Terminal className="w-6 h-6 text-primary" />
          <motion.div
            className="absolute inset-0 text-primary blur-sm opacity-50"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Terminal className="w-6 h-6" />
          </motion.div>
        </div>
        <div>
          <h1 className="text-lg font-semibold text-primary text-glow-subtle tracking-wider">
            DeepLLM
          </h1>
        </div>
      </motion.div>

      <div className="flex items-center gap-4">
        <StatusIndicator isConnected={isConnected} />
        
        <motion.button
          onClick={onClearChat}
          className="btn-terminal btn-terminal-danger p-2 rounded"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Clear chat (Ctrl+L)"
        >
          <Trash2 className="w-4 h-4" />
        </motion.button>
      </div>
    </header>
  );
};

export default Header;
