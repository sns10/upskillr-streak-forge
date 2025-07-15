import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Award, X, Sparkles } from 'lucide-react';

interface Achievement {
  id: string;
  type: 'badge' | 'xp' | 'streak' | 'completion';
  title: string;
  description: string;
  icon?: string;
  timestamp: Date;
}

interface AchievementNotificationProps {
  achievement: Achievement | null;
  onDismiss: () => void;
  autoHide?: boolean;
  duration?: number;
}

const AchievementNotification = ({ 
  achievement, 
  onDismiss, 
  autoHide = true, 
  duration = 5000 
}: AchievementNotificationProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (achievement) {
      setIsVisible(true);
      
      if (autoHide) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(onDismiss, 300); // Wait for exit animation
        }, duration);
        
        return () => clearTimeout(timer);
      }
    }
  }, [achievement, autoHide, duration, onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  if (!achievement || !isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 w-80">
      <div className="transform transition-all duration-300 ease-out animate-in slide-in-from-top-full">
        <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-background to-primary/5 shadow-xl">
          {/* Animated background sparkles */}
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="absolute text-primary/30 animate-pulse"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.2}s`
                }}
              >
                <Sparkles className="w-4 h-4" />
              </div>
            ))}
          </div>

          <CardContent className="relative p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="p-2 rounded-full bg-primary/20 animate-bounce">
                  <Award className="w-6 h-6 text-primary" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm mb-1">
                    🎉 Achievement Unlocked!
                  </h3>
                  <h4 className="font-medium text-primary mb-1">
                    {achievement.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {achievement.description}
                  </p>
                  <Badge variant="secondary" className="mt-2 text-xs">
                    {achievement.type === 'badge' && 'New Badge'}
                    {achievement.type === 'xp' && 'XP Milestone'}
                    {achievement.type === 'streak' && 'Streak Achievement'}
                    {achievement.type === 'completion' && 'Course Complete'}
                  </Badge>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="text-muted-foreground hover:text-foreground shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AchievementNotification;