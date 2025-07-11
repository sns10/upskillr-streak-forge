
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Trophy, Target, Zap, Users, GraduationCap, Star, Award } from 'lucide-react';
import StudentDashboard from '@/components/StudentDashboard';
import AdminDashboard from '@/components/AdminDashboard';

const Index = () => {
  const [currentView, setCurrentView] = useState<'login' | 'student' | 'admin'>('login');
  const [loginType, setLoginType] = useState<'student' | 'admin'>('student');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentView(loginType);
  };

  if (currentView === 'student') {
    return <StudentDashboard onLogout={() => setCurrentView('login')} />;
  }

  if (currentView === 'admin') {
    return <AdminDashboard onLogout={() => setCurrentView('login')} />;
  }

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
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span>Gamified Learning</span>
            </div>
            <div className="flex items-center space-x-1">
              <Zap className="w-4 h-4 text-orange-500" />
              <span>XP System</span>
            </div>
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
          </div>

          {/* Right side - Login form */}
          <div className="lg:pl-8">
            <Card className="w-full max-w-md mx-auto bg-white/80 backdrop-blur-md border-white/20 shadow-xl">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
                <CardDescription>Sign in to continue your learning journey</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={loginType} onValueChange={(value) => setLoginType(value as 'student' | 'admin')} className="mb-6">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="student">Student</TabsTrigger>
                    <TabsTrigger value="admin">Admin</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="student" className="mt-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span>Access your courses and track progress</span>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="admin" className="mt-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                      <Award className="w-4 h-4 text-purple-500" />
                      <span>Manage courses and gamification</span>
                    </div>
                  </TabsContent>
                </Tabs>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      required
                      className="bg-white/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      required
                      className="bg-white/50"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
                  >
                    Sign In as {loginType === 'student' ? 'Student' : 'Admin'}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <a href="#" className="text-sm text-blue-600 hover:text-blue-700">
                    Forgot your password?
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
