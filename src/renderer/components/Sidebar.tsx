import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../utils/AuthContext';

type Server = {
  id: string;
  name: string;
  icon: string;
};

type Channel = {
  id: string;
  name: string;
  type: 'text' | 'voice';
};

// Mock data for servers (would come from Supabase in a real app)
const mockServers: Server[] = [
  { id: '1', name: 'General', icon: 'G' },
  { id: '2', name: 'Gaming', icon: '🎮' },
  { id: '3', name: 'Coding', icon: '💻' },
];

// Mock data for channels (would come from Supabase in a real app)
const mockChannels: Record<string, Channel[]> = {
  '1': [
    { id: '101', name: 'welcome', type: 'text' },
    { id: '102', name: 'general-chat', type: 'text' },
    { id: '103', name: 'voice-chat', type: 'voice' },
  ],
  '2': [
    { id: '201', name: 'gaming-chat', type: 'text' },
    { id: '202', name: 'fortnite', type: 'text' },
    { id: '203', name: 'minecraft', type: 'text' },
  ],
  '3': [
    { id: '301', name: 'javascript', type: 'text' },
    { id: '302', name: 'python', type: 'text' },
    { id: '303', name: 'react', type: 'text' },
  ],
};

// Server icon component
const ServerIcon: React.FC<{ server: Server; isActive: boolean }> = ({ server, isActive }) => {
  return (
    <Link to={`/channels/${server.id}`}>
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={`
          w-12 h-12 rounded-full flex items-center justify-center mb-2
          ${isActive ? 'bg-discord-accent text-white' : 'bg-discord-primary text-discord-text-normal hover:bg-discord-accent hover:text-white'}
          transition-all duration-200
        `}
      >
        <span className="text-lg font-medium">{server.icon}</span>
      </motion.div>
    </Link>
  );
};

// Channel item component
const ChannelItem: React.FC<{ channel: Channel; serverId: string; isActive: boolean }> = ({ channel, serverId, isActive }) => {
  const Icon = channel.type === 'text' ? '#' : '🔊';
  
  return (
    <Link to={`/channels/${serverId}/${channel.id}`}>
      <motion.div
        whileHover={{ x: 4 }}
        className={`channel ${isActive ? 'active' : ''}`}
      >
        <span className="mr-2 opacity-70">{Icon}</span>
        <span>{channel.name}</span>
      </motion.div>
    </Link>
  );
};

const Sidebar = () => {
  const { serverId, channelId } = useParams<{ serverId: string; channelId: string }>();
  const { user, signOut } = useAuth();
  
  // If no server is selected, use the first one
  const activeServerId = serverId || '1';
  const channels = mockChannels[activeServerId] || [];

  return (
    <div className="flex h-full bg-discord-tertiary">
      {/* Server sidebar */}
      <div className="w-16 bg-discord-tertiary p-3 flex flex-col items-center">
        {mockServers.map((server) => (
          <ServerIcon
            key={server.id}
            server={server}
            isActive={server.id === activeServerId}
          />
        ))}
        
        {/* Add server button */}
        <motion.div
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.95 }}
          className="w-12 h-12 rounded-full bg-discord-secondary text-discord-accent flex items-center justify-center mb-2 cursor-pointer"
        >
          <span className="text-2xl font-medium">+</span>
        </motion.div>
      </div>
      
      {/* Channel sidebar */}
      <div className="w-60 bg-discord-secondary flex flex-col">
        {/* Server name header */}
        <div className="h-12 shadow-md px-4 flex items-center border-b border-discord-tertiary">
          <h2 className="font-bold text-discord-text-normal">
            {mockServers.find(s => s.id === activeServerId)?.name || 'Server'}
          </h2>
        </div>
        
        {/* Channels list */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="mb-2">
            <h3 className="px-2 text-xs uppercase font-semibold text-discord-text-muted mb-1">
              Text Channels
            </h3>
            {channels
              .filter(channel => channel.type === 'text')
              .map(channel => (
                <ChannelItem
                  key={channel.id}
                  channel={channel}
                  serverId={activeServerId}
                  isActive={channel.id === channelId}
                />
              ))
            }
          </div>
          
          <div className="mb-2">
            <h3 className="px-2 text-xs uppercase font-semibold text-discord-text-muted mb-1">
              Voice Channels
            </h3>
            {channels
              .filter(channel => channel.type === 'voice')
              .map(channel => (
                <ChannelItem
                  key={channel.id}
                  channel={channel}
                  serverId={activeServerId}
                  isActive={channel.id === channelId}
                />
              ))
            }
          </div>
        </div>
        
        {/* User area */}
        <div className="h-14 bg-discord-tertiary/50 p-2 flex items-center">
          <div className="w-8 h-8 rounded-full bg-discord-accent flex items-center justify-center mr-2">
            <span className="text-white text-sm font-medium">
              {user?.user_metadata?.username?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-discord-text-normal truncate">
              {user?.user_metadata?.username || 'User'}
            </div>
            <div className="text-xs text-discord-text-muted">Online</div>
          </div>
          <button 
            onClick={() => signOut()}
            className="text-discord-text-muted hover:text-discord-danger"
          >
            <span className="text-lg">⚙️</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 