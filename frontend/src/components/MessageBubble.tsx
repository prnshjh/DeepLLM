import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { User, Bot } from 'lucide-react';
import { Message } from '@/types/chat';
import CodeBlock from './CodeBlock';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble = memo(({ message }: MessageBubbleProps) => {
  const isUser = message.role === 'user';
  const timestamp = new Date(message.timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`px-4 py-3 ${isUser ? 'message-user' : 'message-assistant'}`}
    >
      <div className="flex items-start gap-3 max-w-4xl mx-auto">
        {/* Avatar */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded flex items-center justify-center ${
            isUser
              ? 'bg-terminal-cyan/20 text-terminal-cyan'
              : 'bg-primary/20 text-primary'
          }`}
        >
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-3 mb-1">
            <span
              className={`text-sm font-medium ${
                isUser ? 'text-terminal-cyan' : 'text-primary'
              }`}
            >
              {isUser ? 'user@deepalgorithms' : 'DeepLLM'}
            </span>
            <span className="text-xs text-muted-foreground">{timestamp}</span>
          </div>

          {/* Message content */}
          <div className="prose prose-invert prose-sm max-w-none">
            {isUser ? (
              <p className="text-foreground/90 m-0 whitespace-pre-wrap">{message.content}</p>
            ) : (
              <ReactMarkdown
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const isInline = !match && !className;
                    
                    if (isInline) {
                      return (
                        <code
                          className="px-1.5 py-0.5 rounded bg-muted text-terminal-amber text-sm"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    }

                    return (
                      <CodeBlock language={match?.[1]}>
                        {String(children).replace(/\n$/, '')}
                      </CodeBlock>
                    );
                  },
                  p({ children }) {
                    return <p className="text-foreground/90 mb-3 last:mb-0">{children}</p>;
                  },
                  ul({ children }) {
                    return <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>;
                  },
                  ol({ children }) {
                    return <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>;
                  },
                  li({ children }) {
                    return <li className="text-foreground/90">{children}</li>;
                  },
                  strong({ children }) {
                    return <strong className="text-primary font-semibold">{children}</strong>;
                  },
                  em({ children }) {
                    return <em className="text-terminal-cyan">{children}</em>;
                  },
                  a({ href, children }) {
                    return (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-terminal-blue hover:underline"
                      >
                        {children}
                      </a>
                    );
                  },
                  blockquote({ children }) {
                    return (
                      <blockquote className="border-l-2 border-terminal-purple pl-4 italic text-muted-foreground">
                        {children}
                      </blockquote>
                    );
                  },
                  h1({ children }) {
                    return <h1 className="text-xl font-bold text-primary mt-4 mb-2">{children}</h1>;
                  },
                  h2({ children }) {
                    return <h2 className="text-lg font-bold text-primary mt-3 mb-2">{children}</h2>;
                  },
                  h3({ children }) {
                    return <h3 className="text-base font-bold text-primary mt-2 mb-1">{children}</h3>;
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}

            {/* Streaming cursor */}
            {message.isStreaming && (
              <span className="terminal-cursor" />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

MessageBubble.displayName = 'MessageBubble';

export default MessageBubble;
