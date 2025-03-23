import { SupabaseClient, createClient } from '@supabase/supabase-js';

// Create Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: SupabaseClient;

// Initialize supabase
export const initSupabase = () => {
  if (!supabase) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabase;
};

// Get initialized supabase client
export const getSupabase = (): SupabaseClient => {
  if (!supabase) {
    initSupabase();
  }
  return supabase;
};

// User operations
export const createOrUpdateProfile = async (userData: {
  id: string;
  username: string;
  avatar_url?: string;
  status?: string;
}) => {
  const { data, error } = await getSupabase()
    .from('profiles')
    .upsert({
      id: userData.id,
      username: userData.username,
      avatar_url: userData.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${userData.username}`,
      status: userData.status || 'online',
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'id'
    });

  if (error) throw error;
  return data;
};

export const getUserProfile = async (userId: string) => {
  const { data, error } = await getSupabase()
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
};

export const updateUserStatus = async (userId: string, status: string) => {
  const { data, error } = await getSupabase()
    .from('profiles')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) throw error;
  return data;
};

// Channel operations
export const createChannel = async (channelData: {
  name: string;
  description?: string;
  is_direct?: boolean;
}) => {
  const { data, error } = await getSupabase()
    .from('channels')
    .insert({
      name: channelData.name,
      description: channelData.description || '',
      is_direct: channelData.is_direct || false
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getChannels = async () => {
  const { data, error } = await getSupabase()
    .from('channels')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const addUserToChannel = async (channelId: string, userId: string) => {
  const { data, error } = await getSupabase()
    .from('channel_members')
    .insert({
      channel_id: channelId,
      user_id: userId
    });

  if (error) throw error;
  return data;
};

// Message operations
export const sendMessage = async (messageData: {
  channel_id: string;
  user_id: string;
  content: string;
  encrypted?: boolean;
}) => {
  const { data, error } = await getSupabase()
    .from('messages')
    .insert({
      channel_id: messageData.channel_id,
      user_id: messageData.user_id,
      content: messageData.content,
      encrypted: messageData.encrypted !== undefined ? messageData.encrypted : true
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getMessagesByChannel = async (channelId: string) => {
  const { data, error } = await getSupabase()
    .from('messages')
    .select(`
      *,
      profiles:user_id (username, avatar_url)
    `)
    .eq('channel_id', channelId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
};

// Real-time subscriptions
export const subscribeToChannelMessages = (
  channelId: string,
  callback: (message: any) => void
) => {
  const subscription = getSupabase()
    .channel(`messages:${channelId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `channel_id=eq.${channelId}`
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();

  return () => {
    getSupabase().removeChannel(subscription);
  };
};

export const subscribeToUserStatus = (callback: (profile: any) => void) => {
  const subscription = getSupabase()
    .channel('profiles')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `status=neq.offline`
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();

  return () => {
    getSupabase().removeChannel(subscription);
  };
}; 