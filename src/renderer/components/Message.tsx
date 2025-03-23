import React from 'react';
import { motion } from 'framer-motion';

export type MessageType = {
  id: string;
  content: string;
  sender: {
    id: string;
    username: string;
    avatar: string;
  };
  timestamp: Date;
  isEncrypted: boolean;
};

interface MessageProps {
  message: MessageType;
  isFirstInGroup: boolean;
}

const Message: React.FC<MessageProps> = ({ message, isFirstInGroup }) => {
  const formattedTime = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(message.timestamp);
  
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(message.timestamp);
  
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
                alt={message.sender.username}
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
                {message.sender.username}
              </span>
              <span className="ml-2 text-xs text-discord-text-muted">
                {formattedDate} {formattedTime}
              </span>
              {message.isEncrypted && (
                <span className="ml-2 text-xs text-discord-success" title="End-to-end encrypted">
                  🔒
                </span>
              )}
            </div>
            <div className="mt-1 text-discord-text-normal break-words">
              {message.content}
            </div>
          </div>
        </div>
      ) : (
        <div className="pl-14">
          <div className="text-discord-text-normal break-words group-hover:before:content-[attr(data-time)] group-hover:before:text-xs group-hover:before:text-discord-text-muted group-hover:before:mr-2" data-time={formattedTime}>
            {message.content}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Message; 