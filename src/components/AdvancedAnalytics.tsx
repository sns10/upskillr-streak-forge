import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  TrendingUp, 
  TrendingDown,
  Target,
  Clock,
  Calendar,
  Award,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Share2,
  Filter,
  RefreshCw,
  Settings
} from 'lucide-react';

interface LearningMetric {
  date: string;
  lessonsCompleted: number;
  assignmentsCompleted: number;
  timeSpent: number;
  accuracy: number;
  xpEarned: number;
}

interface TopicProgress {
  topic: string;
  progress: number;
  strength: number;
  weakness: number;
  timeSpent: number;
  assignments: number;
}

interface PerformanceInsight {
  type: 'improvement' | 'decline' | 'milestone' | 'warning';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  date: string;
  actionable: boolean;
}

interface AdvancedAnalyticsProps {
  userId: string;
  userProfile: any;
}

export const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({
  userId,
  userProfile
}) => {
  const [learningData, setLearningData] = useState<LearningMetric[]>([]);
  const [topicProgress, setTopicProgress] = useState<TopicProgress[]>([]);
  const [insights, setInsights] = useState<PerformanceInsight[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadAnalyticsData();
  }, [userId, timeRange]);

  const loadAnalyticsData = () => {
    setIsLoading(true);
    
    // Simulate loading analytics data
    setTimeout(() => {
      // Generate mock learning data
      const mockLearningData: LearningMetric[] = Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        lessonsCompleted: Math.floor(Math.random() * 5) + 1,
        assignmentsCompleted: Math.floor(Math.random() * 3) + 1,
        timeSpent: Math.floor(Math.random() * 120) + 30,
        accuracy: Math.floor(Math.random() * 30) + 70,
        xpEarned: Math.floor(Math.random() * 200) + 50
      }));

      const mockTopicProgress: TopicProgress[] = [
        {
          topic: 'Python Basics',
          progress: 95,
          strength: 88,
          weakness: 12,
          timeSpent: 240,
          assignments: 15
        },
        {
          topic: 'Data Structures',
          progress: 72,
          strength: 65,
          weakness: 35,
          timeSpent: 180,
          assignments: 12
        },
        {
          topic: 'Algorithms',
          progress: 58,
          strength: 45,
          weakness: 55,
          timeSpent: 120,
          assignments: 8
        },
        {
          topic: 'Object-Oriented Programming',
          progress: 83,
          strength: 78,
          weakness: 22,
          timeSpent: 200,
          assignments: 10
        },
        {
          topic: 'Web Development',
          progress: 45,
          strength: 40,
          weakness: 60,
          timeSpent: 90,
          assignments: 6
        }
      ];

      const mockInsights: PerformanceInsight[] = [
        {
          type: 'improvement',
          title: 'Significant Progress in Python Basics',
          description: 'Your accuracy in Python basics has improved by 15% this week',
          impact: 'high',
          date: new Date().toISOString(),
          actionable: false
        },
        {
          type: 'warning',
          title: 'Declining Performance in Algorithms',
          description: 'Your algorithm problem-solving accuracy has dropped by 8%',
          impact: 'medium',
          date: new Date().toISOString(),
          actionable: true
        },
        {
          type: 'milestone',
          title: 'Completed 50th Assignment',
          description: 'Congratulations! You\'ve completed your 50th coding assignment',
          impact: 'high',
          date: new Date().toISOString(),
          actionable: false
        },
        {
          type: 'improvement',
          title: 'Consistent Learning Streak',
          description: 'You\'ve maintained a 7-day learning streak',
          impact: 'medium',
          date: new Date().toISOString(),
          actionable: false
        }
      ];

      setLearningData(mockLearningData);
      setTopicProgress(mockTopicProgress);
      setInsights(mockInsights);
      setIsLoading(false);
    }, 1000);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'improvement': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'decline': return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'milestone': return <Award className="h-4 w-4 text-yellow-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default: return <Eye className="h-4 w-4 text-blue-600" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const calculateTrends = () => {
    if (learningData.length < 2) return { trend: 'stable', percentage: 0 };
    
    const recent = learningData.slice(-3).reduce((sum, day) => sum + day.xpEarned, 0) / 3;
    const previous = learningData.slice(-6, -3).reduce((sum, day) => sum + day.xpEarned, 0) / 3;
    
    const percentage = ((recent - previous) / previous) * 100;
    const trend = percentage > 5 ? 'up' : percentage < -5 ? 'down' : 'stable';
    
    return { trend, percentage: Math.abs(percentage) };
  };

  const trends = calculateTrends();

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Advanced Analytics
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadAnalyticsData}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="topics">Topics</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    {learningData.reduce((sum, day) => sum + day.lessonsCompleted, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Lessons Completed</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 mb-2">
                    {learningData.reduce((sum, day) => sum + day.assignmentsCompleted, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Assignments Done</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-2">
                    {Math.round(learningData.reduce((sum, day) => sum + day.timeSpent, 0) / 60)}h
                  </div>
                  <div className="text-sm text-muted-foreground">Time Spent</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600 mb-2">
                    {Math.round(learningData.reduce((sum, day) => sum + day.accuracy, 0) / learningData.length)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Accuracy</div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Trend */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Performance Trend</h3>
                  <div className="flex items-center gap-2">
                    {trends.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-600" />}
                    {trends.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-600" />}
                    <span className={`text-sm font-medium ${
                      trends.trend === 'up' ? 'text-green-600' : 
                      trends.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {trends.trend === 'up' ? '+' : trends.trend === 'down' ? '-' : ''}{trends.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {learningData.map((day, index) => (
                    <div key={day.date} className="flex items-center gap-4">
                      <div className="w-16 text-sm text-muted-foreground">
                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      <div className="flex-1">
                        <Progress value={day.accuracy} className="h-2" />
                      </div>
                      <div className="w-16 text-right text-sm font-medium">
                        {day.accuracy}%
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Topics Tab */}
          <TabsContent value="topics" className="space-y-4">
            <div className="space-y-4">
              {topicProgress.map((topic) => (
                <Card key={topic.topic}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{topic.topic}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{topic.assignments} assignments</Badge>
                        <Badge variant="outline">{Math.round(topic.timeSpent / 60)}h spent</Badge>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">Overall Progress</span>
                          <span className="text-sm text-muted-foreground">{topic.progress}%</span>
                        </div>
                        <Progress value={topic.progress} className="h-2" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-green-600">Strengths</span>
                            <span className="text-sm text-muted-foreground">{topic.strength}%</span>
                          </div>
                          <Progress value={topic.strength} className="h-2 bg-green-100" />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-red-600">Areas to Improve</span>
                            <span className="text-sm text-muted-foreground">{topic.weakness}%</span>
                          </div>
                          <Progress value={topic.weakness} className="h-2 bg-red-100" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-4">
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <Card key={index} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{insight.title}</h3>
                          <Badge className={getImpactColor(insight.impact)}>
                            {insight.impact} impact
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {insight.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {new Date(insight.date).toLocaleDateString()}
                          </span>
                          {insight.actionable && (
                            <Button size="sm" variant="outline">
                              Take Action
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>


        </Tabs>
      </CardContent>
    </Card>
  );
}; 