
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Trophy, Target, Zap, Users, GraduationCap, Star, Award, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import StudentDashboard from '@/components/StudentDashboard';
import AdminDashboard from '@/components/AdminDashboard';

const Index = () => {
  const { user, userRole, loading, signOut } = useAuth();

  // Show loading state while auth is being determined
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-10 h-10 text-white animate-pulse" />
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show appropriate dashboard if user is authenticated
  if (user && userRole) {
    if (userRole === 'student') {
      return <StudentDashboard onLogout={signOut} />;
    }
    if (userRole === 'admin') {
      return <AdminDashboard onLogout={signOut} />;
    }
  }

  // Show landing page for unauthenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="px-6 py-4 bg-white/80 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Upskillr
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span>Gamified Learning</span>
              </div>
              <div className="flex items-center space-x-1">
                <Zap className="w-4 h-4 text-orange-500" />
                <span>XP System</span>
              </div>
            </div>
            {user ? (
              <Button onClick={signOut} variant="outline" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            ) : (
              <Link to="/auth">
                <Button size="sm">
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Hero content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-5xl font-bold text-gray-900 leading-tight">
                Level Up Your
                <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Learning Journey
                </span>
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                Experience education like never before with our gamified LMS. Earn XP, maintain streaks, 
                and unlock achievements as you master new skills.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-4 bg-white/60 rounded-xl backdrop-blur-sm">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Video Learning</h3>
                  <p className="text-sm text-gray-600">YouTube integration</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-white/60 rounded-xl backdrop-blur-sm">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Assignments</h3>
                  <p className="text-sm text-gray-600">Google Sheets sync</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-white/60 rounded-xl backdrop-blur-sm">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">XP System</h3>
                  <p className="text-sm text-gray-600">Earn & level up</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-white/60 rounded-xl backdrop-blur-sm">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Leaderboards</h3>
                  <p className="text-sm text-gray-600">Compete & excel</p>
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Get Started
                </Button>
              </Link>
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </div>
          </div>

          {/* Right side - Quick info or demo */}
          <div className="lg:pl-8">
            <Card className="w-full max-w-md mx-auto bg-white/80 backdrop-blur-md border-white/20 shadow-xl">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">Ready to Start?</CardTitle>
                <CardDescription>Join thousands of learners already leveling up their skills</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <Star className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900">Interactive Learning</p>
                      <p className="text-sm text-blue-700">Engage with video content and quizzes</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                    <Award className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-medium text-purple-900">Earn Rewards</p>
                      <p className="text-sm text-purple-700">Unlock badges and climb leaderboards</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <Zap className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">Track Progress</p>
                      <p className="text-sm text-green-700">Monitor your learning streaks and XP</p>
                    </div>
                  </div>
                </div>
                
                <Link to="/auth" className="block">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    Join Upskillr Today
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
