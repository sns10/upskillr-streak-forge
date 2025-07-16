import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  BookOpen, 
  Trophy, 
  Award, 
  TrendingUp,
  Plus,
  Edit2,
  Calendar,
  Clock,
  Target,
  Star
} from "lucide-react";
import { format } from "date-fns";

interface StudentDetailModalProps {
  studentId: string | null;
  onClose: () => void;
}

interface StudentProfile {
  id: string;
  full_name: string;
  avatar_url?: string;
}

interface LessonProgress {
  id: string;
  lesson_id: string;
  completed: boolean;
  watch_percentage: number;
  completed_at: string | null;
  lesson: {
    title: string;
    type: string;
    xp_reward: number;
    module: {
      title: string;
      course: {
        title: string;
      };
    };
  };
}

interface QuizResult {
  id: string;
  quiz_id: string;
  score: number;
  completed_at: string;
  quiz: {
    title: string;
    xp_reward: number;
    lesson: {
      title: string;
      module: {
        title: string;
        course: {
          title: string;
        };
      };
    };
  };
}

interface XPRecord {
  id: string;
  amount: number;
  source: string;
  source_id: string | null;
  created_at: string;
}

export const StudentDetailModal = ({ studentId, onClose }: StudentDetailModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [xpAmount, setXpAmount] = useState("");
  const [xpReason, setXpReason] = useState("");

  // Fetch student profile
  const { data: student } = useQuery({
    queryKey: ['student-profile', studentId],
    queryFn: async () => {
      if (!studentId) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', studentId)
        .single();
        
      if (error) throw error;
      return data as StudentProfile;
    },
    enabled: !!studentId
  });

  // Fetch student lesson progress
  const { data: lessonProgress } = useQuery({
    queryKey: ['student-lessons', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      
      const { data, error } = await supabase
        .from('user_progress')
        .select(`
          id,
          lesson_id,
          completed,
          watch_percentage,
          completed_at,
          lesson:lessons (
            title,
            type,
            xp_reward,
            module:modules (
              title,
              course:courses (
                title
              )
            )
          )
        `)
        .eq('user_id', studentId)
        .order('completed_at', { ascending: false });
        
      if (error) throw error;
      return data as LessonProgress[];
    },
    enabled: !!studentId
  });

  // Fetch student quiz results
  const { data: quizResults } = useQuery({
    queryKey: ['student-quizzes', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      
      const { data, error } = await supabase
        .from('quiz_results')
        .select(`
          id,
          quiz_id,
          score,
          completed_at
        `)
        .eq('user_id', studentId)
        .order('completed_at', { ascending: false });
        
      if (error) throw error;
      
      // Get quiz details separately
      const resultsWithQuizDetails = await Promise.all(
        data.map(async (result) => {
          const { data: quizData, error: quizError } = await supabase
            .from('quizzes')
            .select(`
              title,
              xp_reward,
              lesson:lessons (
                title,
                module:modules (
                  title,
                  course:courses (
                    title
                  )
                )
              )
            `)
            .eq('id', result.quiz_id)
            .single();
            
          if (quizError) throw quizError;
          
          return {
            ...result,
            quiz: quizData
          };
        })
      );
      
      return resultsWithQuizDetails as QuizResult[];
    },
    enabled: !!studentId
  });

  // Fetch student XP history
  const { data: xpHistory } = useQuery({
    queryKey: ['student-xp', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      
      const { data, error } = await supabase
        .from('user_xp')
        .select('id, amount, source, source_id, created_at')
        .eq('user_id', studentId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data as XPRecord[];
    },
    enabled: !!studentId
  });

  // Fetch student badges
  const { data: studentBadges } = useQuery({
    queryKey: ['student-badges', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      
      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          id,
          earned_at,
          badge:badges (
            id,
            name,
            description,
            icon
          )
        `)
        .eq('user_id', studentId)
        .order('earned_at', { ascending: false });
        
      if (error) throw error;
      return data;
    },
    enabled: !!studentId
  });

  // Add XP mutation
  const addXpMutation = useMutation({
    mutationFn: async () => {
      if (!studentId || !xpAmount || !xpReason) {
        throw new Error('Missing required fields');
      }
      
      const { error } = await supabase
        .from('user_xp')
        .insert({
          user_id: studentId,
          amount: parseInt(xpAmount),
          source: `manual_admin_${xpReason}`,
          source_id: null
        });
        
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "XP Added Successfully",
        description: `Added ${xpAmount} XP to ${student?.full_name}`,
      });
      setXpAmount("");
      setXpReason("");
      queryClient.invalidateQueries({ queryKey: ['student-xp', studentId] });
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
    },
    onError: (error) => {
      toast({
        title: "Error Adding XP",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Calculate statistics
  const totalXP = xpHistory?.reduce((sum, record) => sum + record.amount, 0) || 0;
  const completedLessons = lessonProgress?.filter(p => p.completed).length || 0;
  const totalLessons = lessonProgress?.length || 0;
  const averageQuizScore = quizResults?.length ? 
    Math.round(quizResults.reduce((sum, quiz) => sum + quiz.score, 0) / quizResults.length) : 0;

  if (!studentId) return null;

  return (
    <Dialog open={!!studentId} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{student?.full_name}</h2>
              <p className="text-muted-foreground">Student Analytics Dashboard</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Trophy className="w-4 h-4" />
                Total XP
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalXP}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <BookOpen className="w-4 h-4" />
                Lessons
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedLessons}/{totalLessons}</div>
              <Progress value={(completedLessons / Math.max(totalLessons, 1)) * 100} className="mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Target className="w-4 h-4" />
                Avg Quiz Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageQuizScore}%</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Award className="w-4 h-4" />
                Badges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{studentBadges?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="lessons" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="lessons">Lessons</TabsTrigger>
            <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
            <TabsTrigger value="xp">XP History</TabsTrigger>
            <TabsTrigger value="badges">Badges</TabsTrigger>
            <TabsTrigger value="manage">Manage XP</TabsTrigger>
          </TabsList>

          <TabsContent value="lessons" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Lesson Progress</CardTitle>
                <CardDescription>Detailed view of lesson completion status</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Module</TableHead>
                      <TableHead>Lesson</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>XP Reward</TableHead>
                      <TableHead>Completed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lessonProgress?.map((progress) => (
                      <TableRow key={progress.id}>
                        <TableCell>{progress.lesson.module.course.title}</TableCell>
                        <TableCell>{progress.lesson.module.title}</TableCell>
                        <TableCell>{progress.lesson.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{progress.lesson.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={progress.watch_percentage || 0} className="w-20" />
                            <span className="text-sm">{progress.watch_percentage || 0}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{progress.lesson.xp_reward} XP</TableCell>
                        <TableCell>
                          {progress.completed ? (
                            <Badge className="bg-green-500">
                              ✓ {progress.completed_at ? format(new Date(progress.completed_at), 'MMM d') : ''}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Incomplete</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quizzes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Quiz Results</CardTitle>
                <CardDescription>Quiz performance and scores</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Lesson</TableHead>
                      <TableHead>Quiz</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>XP Earned</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quizResults?.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell>{result.quiz.lesson.module.course.title}</TableCell>
                        <TableCell>{result.quiz.lesson.title}</TableCell>
                        <TableCell>{result.quiz.title}</TableCell>
                        <TableCell>
                          <Badge className={result.score >= 80 ? "bg-green-500" : result.score >= 60 ? "bg-yellow-500" : "bg-red-500"}>
                            {result.score}%
                          </Badge>
                        </TableCell>
                        <TableCell>{result.quiz.xp_reward} XP</TableCell>
                        <TableCell>{format(new Date(result.completed_at), 'MMM d, yyyy')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="xp" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>XP History</CardTitle>
                <CardDescription>Complete XP earning history</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Amount</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {xpHistory?.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <Badge className="bg-primary">+{record.amount} XP</Badge>
                        </TableCell>
                        <TableCell>
                          {record.source.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </TableCell>
                        <TableCell>{format(new Date(record.created_at), 'MMM d, yyyy HH:mm')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="badges" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Earned Badges</CardTitle>
                <CardDescription>Achievement badges earned by the student</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {studentBadges?.map((userBadge) => (
                    <Card key={userBadge.id} className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{userBadge.badge.icon || '🏆'}</div>
                        <div>
                          <h4 className="font-semibold">{userBadge.badge.name}</h4>
                          <p className="text-sm text-muted-foreground">{userBadge.badge.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Earned: {format(new Date(userBadge.earned_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Manage Student XP</CardTitle>
                <CardDescription>Manually add or adjust XP for this student</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="xp-amount">XP Amount</Label>
                    <Input
                      id="xp-amount"
                      type="number"
                      placeholder="Enter XP amount"
                      value={xpAmount}
                      onChange={(e) => setXpAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="xp-reason">Reason</Label>
                    <Select value={xpReason} onValueChange={setXpReason}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select reason" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bonus">Bonus Reward</SelectItem>
                        <SelectItem value="correction">Grade Correction</SelectItem>
                        <SelectItem value="participation">Participation</SelectItem>
                        <SelectItem value="extra_credit">Extra Credit</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button 
                  onClick={() => addXpMutation.mutate()}
                  disabled={!xpAmount || !xpReason || addXpMutation.isPending}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {addXpMutation.isPending ? 'Adding XP...' : 'Add XP'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};