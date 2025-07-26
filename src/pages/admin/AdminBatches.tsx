
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/AdminLayout";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Users, Loader2 } from "lucide-react";

interface Batch {
  id: string;
  batch_name: string;
  start_date: string;
  created_at: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  batch_id: string | null;
  batches?: { batch_name: string };
}

export const AdminBatches = () => {
  // All hooks must be called at the top, before any conditional returns
  const { user, isAdmin, loading } = useAuth();
  const { toast } = useToast();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [batchFormData, setBatchFormData] = useState({
    batch_name: "",
    start_date: "",
  });
  const [userBatchId, setUserBatchId] = useState("");

  const fetchBatches = async () => {
    try {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBatches(data || []);
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast({
        title: "Error",
        description: "Failed to fetch batches",
        variant: "destructive",
      });
    } finally {
      setLoadingBatches(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          batches(batch_name)
        `)
        .order('name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchBatches();
    fetchUsers();
  }, []);

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingBatch) {
        const { error } = await supabase
          .from('batches')
          .update(batchFormData)
          .eq('id', editingBatch.id);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Batch updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('batches')
          .insert([batchFormData]);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Batch created successfully",
        });
      }
      
      setIsBatchDialogOpen(false);
      setEditingBatch(null);
      resetBatchForm();
      fetchBatches();
    } catch (error) {
      console.error('Error saving batch:', error);
      toast({
        title: "Error",
        description: "Failed to save batch",
        variant: "destructive",
      });
    }
  };

  const handleUserBatchAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) return;

    try {
      // Convert "none" back to null for database storage
      const batchIdToStore = userBatchId === "none" ? null : userBatchId;
      
      const { error } = await supabase
        .from('user_profiles')
        .update({ batch_id: batchIdToStore })
        .eq('id', selectedUser.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "User batch assignment updated successfully",
      });
      
      setIsUserDialogOpen(false);
      setSelectedUser(null);
      setUserBatchId("");
      fetchUsers();
    } catch (error) {
      console.error('Error updating user batch:', error);
      toast({
        title: "Error",
        description: "Failed to update user batch assignment",
        variant: "destructive",
      });
    }
  };

  const handleEditBatch = (batch: Batch) => {
    setEditingBatch(batch);
    setBatchFormData({
      batch_name: batch.batch_name,
      start_date: batch.start_date,
    });
    setIsBatchDialogOpen(true);
  };

  const handleAssignUser = (user: UserProfile) => {
    setSelectedUser(user);
    // Convert null to "none" for select component
    setUserBatchId(user.batch_id || "none");
    setIsUserDialogOpen(true);
  };

  const handleDeleteBatch = async (batchId: string) => {
    if (!confirm("Are you sure you want to delete this batch?")) return;
    
    try {
      const { error } = await supabase
        .from('batches')
        .delete()
        .eq('id', batchId);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Batch deleted successfully",
      });
      fetchBatches();
      fetchUsers(); // Refresh users to update batch assignments
    } catch (error) {
      console.error('Error deleting batch:', error);
      toast({
        title: "Error",
        description: "Failed to delete batch",
        variant: "destructive",
      });
    }
  };

  const resetBatchForm = () => {
    setBatchFormData({ batch_name: "", start_date: "" });
    setEditingBatch(null);
  };

  // Now we can safely do conditional returns after all hooks are declared
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
            <h1 className="text-3xl font-bold text-gray-900">Batches</h1>
            <p className="text-gray-600">Manage student batches and assignments</p>
          </div>
          
          <Dialog open={isBatchDialogOpen} onOpenChange={setIsBatchDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetBatchForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Batch
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingBatch ? "Edit Batch" : "Create New Batch"}
                </DialogTitle>
                <DialogDescription>
                  {editingBatch ? "Update batch information" : "Add a new student batch"}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleBatchSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="batch_name">Batch Name</Label>
                  <Input
                    id="batch_name"
                    value={batchFormData.batch_name}
                    onChange={(e) => setBatchFormData({ ...batchFormData, batch_name: e.target.value })}
                    required
                    placeholder="e.g., Web Development Bootcamp 2024"
                  />
                </div>
                
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={batchFormData.start_date}
                    onChange={(e) => setBatchFormData({ ...batchFormData, start_date: e.target.value })}
                    required
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsBatchDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingBatch ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>All Batches</CardTitle>
              <CardDescription>Manage student batches</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingBatches ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch Name</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batches.map((batch) => (
                      <TableRow key={batch.id}>
                        <TableCell className="font-medium">{batch.batch_name}</TableCell>
                        <TableCell>{new Date(batch.start_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditBatch(batch)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteBatch(batch.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Student Assignments</CardTitle>
              <CardDescription>Assign students to batches</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Current Batch</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.batches?.batch_name || "Not assigned"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAssignUser(user)}
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Student to Batch</DialogTitle>
              <DialogDescription>
                Update batch assignment for {selectedUser?.name}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleUserBatchAssignment} className="space-y-4">
              <div>
                <Label htmlFor="user_batch">Batch Assignment</Label>
                <Select value={userBatchId} onValueChange={setUserBatchId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a batch (or leave empty to unassign)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No batch (unassign)</SelectItem>
                    {batches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.batch_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsUserDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Update Assignment
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};
