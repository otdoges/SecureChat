import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { encryptMessage } from '../utils/encryption';

interface MessageInputProps {
  channelId: string;
  channelName: string;
  onSendMessage: (content: string, encryptedContent: string) => void;
  channelKey: string;
}

const MessageInput: React.FC<MessageInputProps> = ({ 
  channelId, 
  channelName, 
  onSendMessage,
  channelKey
}) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Focus the input when the component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [channelId]);

  // Handle message submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (message.trim() === '') return;
    
    // Encrypt the message
    const encryptedContent = encryptMessage(message, channelKey);
    
    // Send the message
    onSendMessage(message, encryptedContent);
    
    // Clear the input
    setMessage('');
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Show typing indicator
    if (!isTyping && e.target.value.trim() !== '') {
      setIsTyping(true);
      // You'd typically send a "user is typing" event to the server here
    }
    
    // Stop typing indicator after 2 seconds of inactivity
    if (isTyping && e.target.value.trim() === '') {
      setIsTyping(false);
      // You'd typically send a "user stopped typing" event to the server here
    }
  };

  // Handle keyboard shortcuts (Enter to send, Shift+Enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="px-4 py-4 border-t border-discord-tertiary bg-discord-primary">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <motion.textarea
            ref={inputRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={`Message #${channelName}`}
            className="message-input resize-none max-h-60"
            rows={1}
            whileFocus={{ boxShadow: '0 0 0 2px rgba(88, 101, 242, 0.5)' }}
          />
          <div className="absolute right-3 bottom-3 flex space-x-2">
            {/* Emoji button */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="text-discord-text-muted hover:text-discord-text-normal"
            >
              😊
            </motion.button>
            
            {/* File upload button */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="text-discord-text-muted hover:text-discord-text-normal"
            >
              📎
            </motion.button>
            
            {/* Send button (only shows when there's a message) */}
            {message.trim() !== '' && (
              <motion.button
                type="submit"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="text-discord-text-normal bg-discord-accent rounded-full w-6 h-6 flex items-center justify-center"
              >
                ➤
              </motion.button>
            )}
          </div>
        </div>
        <div className="mt-1 text-xs text-discord-text-muted">
          <span className="flex items-center">
            <span className="mr-1">🔒</span>
            End-to-end encrypted
          </span>
        </div>
      </form>
    </div>
  );
};

export default MessageInput; 