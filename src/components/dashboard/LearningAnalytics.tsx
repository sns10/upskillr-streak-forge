import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  TrendingUp, 
  Clock, 
  Target, 
  Award, 
  BookOpen, 
  Code, 
  Brain,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';

interface LearningMetric {
  name: string;
  value: number;
  change: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
}

interface PerformanceData {
  date: string;
  score: number;
  timeSpent: number;
  attempts: number;
}

interface TopicProgress {
  topic: string;
  completed: number;
  total: number;
  accuracy: number;
  timeSpent: number;
}

interface LearningAnalyticsProps {
  userId: string;
  userProfile: any;
}

export const LearningAnalytics: React.FC<LearningAnalyticsProps> = ({
  userId,
  userProfile
}) => {
  const [metrics, setMetrics] = useState<LearningMetric[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [topicProgress, setTopicProgress] = useState<TopicProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    loadAnalytics();
  }, [userId, timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Load user analytics from Supabase
      const { data: analytics, error } = await supabase
        .rpc('get_student_analytics', { student_uuid: userId });

      if (error) throw error;

      // Generate metrics from analytics data
      const learningMetrics: LearningMetric[] = [
        {
          name: 'Success Rate',
          value: analytics?.[0]?.success_rate || 0,
          change: 5.2,
          unit: '%',
          trend: 'up'
        },
        {
          name: 'Average Score',
          value: analytics?.[0]?.average_score || 0,
          change: -2.1,
          unit: '%',
          trend: 'down'
        },
        {
          name: 'Time Spent',
          value: analytics?.[0]?.days_active || 0,
          change: 3,
          unit: 'days',
          trend: 'up'
        },
        {
          name: 'Current Streak',
          value: userProfile?.streak || 0,
          change: 1,
          unit: 'days',
          trend: 'up'
        }
      ];

      setMetrics(learningMetrics);

      // Generate mock performance data
      const mockPerformanceData: PerformanceData[] = generateMockPerformanceData();
      setPerformanceData(mockPerformanceData);

      // Generate topic progress
      const mockTopicProgress: TopicProgress[] = [
        {
          topic: 'Python Basics',
          completed: 8,
          total: 10,
          accuracy: 85,
          timeSpent: 120
        },
        {
          topic: 'Input/Output',
          completed: 5,
          total: 7,
          accuracy: 92,
          timeSpent: 90
        },
        {
          topic: 'String Operations',
          completed: 6,
          total: 8,
          accuracy: 78,
          timeSpent: 150
        },
        {
          topic: 'Arithmetic',
          completed: 4,
          total: 6,
          accuracy: 95,
          timeSpent: 60
        }
      ];

      setTopicProgress(mockTopicProgress);

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockPerformanceData = (): PerformanceData[] => {
    const data: PerformanceData[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        score: Math.floor(Math.random() * 40) + 60, // 60-100
        timeSpent: Math.floor(Math.random() * 120) + 30, // 30-150 minutes
        attempts: Math.floor(Math.random() * 3) + 1 // 1-4 attempts
      });
    }
    
    return data;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUp className="h-4 w-4 text-green-500" />;
      case 'down': return <ArrowDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return 'text-green-600';
    if (accuracy >= 80) return 'text-yellow-600';
    if (accuracy >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading analytics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Learning Analytics
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            <Calendar className="h-3 w-3 mr-1" />
            Last {timeRange === '7d' ? '7 days' : timeRange === '30d' ? '30 days' : '90 days'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="topics">Topics</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {metrics.map((metric) => (
                <Card key={metric.name} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {metric.name}
                      </p>
                      <p className="text-2xl font-bold">
                        {metric.value}{metric.unit}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(metric.trend)}
                      <span className={`text-sm font-medium ${getTrendColor(metric.trend)}`}>
                        {metric.change > 0 ? '+' : ''}{metric.change}{metric.unit}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Lessons Completed</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">23</p>
                <p className="text-sm text-muted-foreground">This week</p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Code className="h-4 w-4 text-green-500" />
                  <span className="font-medium">Assignments</span>
                </div>
                <p className="text-2xl font-bold text-green-600">15</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-purple-500" />
                  <span className="font-medium">Study Time</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">8.5h</p>
                <p className="text-sm text-muted-foreground">This week</p>
              </Card>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            {/* Performance Chart */}
            <Card className="p-4">
              <h3 className="font-medium mb-4">Daily Performance</h3>
              <div className="space-y-3">
                {performanceData.map((data, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium w-20">
                        {new Date(data.date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Score:</span>
                        <span className="font-medium">{data.score}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Time:</span>
                        <span className="font-medium">{formatTime(data.timeSpent)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {data.attempts} attempts
                      </Badge>
                      {data.score >= 90 && <Star className="h-4 w-4 text-yellow-500" />}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Performance Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                <h4 className="font-medium mb-3">Best Performance</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Highest Score:</span>
                    <span className="font-medium text-green-600">98%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Most Productive Day:</span>
                    <span className="font-medium">Wednesday</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Average Time:</span>
                    <span className="font-medium">{formatTime(85)}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="font-medium mb-3">Areas for Improvement</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Lowest Score:</span>
                    <span className="font-medium text-red-600">62%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Most Attempts:</span>
                    <span className="font-medium">4 (String Operations)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Slowest Topic:</span>
                    <span className="font-medium">Functions</span>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Topics Tab */}
          <TabsContent value="topics" className="space-y-6">
            <div className="space-y-4">
              {topicProgress.map((topic) => (
                <Card key={topic.topic} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">{topic.topic}</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {topic.completed}/{topic.total}
                      </Badge>
                      <Badge className={getAccuracyColor(topic.accuracy)}>
                        {topic.accuracy}% accuracy
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{Math.round((topic.completed / topic.total) * 100)}%</span>
                    </div>
                    <Progress value={(topic.completed / topic.total) * 100} className="h-2" />
                    
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Time spent: {formatTime(topic.timeSpent)}</span>
                      <span>{topic.completed} of {topic.total} completed</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <h4 className="font-medium">Learning Streak</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  You're on a {userProfile?.streak || 0}-day learning streak!
                </p>
                <div className="flex gap-1">
                  {Array.from({ length: 7 }, (_, i) => (
                    <div
                      key={i}
                      className={`w-4 h-4 rounded-full ${
                        i < (userProfile?.streak || 0) ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-4 w-4 text-blue-500" />
                  <h4 className="font-medium">Next Goal</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Complete 5 more assignments to unlock the "Consistent Learner" badge
                </p>
                <Progress value={75} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">15/20 completed</p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="h-4 w-4 text-purple-500" />
                  <h4 className="font-medium">Recommended Focus</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Based on your performance, focus on:
                </p>
                <ul className="text-sm space-y-1">
                  <li className="flex items-center gap-2">
                    <AlertCircle className="h-3 w-3 text-orange-500" />
                    String Operations (78% accuracy)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    Arithmetic (95% accuracy - excellent!)
                  </li>
                </ul>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="h-4 w-4 text-green-500" />
                  <h4 className="font-medium">Study Pattern</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  You study most effectively:
                </p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Time of day:</span>
                    <span className="font-medium">Evening (6-9 PM)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Session length:</span>
                    <span className="font-medium">45-60 minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Best day:</span>
                    <span className="font-medium">Wednesday</span>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}; 