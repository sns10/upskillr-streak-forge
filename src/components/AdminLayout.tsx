
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Settings, 
  BookOpen, 
  Play, 
  Code, 
  Users, 
  Home, 
  LogOut,
  Trophy,
  GraduationCap,
  HelpCircle
} from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
  user: any;
}

export const AdminLayout = ({ children, user }: AdminLayoutProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  const menuItems = [
    { path: "/admin", icon: Home, label: "Dashboard" },
    { path: "/admin/courses", icon: BookOpen, label: "Courses" },
    { path: "/admin/lessons", icon: Play, label: "Lessons" },
    { path: "/admin/assignments", icon: Code, label: "Assignments" },
    { path: "/admin/quizzes", icon: HelpCircle, label: "Quizzes" },
    { path: "/admin/batches", icon: Users, label: "Batches" },
    { path: "/admin/students", icon: GraduationCap, label: "Students" },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation Bar */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <Trophy className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Upskillr Admin</h1>
            </div>

            {/* User Info */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/")}
                className="text-gray-600 hover:text-gray-900"
              >
                Back to App
              </Button>
              <span className="text-gray-700">{user?.email}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <div className="flex">
        <aside className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-[calc(100vh-4rem)]">
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Button
                  key={item.path}
                  variant="ghost"
                  className={`w-full justify-start text-gray-700 hover:bg-gray-100 ${
                    isActive ? "bg-blue-50 text-blue-600" : ""
                  }`}
                  onClick={() => navigate(item.path)}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  {item.label}
                </Button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
