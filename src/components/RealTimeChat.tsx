import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Send, Users, Wifi, WifiOff } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../integrations/supabase/client';

interface ChatMessage {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  timestamp: string;
  type: 'text' | 'code' | 'system';
}

interface RealTimeChatProps {
  channelId: string;
  userId: string;
  userProfile: any;
  onMessageSent?: (message: ChatMessage) => void;
}

export const RealTimeChat: React.FC<RealTimeChatProps> = ({
  channelId,
  userId,
  userProfile,
  onMessageSent
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load initial messages
  useEffect(() => {
    loadMessages();
    setupRealtimeSubscription();
  }, [channelId]);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('collaboration_messages')
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    }
  };

  const setupRealtimeSubscription = () => {
    // Subscribe to new messages
    const messagesSubscription = supabase
      .channel(`chat:${channelId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'collaboration_messages',
        filter: `channel_id=eq.${channelId}`
      }, (payload) => {
        const newMessage = payload.new as ChatMessage;
        setMessages(prev => [...prev, newMessage]);
        
        // Show notification for messages from other users
        if (newMessage.sender_id !== userId) {
          toast({
            title: `New message from ${newMessage.sender_name}`,
            description: newMessage.content.substring(0, 50) + (newMessage.content.length > 50 ? '...' : ''),
          });
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'collaboration_messages',
        filter: `channel_id=eq.${channelId}`
      }, (payload) => {
        const updatedMessage = payload.new as ChatMessage;
        setMessages(prev => 
          prev.map(msg => msg.id === updatedMessage.id ? updatedMessage : msg)
        );
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'collaboration_messages',
        filter: `channel_id=eq.${channelId}`
      }, (payload) => {
        const deletedMessage = payload.old as ChatMessage;
        setMessages(prev => prev.filter(msg => msg.id !== deletedMessage.id));
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Subscribe to typing indicators
    const typingSubscription = supabase
      .channel(`typing:${channelId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { userId: typingUserId, isTyping: userIsTyping } = payload.payload;
        if (typingUserId !== userId) {
          setTypingUsers(prev => {
            if (userIsTyping) {
              return prev.includes(typingUserId) ? prev : [...prev, typingUserId];
            } else {
              return prev.filter(id => id !== typingUserId);
            }
          });
        }
      })
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
      typingSubscription.unsubscribe();
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const message = {
        content: newMessage,
        sender_id: userId,
        sender_name: userProfile?.full_name || 'Anonymous',
        sender_avatar: userProfile?.avatar_url,
        channel_id: channelId,
        type: 'text' as const
      };

      const { data, error } = await supabase
        .from('collaboration_messages')
        .insert([message])
        .select()
        .single();

      if (error) throw error;

      setNewMessage('');
      setIsTyping(false);
      
      // Broadcast that user stopped typing
      await supabase.channel(`typing:${channelId}`).send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId, isTyping: false }
      });

      if (onMessageSent) {
        onMessageSent(data);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const handleTyping = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
      await supabase.channel(`typing:${channelId}`).send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId, isTyping: true }
      });
    }

    // Clear typing indicator after 3 seconds of no typing
    setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        supabase.channel(`typing:${channelId}`).send({
          type: 'broadcast',
          event: 'typing',
          payload: { userId, isTyping: false }
        });
      }
    }, 3000);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const isOwnMessage = (message: ChatMessage) => message.sender_id === userId;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Live Chat
            <Badge variant={isConnected ? "default" : "secondary"} className="ml-2">
              {isConnected ? (
                <>
                  <Wifi className="h-3 w-3 mr-1" />
                  Connected
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 mr-1" />
                  Disconnected
                </>
              )}
            </Badge>
          </CardTitle>
          <div className="text-sm text-gray-500">
            {onlineUsers.length} online
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-3 ${
                  isOwnMessage(message) ? 'flex-row-reverse' : ''
                }`}
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={message.sender_avatar} />
                  <AvatarFallback>
                    {message.sender_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className={`flex-1 max-w-[70%] ${
                  isOwnMessage(message) ? 'text-right' : ''
                }`}>
                  <div className={`flex items-center gap-2 mb-1 ${
                    isOwnMessage(message) ? 'justify-end' : ''
                  }`}>
                    <span className="font-medium text-sm">
                      {isOwnMessage(message) ? 'You' : message.sender_name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  
                  <div className={`p-3 rounded-lg ${
                    isOwnMessage(message)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    {message.type === 'code' ? (
                      <pre className="whitespace-pre-wrap text-sm">
                        {message.content}
                      </pre>
                    ) : (
                      <p className="text-sm">{message.content}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing Indicators */}
            {typingUsers.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-500 italic">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span>
                  {typingUsers.length === 1 ? 'Someone is typing...' : 'Multiple people are typing...'}
                </span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={handleTyping}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type your message..."
              className="flex-1"
            />
            <Button 
              onClick={sendMessage} 
              disabled={!newMessage.trim() || !isConnected}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 