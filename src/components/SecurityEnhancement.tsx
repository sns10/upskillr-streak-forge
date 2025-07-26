import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Shield, 
  Lock, 
  Eye, 
  EyeOff, 
  Key, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Monitor,
  Settings,
  RefreshCw,
  Download,
  Bell,
  Smartphone,
  Laptop,
  Globe,
  User,
  Activity
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface SecurityEvent {
  id: string;
  type: 'login' | 'logout' | 'password_change' | 'suspicious_activity' | 'device_added';
  description: string;
  location: string;
  device: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ipAddress: string;
  userAgent: string;
}

interface SecuritySettings {
  twoFactorAuth: boolean;
  emailNotifications: boolean;
  loginAlerts: boolean;
  sessionTimeout: number;
  passwordStrength: 'weak' | 'medium' | 'strong';
  deviceManagement: boolean;
  activityLogging: boolean;
  suspiciousActivityDetection: boolean;
}

interface SecurityEnhancementProps {
  userId: string;
  userProfile: any;
}

export const SecurityEnhancement: React.FC<SecurityEnhancementProps> = ({
  userId,
  userProfile
}) => {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [settings, setSettings] = useState<SecuritySettings>({
    twoFactorAuth: false,
    emailNotifications: true,
    loginAlerts: true,
    sessionTimeout: 30,
    passwordStrength: 'medium',
    deviceManagement: true,
    activityLogging: true,
    suspiciousActivityDetection: true
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSecurityData();
  }, [userId]);

  const loadSecurityData = () => {
    setIsLoading(true);
    
    // Simulate loading security data
    setTimeout(() => {
      const mockEvents: SecurityEvent[] = [
        {
          id: '1',
          type: 'login',
          description: 'Successful login from new device',
          location: 'New York, NY, USA',
          device: 'iPhone 14 Pro',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          severity: 'low',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)'
        },
        {
          id: '2',
          type: 'suspicious_activity',
          description: 'Multiple failed login attempts detected',
          location: 'Unknown',
          device: 'Unknown Device',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          severity: 'high',
          ipAddress: '203.0.113.45',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        },
        {
          id: '3',
          type: 'password_change',
          description: 'Password successfully changed',
          location: 'San Francisco, CA, USA',
          device: 'MacBook Pro',
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          severity: 'medium',
          ipAddress: '10.0.0.15',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
        },
        {
          id: '4',
          type: 'device_added',
          description: 'New device authorized',
          location: 'London, UK',
          device: 'iPad Air',
          timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          severity: 'low',
          ipAddress: '172.16.0.25',
          userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X)'
        }
      ];

      setSecurityEvents(mockEvents);
      setIsLoading(false);
    }, 1000);
  };

  const updateSecuritySetting = (key: keyof SecuritySettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    toast({
      title: "Security Setting Updated",
      description: `${key.replace(/([A-Z])/g, ' $1').toLowerCase()} has been updated.`,
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-100 border-green-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'login': return <User className="h-4 w-4 text-green-600" />;
      case 'logout': return <User className="h-4 w-4 text-gray-600" />;
      case 'password_change': return <Key className="h-4 w-4 text-blue-600" />;
      case 'suspicious_activity': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'device_added': return <Smartphone className="h-4 w-4 text-purple-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPasswordStrengthColor = (strength: string) => {
    switch (strength) {
      case 'strong': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'weak': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const securityScore = () => {
    let score = 0;
    if (settings.twoFactorAuth) score += 25;
    if (settings.loginAlerts) score += 15;
    if (settings.deviceManagement) score += 20;
    if (settings.activityLogging) score += 15;
    if (settings.suspiciousActivityDetection) score += 25;
    return Math.min(score, 100);
  };

  const score = securityScore();

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Center
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600'}>
              Security Score: {score}/100
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={loadSecurityData}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Security Score */}
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2" style={{ color: score >= 80 ? '#16a34a' : score >= 60 ? '#ca8a04' : '#dc2626' }}>
                    {score}/100
                  </div>
                  <div className="text-lg font-medium mb-4">
                    {score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Improvement'}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div 
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${score}%`,
                        backgroundColor: score >= 80 ? '#16a34a' : score >= 60 ? '#ca8a04' : '#dc2626'
                      }}
                    ></div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your account security is {score >= 80 ? 'excellent' : score >= 60 ? 'good' : 'needs improvement'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    {securityEvents.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Security Events</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 mb-2">
                    {securityEvents.filter(e => e.severity === 'low').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Safe Activities</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600 mb-2">
                    {securityEvents.filter(e => e.severity === 'high' || e.severity === 'critical').length}
                  </div>
                  <div className="text-sm text-muted-foreground">High Risk Events</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-2">
                    {settings.twoFactorAuth ? 'Enabled' : 'Disabled'}
                  </div>
                  <div className="text-sm text-muted-foreground">2FA Status</div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Recent Security Activity</h3>
                <div className="space-y-3">
                  {securityEvents.slice(0, 3).map((event) => (
                    <div key={event.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      {getEventIcon(event.type)}
                      <div className="flex-1">
                        <div className="font-medium text-sm">{event.description}</div>
                        <div className="text-xs text-muted-foreground">
                          {event.location} • {new Date(event.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge className={getSeverityColor(event.severity)}>
                        {event.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-4">
            <div className="space-y-4">
              {securityEvents.map((event) => (
                <Card key={event.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {getEventIcon(event.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{event.description}</h3>
                          <Badge className={getSeverityColor(event.severity)}>
                            {event.severity}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{event.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Monitor className="h-4 w-4" />
                            <span>{event.device}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            <span>{event.ipAddress}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{new Date(event.timestamp).toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="text-xs bg-gray-100 p-2 rounded">
                          <strong>User Agent:</strong> {event.userAgent}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-6">
              {/* Two-Factor Authentication */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Two-Factor Authentication</h3>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Switch
                      checked={settings.twoFactorAuth}
                      onCheckedChange={(checked) => updateSecuritySetting('twoFactorAuth', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Email Notifications */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Email Notifications</h3>
                      <p className="text-sm text-muted-foreground">
                        Receive security alerts via email
                      </p>
                    </div>
                    <Switch
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => updateSecuritySetting('emailNotifications', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Login Alerts */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Login Alerts</h3>
                      <p className="text-sm text-muted-foreground">
                        Get notified of new login attempts
                      </p>
                    </div>
                    <Switch
                      checked={settings.loginAlerts}
                      onCheckedChange={(checked) => updateSecuritySetting('loginAlerts', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Device Management */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Device Management</h3>
                      <p className="text-sm text-muted-foreground">
                        Monitor and manage connected devices
                      </p>
                    </div>
                    <Switch
                      checked={settings.deviceManagement}
                      onCheckedChange={(checked) => updateSecuritySetting('deviceManagement', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Activity Logging */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Activity Logging</h3>
                      <p className="text-sm text-muted-foreground">
                        Log all account activities for security monitoring
                      </p>
                    </div>
                    <Switch
                      checked={settings.activityLogging}
                      onCheckedChange={(checked) => updateSecuritySetting('activityLogging', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Suspicious Activity Detection */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Suspicious Activity Detection</h3>
                      <p className="text-sm text-muted-foreground">
                        Automatically detect and alert on suspicious activities
                      </p>
                    </div>
                    <Switch
                      checked={settings.suspiciousActivityDetection}
                      onCheckedChange={(checked) => updateSecuritySetting('suspiciousActivityDetection', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Password Strength */}
              <Card>
                <CardContent className="p-4">
                  <div>
                    <h3 className="font-semibold mb-2">Password Strength</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`font-medium ${getPasswordStrengthColor(settings.passwordStrength)}`}>
                        {settings.passwordStrength.charAt(0).toUpperCase() + settings.passwordStrength.slice(1)}
                      </span>
                      <Badge variant="outline" className={getPasswordStrengthColor(settings.passwordStrength)}>
                        {settings.passwordStrength === 'strong' ? 'Excellent' : 
                         settings.passwordStrength === 'medium' ? 'Good' : 'Weak'}
                      </Badge>
                    </div>
                    <Button size="sm" variant="outline">
                      <Key className="h-4 w-4 mr-2" />
                      Change Password
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}; 