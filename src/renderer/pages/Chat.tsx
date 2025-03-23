import React, { useState, useEffect } from 'react';
import { Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as pbClient from '../utils/pocketbaseClient';

// Components
import Sidebar from '../components/Sidebar';
import Message, { MessageType } from '../components/Message';
import MessageInput from '../components/MessageInput';

// Utilities
import { useAuth } from '../utils/AuthContext';
import { generateChannelKey, retrieveUserKey, decryptMessage } from '../utils/encryption';

// Declare window.env for TypeScript
declare global {
  interface Window {
    env: {
      POCKETBASE_URL: string;
    }
  }
}

// Mock data for messages (would come from PocketBase in a real app)
const mockMessages: Record<string, MessageType[]> = {
  '101': [
    {
      id: '1',
      content: 'Welcome to SecureChat!',
      sender: {
        id: 'system',
        username: 'System',
        avatar: '',
      },
      timestamp: new Date(Date.now() - 86400000), // 1 day ago
      isEncrypted: true,
    },
    {
      id: '2',
      content: 'This is a secure, end-to-end encrypted chat app.',
      sender: {
        id: 'system',
        username: 'System',
        avatar: '',
      },
      timestamp: new Date(Date.now() - 86400000 + 5000),
      isEncrypted: true,
    },
  ],
  '102': [
    {
      id: '3',
      content: 'Hey everyone! How are you doing?',
      sender: {
        id: 'user1',
        username: 'Alice',
        avatar: '',
      },
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      isEncrypted: true,
    },
    {
      id: '4',
      content: 'I\'m doing great! Just testing out this new chat app.',
      sender: {
        id: 'user2',
        username: 'Bob',
        avatar: '',
      },
      timestamp: new Date(Date.now() - 3000000), // 50 minutes ago
      isEncrypted: true,
    },
  ],
};

const ChannelView = () => {
  const { serverId, channelId } = useParams<{ serverId: string; channelId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [channelName, setChannelName] = useState('');
  const [channelKey, setChannelKey] = useState('');
  
  // If no channel is selected, redirect to general chat
  useEffect(() => {
    if (!channelId && serverId) {
      const defaultChannelId = serverId === '1' ? '101' : 
                             serverId === '2' ? '201' : 
                             serverId === '3' ? '301' : '101';
      navigate(`/channels/${serverId}/${defaultChannelId}`);
    }
  }, [channelId, serverId, navigate]);
  
  // Fetch channel data and messages
  useEffect(() => {
    if (channelId) {
      // In a real app, you would fetch the channel data from PocketBase
      const mockChannelName = 
        channelId === '101' ? 'welcome' :
        channelId === '102' ? 'general-chat' :
        channelId === '103' ? 'voice-chat' :
        channelId === '201' ? 'gaming-chat' :
        channelId === '202' ? 'fortnite' :
        channelId === '203' ? 'minecraft' :
        channelId === '301' ? 'javascript' :
        channelId === '302' ? 'python' :
        channelId === '303' ? 'react' : 'unknown';
      
      setChannelName(mockChannelName);
      
      // Generate channel encryption key
      const userKey = retrieveUserKey(localStorage.getItem('userPassword') || '') || '';
      if (userKey) {
        const newChannelKey = generateChannelKey(channelId, userKey);
        setChannelKey(newChannelKey);
      }
      
      // Fetch messages for the channel
      setMessages(mockMessages[channelId] || []);
      
      // In a real app, you would subscribe to new messages
      // This could be done with PocketBase realtime subscriptions
    }
  }, [channelId]);
  
  // Handle sending a new message
  const handleSendMessage = (content: string, encryptedContent: string) => {
    if (!user || !channelId) return;
    
    const newMessage: MessageType = {
      id: Date.now().toString(),
      content,
      sender: {
        id: user.id,
        username: user.user_metadata?.username || 'User',
        avatar: user.user_metadata?.avatar_url || '',
      },
      timestamp: new Date(),
      isEncrypted: true,
    };
    
    // Add message to local state
    setMessages(prev => [...prev, newMessage]);
    
    // In a real app, you would send the encrypted message to PocketBase
    // const { error } = await pbClient.collection('messages').create({
    //   channel_id: channelId,
    //   user_id: user.id,
    //   content: encryptedContent,
    //   created_at: new Date(),
    // });
  };
  
  // Group messages by sender and time
  const groupedMessages = messages.reduce<MessageType[][]>((groups, message, index) => {
    const prevMessage = messages[index - 1];
    
    // Start a new group if:
    // 1. This is the first message
    // 2. The sender is different from the previous message
    // 3. The time gap is more than 5 minutes
    if (
      !prevMessage || 
      prevMessage.sender.id !== message.sender.id ||
      message.timestamp.getTime() - prevMessage.timestamp.getTime() > 5 * 60 * 1000
    ) {
      groups.push([message]);
    } else {
      // Add to the last group
      groups[groups.length - 1].push(message);
    }
    
    return groups;
  }, []);
  
  return (
    <div className="flex flex-col h-full">
      {/* Channel header */}
      <div className="h-12 shadow-md px-4 flex items-center border-b border-discord-tertiary">
        <h2 className="font-bold text-discord-text-normal flex items-center">
          <span className="text-discord-text-muted mr-2">#</span>
          {channelName}
        </h2>
      </div>
      
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-2">
        {groupedMessages.map((group, groupIndex) => (
          <div key={groupIndex} className="mb-4">
            {group.map((message, messageIndex) => (
              <Message
                key={message.id}
                message={message}
                isFirstInGroup={messageIndex === 0}
              />
            ))}
          </div>
        ))}
      </div>
      
      {/* Message input */}
      <MessageInput
        channelId={channelId || ''}
        channelName={channelName}
        onSendMessage={handleSendMessage}
        channelKey={channelKey}
      />
    </div>
  );
};

const NoChannelSelected = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-discord-primary">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="text-center space-y-4"
      >
        <h2 className="text-2xl font-bold text-discord-text-normal">No Channel Selected</h2>
        <p className="text-discord-text-muted">
          Select a channel from the sidebar to start chatting
        </p>
      </motion.div>
    </div>
  );
};

const Chat = () => {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 bg-discord-primary">
        <Routes>
          <Route path="/" element={<NoChannelSelected />} />
          <Route path=":serverId" element={<NoChannelSelected />} />
          <Route path=":serverId/:channelId" element={<ChannelView />} />
        </Routes>
      </div>
    </div>
  );
};

export default Chat; 