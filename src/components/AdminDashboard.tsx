
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Users, 
  Trophy, 
  Settings, 
  Plus, 
  Edit, 
  Trash2,
  PlayCircle,
  FileText,
  Target,
  Star,
  TrendingUp,
  LogOut,
  Youtube,
  ExternalLink
} from 'lucide-react';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard = ({ onLogout }: AdminDashboardProps) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  // Mock data
  const adminStats = {
    totalStudents: 1247,
    activeCourses: 8,
    totalCompletions: 156,
    avgEngagement: 78
  };

  const courses = [
    {
      id: '1',
      title: 'React Fundamentals',
      students: 45,
      completion: 68,
      avgXP: 425,
      status: 'active',
      lessons: 20
    },
    {
      id: '2',
      title: 'TypeScript Mastery',
      students: 32,
      completion: 45,
      avgXP: 380,
      status: 'active',
      lessons: 25
    },
    {
      id: '3',
      title: 'JavaScript Basics',
      students: 78,
      completion: 89,
      avgXP: 520,
      status: 'active',
      lessons: 15
    }
  ];

  const recentActivities = [
    { student: 'Alex Johnson', action: 'Completed', item: 'React Hooks Quiz', xp: 75 },
    { student: 'Sarah Chen', action: 'Started', item: 'TypeScript Course', xp: 0 },
    { student: 'Mike Davis', action: 'Submitted', item: 'Todo App Assignment', xp: 100 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="px-6 py-4 bg-white/80 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Manage courses and gamification</p>
            </div>
          </div>
          <Button variant="outline" onClick={onLogout} className="flex items-center space-x-2">
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="gamification">Gamification</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{adminStats.totalStudents}</div>
                  <p className="text-xs text-muted-foreground">+12% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{adminStats.activeCourses}</div>
                  <p className="text-xs text-muted-foreground">2 new this month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completions</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{adminStats.totalCompletions}</div>
                  <p className="text-xs text-muted-foreground">+8% completion rate</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Engagement</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{adminStats.avgEngagement}%</div>
                  <p className="text-xs text-muted-foreground">Above target</p>
                </CardContent>
              </Card>
            </div>

            {/* Course Performance & Recent Activity */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Courses</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {courses.slice(0, 3).map((course) => (
                    <div key={course.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{course.title}</p>
                        <p className="text-sm text-gray-600">{course.students} students • {course.completion}% completion</p>
                      </div>
                      <Badge variant="outline">{course.avgXP} avg XP</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Student Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{activity.student}</p>
                        <p className="text-sm text-gray-600">{activity.action} {activity.item}</p>
                      </div>
                      {activity.xp > 0 && <Badge variant="outline">+{activity.xp} XP</Badge>}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Course Management</h2>
              <Button className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Create Course</span>
              </Button>
            </div>

            <div className="grid gap-6">
              {courses.map((course) => (
                <Card key={course.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <span>{course.title}</span>
                          <Badge variant={course.status === 'active' ? 'default' : 'secondary'}>
                            {course.status}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          {course.lessons} lessons • {course.students} enrolled students
                        </CardDescription>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{course.students}</p>
                        <p className="text-sm text-gray-600">Students</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{course.completion}%</p>
                        <p className="text-sm text-gray-600">Completion</p>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <p className="text-2xl font-bold text-yellow-600">{course.avgXP}</p>
                        <p className="text-sm text-gray-600">Avg XP</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Student Management</h2>
              <div className="flex space-x-2">
                <Input placeholder="Search students..." className="w-64" />
                <Button variant="outline">Export</Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Student Leaderboard</CardTitle>
                <CardDescription>Top performing students this month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'Alex Johnson', level: 12, xp: 2850, streak: 7, courses: 3 },
                    { name: 'Sarah Chen', level: 10, xp: 2340, streak: 5, courses: 2 },
                    { name: 'Mike Davis', level: 8, xp: 1920, streak: 3, courses: 2 },
                    { name: 'Emily Rodriguez', level: 11, xp: 2640, streak: 12, courses: 4 },
                  ].map((student, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-gray-600">Level {student.level} • {student.courses} courses</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge variant="outline">{student.xp} XP</Badge>
                        <Badge variant="outline">{student.streak} day streak</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gamification Tab */}
          <TabsContent value="gamification" className="space-y-6">
            <h2 className="text-2xl font-bold">Gamification Settings</h2>
            
            <div className="grid lg:grid-cols-2 gap-6">
              {/* XP Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Star className="w-5 h-5" />
                    <span>XP Rewards</span>
                  </CardTitle>
                  <CardDescription>Configure experience points for different activities</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="video-xp">Video Completion</Label>
                      <Input id="video-xp" type="number" defaultValue="50" />
                    </div>
                    <div>
                      <Label htmlFor="quiz-xp">Quiz Completion</Label>
                      <Input id="quiz-xp" type="number" defaultValue="75" />
                    </div>
                    <div>
                      <Label htmlFor="assignment-xp">Assignment Submission</Label>
                      <Input id="assignment-xp" type="number" defaultValue="100" />
                    </div>
                    <div>
                      <Label htmlFor="streak-xp">Daily Streak Bonus</Label>
                      <Input id="streak-xp" type="number" defaultValue="25" />
                    </div>
                  </div>
                  <Button className="w-full">Save XP Settings</Button>
                </CardContent>
              </Card>

              {/* Badge Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Trophy className="w-5 h-5" />
                    <span>Badge System</span>
                  </CardTitle>
                  <CardDescription>Manage badges and achievement thresholds</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {[
                      { name: 'First Course', icon: '🎓', threshold: '1 course' },
                      { name: 'Week Warrior', icon: '🔥', threshold: '7 day streak' },
                      { name: 'Quiz Master', icon: '🧠', threshold: '10 quizzes' },
                      { name: 'Streak Legend', icon: '⚡', threshold: '30 day streak' },
                    ].map((badge, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="text-xl">{badge.icon}</span>
                          <div>
                            <p className="font-medium">{badge.name}</p>
                            <p className="text-sm text-gray-600">{badge.threshold}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">Edit</Button>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Badge
                  </Button>
                </CardContent>
              </Card>

              {/* Lesson Creator */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Youtube className="w-5 h-5" />
                    <span>Create New Lesson</span>
                  </CardTitle>
                  <CardDescription>Add YouTube videos and set XP rewards</CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="lesson-title">Lesson Title</Label>
                        <Input id="lesson-title" placeholder="Enter lesson title" />
                      </div>
                      <div>
                        <Label htmlFor="lesson-xp">XP Reward</Label>
                        <Input id="lesson-xp" type="number" placeholder="50" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="youtube-url">YouTube Video URL</Label>
                      <div className="flex space-x-2">
                        <Input id="youtube-url" placeholder="https://youtube.com/watch?v=..." className="flex-1" />
                        <Button variant="outline" type="button">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="lesson-description">Description</Label>
                      <Textarea id="lesson-description" placeholder="Describe what students will learn..." />
                    </div>
                    <div className="flex space-x-2">
                      <Button type="submit">Create Lesson</Button>
                      <Button variant="outline" type="button">Save as Draft</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
