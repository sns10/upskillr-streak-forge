
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  Flame, 
  Star, 
  BookOpen, 
  PlayCircle, 
  CheckCircle, 
  Clock,
  Target,
  Award,
  Zap,
  Calendar,
  Users,
  LogOut
} from 'lucide-react';

interface StudentDashboardProps {
  onLogout: () => void;
}

const StudentDashboard = ({ onLogout }: StudentDashboardProps) => {
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  // Mock data
  const studentData = {
    name: "Alex Johnson",
    level: 12,
    xp: 2850,
    xpToNext: 3200,
    streak: 7,
    totalBadges: 15,
    coursesCompleted: 3,
    coursesInProgress: 2
  };

  const courses = [
    {
      id: '1',
      title: 'React Fundamentals',
      progress: 75,
      totalLessons: 20,
      completedLessons: 15,
      xpEarned: 850,
      status: 'in-progress',
      thumbnail: '🚀'
    },
    {
      id: '2',
      title: 'TypeScript Mastery',
      progress: 40,
      totalLessons: 25,
      completedLessons: 10,
      xpEarned: 420,
      status: 'in-progress',
      thumbnail: '⚡'
    },
    {
      id: '3',
      title: 'JavaScript Basics',
      progress: 100,
      totalLessons: 15,
      completedLessons: 15,
      xpEarned: 650,
      status: 'completed',
      thumbnail: '✨'
    }
  ];

  const recentActivities = [
    { type: 'video', title: 'Component Props & State', xp: 50, time: '2 hours ago' },
    { type: 'quiz', title: 'React Hooks Quiz', xp: 75, time: '1 day ago' },
    { type: 'assignment', title: 'Build a Todo App', xp: 100, time: '2 days ago' },
  ];

  const badges = [
    { name: 'First Course', icon: '🎓', earned: true },
    { name: 'Week Warrior', icon: '🔥', earned: true },
    { name: 'Quiz Master', icon: '🧠', earned: true },
    { name: 'Streak Legend', icon: '⚡', earned: false },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="px-6 py-4 bg-white/80 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Welcome back, {studentData.name}!</h1>
              <p className="text-sm text-gray-600">Level {studentData.level} • {studentData.streak} day streak 🔥</p>
            </div>
          </div>
          <Button variant="outline" onClick={onLogout} className="flex items-center space-x-2">
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Stats Cards */}
          <div className="lg:col-span-1 space-y-4">
            {/* XP Progress */}
            <Card className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <span>Level {studentData.level}</span>
                  <Zap className="w-5 h-5" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{studentData.xp} XP</span>
                    <span>{studentData.xpToNext} XP</span>
                  </div>
                  <Progress 
                    value={(studentData.xp / studentData.xpToNext) * 100} 
                    className="bg-white/20"
                  />
                  <p className="text-xs opacity-90">
                    {studentData.xpToNext - studentData.xp} XP to next level
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Streak Card */}
            <Card className="bg-gradient-to-br from-orange-400 to-red-500 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <span>Streak</span>
                  <Flame className="w-5 h-5" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold">{studentData.streak}</div>
                  <p className="text-sm opacity-90">days in a row</p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Badges</span>
                  <Badge variant="secondary">{studentData.totalBadges}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Completed</span>
                  <Badge variant="secondary">{studentData.coursesCompleted}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">In Progress</span>
                  <Badge variant="secondary">{studentData.coursesInProgress}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Courses Grid */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">My Courses</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {courses.map((course) => (
                  <Card 
                    key={course.id} 
                    className="hover:shadow-lg transition-all duration-300 cursor-pointer"
                    onClick={() => setSelectedCourse(course.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">{course.thumbnail}</div>
                          <div>
                            <CardTitle className="text-lg">{course.title}</CardTitle>
                            <CardDescription>
                              {course.completedLessons}/{course.totalLessons} lessons
                            </CardDescription>
                          </div>
                        </div>
                        <Badge 
                          variant={course.status === 'completed' ? 'default' : 'secondary'}
                          className={course.status === 'completed' ? 'bg-green-500' : ''}
                        >
                          {course.status === 'completed' ? 'Completed' : 'In Progress'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{course.progress}%</span>
                          </div>
                          <Progress value={course.progress} />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm font-medium">{course.xpEarned} XP</span>
                          </div>
                          <Button size="sm" variant="outline">
                            {course.status === 'completed' ? 'Review' : 'Continue'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Recent Activity & Badges */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="w-5 h-5" />
                    <span>Recent Activity</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          {activity.type === 'video' && <PlayCircle className="w-4 h-4 text-blue-600" />}
                          {activity.type === 'quiz' && <Target className="w-4 h-4 text-green-600" />}
                          {activity.type === 'assignment' && <BookOpen className="w-4 h-4 text-purple-600" />}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{activity.title}</p>
                          <p className="text-xs text-gray-600">{activity.time}</p>
                        </div>
                      </div>
                      <Badge variant="outline">+{activity.xp} XP</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Badges */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="w-5 h-5" />
                    <span>Badges</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {badges.map((badge, index) => (
                      <div 
                        key={index} 
                        className={`p-3 rounded-lg text-center ${
                          badge.earned ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50 opacity-50'
                        }`}
                      >
                        <div className="text-2xl mb-1">{badge.icon}</div>
                        <p className="text-xs font-medium">{badge.name}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
