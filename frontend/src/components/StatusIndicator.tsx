import { motion } from 'framer-motion';

interface StatusIndicatorProps {
  isConnected: boolean;
}

const StatusIndicator = ({ isConnected }: StatusIndicatorProps) => {
  return (
    <div className="flex items-center gap-2">
      <motion.div
        className={`w-2 h-2 rounded-full ${isConnected ? 'status-online' : 'status-offline'}`}
        animate={{
          scale: isConnected ? [1, 1.2, 1] : 1,
        }}
        transition={{
          duration: 2,
          repeat: isConnected ? Infinity : 0,
          ease: 'easeInOut',
        }}
      />
      <span className="text-xs text-muted-foreground">
        {isConnected ? 'ONLINE' : 'OFFLINE'}
      </span>
    </div>
  );
};

export default StatusIndicator;
