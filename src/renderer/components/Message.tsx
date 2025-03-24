import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { decryptMessage } from '../utils/encryption';

export type MessageType = {
  id: string;
  content?: string; // Optional because might be encrypted
  encrypted_content?: string; // Encrypted content
  iv?: string; // Initialization vector for decryption
  sender: {
    id: string;
    username: string;
    username_suffix?: number;
    avatar: string;
  };
  timestamp: Date;
};

interface MessageProps {
  message: MessageType;
  isFirstInGroup: boolean;
  channelKey?: string; // Channel encryption key for decryption
}

const Message: React.FC<MessageProps> = ({ message, isFirstInGroup, channelKey }) => {
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null);
  const [decryptionError, setDecryptionError] = useState<boolean>(false);
  
  // Attempt to decrypt the message when it loads or channel key changes
  useEffect(() => {
    if (message.encrypted_content && message.iv && channelKey) {
      try {
        const content = decryptMessage(message.encrypted_content, message.iv, channelKey);
        setDecryptedContent(content);
        setDecryptionError(false);
      } catch (error) {
        console.error('Failed to decrypt message:', error);
        setDecryptionError(true);
      }
    } else if (message.content) {
      // Message is not encrypted or was sent before encryption implementation
      setDecryptedContent(message.content);
    }
  }, [message, channelKey]);
  
  const formattedTime = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(message.timestamp);
  
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(message.timestamp);
  
  // Display username with suffix if available
  const displayName = message.sender.username_suffix 
    ? `${message.sender.username}#${message.sender.username_suffix}` 
    : message.sender.username;
  
  // Content to display based on decryption status
  const contentToDisplay = decryptionError 
    ? '🔒 Encrypted message (cannot decrypt)'
    : (decryptedContent || 'Loading...');
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="message group"
    >
      {/* Show avatar and name only for the first message in a group */}
      {isFirstInGroup ? (
        <div className="flex items-start">
          <div className="flex-shrink-0 mr-4">
            {message.sender.avatar ? (
              <img
                src={message.sender.avatar}
                alt={displayName}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-discord-accent flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {message.sender.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center">
              <span className="font-medium text-white">
                {displayName}
              </span>
              <span className="ml-2 text-xs text-discord-text-muted">
                {formattedDate} {formattedTime}
              </span>
              {message.encrypted_content && (
                <span className="ml-2 text-xs text-discord-success" title="End-to-end encrypted">
                  🔒
                </span>
              )}
            </div>
            <div className="mt-1 text-discord-text-normal break-words">
              {contentToDisplay}
            </div>
          </div>
        </div>
      ) : (
        <div className="pl-14">
          <div className="text-discord-text-normal break-words group-hover:before:content-[attr(data-time)] group-hover:before:text-xs group-hover:before:text-discord-text-muted group-hover:before:mr-2" data-time={formattedTime}>
            {contentToDisplay}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Message; 