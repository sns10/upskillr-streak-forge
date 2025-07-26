import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  MessageCircle, 
  Users, 
  Code, 
  Star, 
  Send, 
  Plus, 
  Search, 
  Crown,
  Trophy,
  Heart,
  Share2,
  Eye,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../integrations/supabase/client';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  timestamp: string;
  type: 'text' | 'code' | 'system';
}

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  member_count: number;
  max_members: number;
  is_public: boolean;
  created_by: string;
  created_at: string;
  tags: string[];
}

interface CodeReview {
  id: string;
  code: string;
  language: string;
  title: string;
  description: string;
  author_id: string;
  author_name: string;
  created_at: string;
  likes: number;
  dislikes: number;
  comments: number;
  status: 'open' | 'resolved' | 'closed';
}

interface CollaborationHubProps {
  userId: string;
  userProfile: any;
}

export const CollaborationHub: React.FC<CollaborationHubProps> = ({ userId, userProfile }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [codeReviews, setCodeReviews] = useState<CodeReview[]>([]);
  const [activeTab, setActiveTab] = useState('chat');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isSharingCode, setIsSharingCode] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '', is_public: true, max_members: 10 });
  const [newCodeReview, setNewCodeReview] = useState({ title: '', description: '', code: '', language: 'python' });
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load initial data
  useEffect(() => {
    loadStudyGroups();
    loadCodeReviews();
    loadRecentMessages();
  }, []);

  const loadRecentMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('collaboration_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setMessages(data?.reverse() || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadStudyGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('study_groups')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudyGroups(data || []);
    } catch (error) {
      console.error('Error loading study groups:', error);
    }
  };

  const loadCodeReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('code_reviews')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setCodeReviews(data || []);
    } catch (error) {
      console.error('Error loading code reviews:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const message = {
        content: newMessage,
        sender_id: userId,
        sender_name: userProfile?.full_name || 'Anonymous',
        sender_avatar: userProfile?.avatar_url,
        type: 'text' as const
      };

      const { data, error } = await supabase
        .from('collaboration_messages')
        .insert([message])
        .select()
        .single();

      if (error) throw error;

      setMessages(prev => [...prev, data]);
      setNewMessage('');

      toast({
        title: "Message sent!",
        description: "Your message has been posted to the collaboration hub.",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const createStudyGroup = async () => {
    if (!newGroup.name.trim()) return;

    try {
      const group = {
        ...newGroup,
        created_by: userId,
        member_count: 1,
        tags: []
      };

      const { data, error } = await supabase
        .from('study_groups')
        .insert([group])
        .select()
        .single();

      if (error) throw error;

      setStudyGroups(prev => [data, ...prev]);
      setIsCreatingGroup(false);
      setNewGroup({ name: '', description: '', is_public: true, max_members: 10 });

      toast({
        title: "Study group created!",
        description: "Your study group has been created successfully.",
      });
    } catch (error) {
      console.error('Error creating study group:', error);
      toast({
        title: "Error",
        description: "Failed to create study group. Please try again.",
        variant: "destructive",
      });
    }
  };

  const shareCodeReview = async () => {
    if (!newCodeReview.title.trim() || !newCodeReview.code.trim()) return;

    try {
      const review = {
        ...newCodeReview,
        author_id: userId,
        author_name: userProfile?.full_name || 'Anonymous',
        likes: 0,
        dislikes: 0,
        comments: 0,
        status: 'open' as const
      };

      const { data, error } = await supabase
        .from('code_reviews')
        .insert([review])
        .select()
        .single();

      if (error) throw error;

      setCodeReviews(prev => [data, ...prev]);
      setIsSharingCode(false);
      setNewCodeReview({ title: '', description: '', code: '', language: 'python' });

      toast({
        title: "Code shared!",
        description: "Your code has been shared for review.",
      });
    } catch (error) {
      console.error('Error sharing code:', error);
      toast({
        title: "Error",
        description: "Failed to share code. Please try again.",
        variant: "destructive",
      });
    }
  };

  const likeCodeReview = async (reviewId: string) => {
    try {
      const { data, error } = await supabase
        .from('code_reviews')
        .update({ likes: supabase.rpc('increment') })
        .eq('id', reviewId)
        .select()
        .single();

      if (error) throw error;

      setCodeReviews(prev => 
        prev.map(review => 
          review.id === reviewId 
            ? { ...review, likes: review.likes + 1 }
            : review
        )
      );
    } catch (error) {
      console.error('Error liking code review:', error);
    }
  };

  const filteredGroups = studyGroups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredReviews = codeReviews.filter(review =>
    review.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    review.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Collaboration Hub</h2>
          <p className="text-gray-600">Connect, learn, and grow together with fellow coders</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <Users className="h-3 w-3 mr-1" />
            {studyGroups.reduce((acc, group) => acc + group.member_count, 0)} Active
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Live Chat
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Study Groups
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Code Reviews
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Leaderboard
          </TabsTrigger>
        </TabsList>

        {/* Live Chat Tab */}
        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Live Chat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 overflow-y-auto space-y-4 mb-4 p-4 bg-gray-50 rounded-lg">
                {messages.map((message) => (
                  <div key={message.id} className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={message.sender_avatar} />
                      <AvatarFallback>
                        {message.sender_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{message.sender_name}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        {message.content}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <Button onClick={sendMessage} size="sm">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Study Groups Tab */}
        <TabsContent value="groups" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search groups..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
            </div>
            <Dialog open={isCreatingGroup} onOpenChange={setIsCreatingGroup}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Group
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Study Group</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Group name"
                    value={newGroup.name}
                    onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <Textarea
                    placeholder="Group description"
                    value={newGroup.description}
                    onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                  />
                  <div className="flex items-center gap-4">
                    <Select
                      value={newGroup.max_members.toString()}
                      onValueChange={(value) => setNewGroup(prev => ({ ...prev, max_members: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Max members" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 members</SelectItem>
                        <SelectItem value="10">10 members</SelectItem>
                        <SelectItem value="20">20 members</SelectItem>
                        <SelectItem value="50">50 members</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={createStudyGroup} className="w-full">
                    Create Group
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGroups.map((group) => (
              <Card key={group.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{group.name}</span>
                    <Badge variant={group.member_count >= group.max_members ? "destructive" : "secondary"}>
                      {group.member_count}/{group.max_members}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">{group.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-500">{group.member_count} members</span>
                    </div>
                    <Button size="sm" variant="outline">
                      Join
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Code Reviews Tab */}
        <TabsContent value="reviews" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search code reviews..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
            </div>
            <Dialog open={isSharingCode} onOpenChange={setIsSharingCode}>
              <DialogTrigger asChild>
                <Button>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Code
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Share Code for Review</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Review title"
                    value={newCodeReview.title}
                    onChange={(e) => setNewCodeReview(prev => ({ ...prev, title: e.target.value }))}
                  />
                  <Textarea
                    placeholder="Description of your code"
                    value={newCodeReview.description}
                    onChange={(e) => setNewCodeReview(prev => ({ ...prev, description: e.target.value }))}
                  />
                  <Select
                    value={newCodeReview.language}
                    onValueChange={(value) => setNewCodeReview(prev => ({ ...prev, language: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="python">Python</SelectItem>
                      <SelectItem value="javascript">JavaScript</SelectItem>
                      <SelectItem value="java">Java</SelectItem>
                      <SelectItem value="cpp">C++</SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea
                    placeholder="Paste your code here..."
                    value={newCodeReview.code}
                    onChange={(e) => setNewCodeReview(prev => ({ ...prev, code: e.target.value }))}
                    className="h-32 font-mono text-sm"
                  />
                  <Button onClick={shareCodeReview} className="w-full">
                    Share for Review
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <Card key={review.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{review.title}</span>
                    <Badge variant={review.status === 'open' ? 'default' : 'secondary'}>
                      {review.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">{review.description}</p>
                  <div className="bg-gray-900 text-green-400 p-4 rounded-lg mb-3 font-mono text-sm overflow-x-auto">
                    <pre>{review.code}</pre>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => likeCodeReview(review.id)}
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                        <span className="text-sm">{review.likes}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost">
                          <ThumbsDown className="h-4 w-4" />
                        </Button>
                        <span className="text-sm">{review.dislikes}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        <span className="text-sm">{review.comments}</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      by {review.author_name}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Social Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Top 3 with special styling */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                    <div className="text-2xl font-bold text-yellow-600">🥇</div>
                    <div className="font-semibold">CodeMaster</div>
                    <div className="text-sm text-gray-600">2,450 XP</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                    <div className="text-2xl font-bold text-gray-600">🥈</div>
                    <div className="font-semibold">PythonPro</div>
                    <div className="text-sm text-gray-600">2,100 XP</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
                    <div className="text-2xl font-bold text-orange-600">🥉</div>
                    <div className="font-semibold">AlgoWizard</div>
                    <div className="text-sm text-gray-600">1,850 XP</div>
                  </div>
                </div>

                {/* Full leaderboard */}
                <div className="space-y-2">
                  {[
                    { name: "DataStruct", xp: 1800, rank: 4 },
                    { name: "WebDev", xp: 1650, rank: 5 },
                    { name: "BugHunter", xp: 1500, rank: 6 },
                    { name: "CleanCoder", xp: 1350, rank: 7 },
                    { name: "TestMaster", xp: 1200, rank: 8 },
                  ].map((user) => (
                    <div key={user.rank} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-500">#{user.rank}</span>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        <span className="font-semibold">{user.xp} XP</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 