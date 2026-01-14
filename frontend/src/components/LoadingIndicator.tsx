import { motion } from 'framer-motion';

const LoadingIndicator = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-4 py-3 message-assistant"
    >
      <div className="flex items-center gap-3 max-w-4xl mx-auto">
        <div className="flex-shrink-0 w-8 h-8 rounded flex items-center justify-center bg-primary/20">
          <motion.div
            className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground">Processing</span>
          <span className="flex gap-0.5">
            <span className="loading-dot w-1 h-1 bg-primary rounded-full" />
            <span className="loading-dot w-1 h-1 bg-primary rounded-full" />
            <span className="loading-dot w-1 h-1 bg-primary rounded-full" />
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default LoadingIndicator;
