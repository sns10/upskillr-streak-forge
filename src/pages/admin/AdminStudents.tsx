
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/AdminLayout";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { checkAndResetStreak } from "@/lib/streakManager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Eye } from "lucide-react";

interface Student {
  id: string;
  name: string;
  email: string;
  xp: number;
  bits: number;
  streak: number;
  last_activity_date: string | null;
  created_at: string;
  batches?: {
    batch_name: string;
  };
}

export const AdminStudents = () => {
  const { user, isAdmin, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!loading && user && isAdmin) {
      fetchStudents();
    }
  }, [loading, user, isAdmin]);

  useEffect(() => {
    const filtered = students.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.batches?.batch_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStudents(filtered);
  }, [searchTerm, students]);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          batches (
            batch_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Check and reset streaks for all students before displaying
      if (data) {
        await Promise.all(data.map(student => checkAndResetStreak(student.id)));
        
        // Fetch updated data after streak resets
        const { data: updatedData, error: updateError } = await supabase
          .from('user_profiles')
          .select(`
            *,
            batches (
              batch_name
            )
          `)
          .order('created_at', { ascending: false });
          
        if (updateError) throw updateError;
        setStudents(updatedData || []);
      } else {
        setStudents([]);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error",
        description: "Failed to fetch students",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getActivityStatus = (lastActivity: string | null) => {
    if (!lastActivity) return { status: "Never", variant: "secondary" as const };
    
    const daysSince = Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSince === 0) return { status: "Today", variant: "default" as const };
    if (daysSince <= 7) return { status: `${daysSince}d ago`, variant: "default" as const };
    if (daysSince <= 30) return { status: `${daysSince}d ago`, variant: "secondary" as const };
    return { status: `${daysSince}d ago`, variant: "destructive" as const };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <AdminLayout user={user}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Students</h1>
            <p className="text-gray-600">Manage and view student analytics</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Student Directory</CardTitle>
            <CardDescription>
              Search and view all registered students
            </CardDescription>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>XP</TableHead>
                    <TableHead>Bits</TableHead>
                    <TableHead>Streak</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => {
                    const activityStatus = getActivityStatus(student.last_activity_date);
                    return (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>
                          {student.batches?.batch_name ? (
                            <Badge variant="outline">{student.batches.batch_name}</Badge>
                          ) : (
                            <span className="text-gray-400">No batch</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{student.xp} XP</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{student.bits} bits</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={student.streak > 0 ? "default" : "secondary"}
                          >
                            {student.streak} day{student.streak !== 1 ? 's' : ''}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={activityStatus.variant}>
                            {activityStatus.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(student.created_at)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/admin/students/${student.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredStudents.length === 0 && !isLoading && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                        {searchTerm ? "No students found matching your search." : "No students found."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};
