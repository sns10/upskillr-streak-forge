
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { createAdminAccount } from '@/utils/adminSetup';
import { UserPlus, Shield } from 'lucide-react';

const AdminAccountCreator = () => {
  const [email, setEmail] = useState('admin@upskillr.com');
  const [password, setPassword] = useState('password123');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    const result = await createAdminAccount(email, password);

    if (result.success) {
      toast({
        title: "Admin Account Created",
        description: `Admin account ${email} has been created successfully.`
      });
    } else {
      toast({
        variant: "destructive",
        title: "Failed to Create Admin",
        description: result.error
      });
    }

    setIsCreating(false);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="w-5 h-5" />
          <span>Create Admin Account</span>
        </CardTitle>
        <CardDescription>
          Create a new administrator account for the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreateAdmin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-email">Email</Label>
            <Input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-password">Password</Label>
            <Input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <Button 
            type="submit" 
            className="w-full"
            disabled={isCreating}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            {isCreating ? 'Creating Admin...' : 'Create Admin Account'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AdminAccountCreator;
