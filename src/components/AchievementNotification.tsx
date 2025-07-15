import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Award, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

  if (!achievement) return null;

  return (
    <div className="fixed top-4 right-4 z-50 w-80">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-background to-primary/5 shadow-xl">
              {/* Animated background sparkles */}
              <div className="absolute inset-0 overflow-hidden">
                {Array.from({ length: 6 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-primary/30"
                    initial={{ 
                      opacity: 0, 
                      scale: 0,
                      x: Math.random() * 100 + '%',
                      y: Math.random() * 100 + '%'
                    }}
                    animate={{ 
                      opacity: [0, 1, 0], 
                      scale: [0, 1, 0],
                      rotate: 360
                    }}
                    transition={{ 
                      duration: 2, 
                      delay: i * 0.2,
                      repeat: Infinity,
                      repeatDelay: 3
                    }}
                  >
                    <Sparkles className="w-4 h-4" />
                  </motion.div>
                ))}
              </div>

              <CardContent className="relative p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <motion.div
                      className="p-2 rounded-full bg-primary/20"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.2, type: "spring" }}
                    >
                      <Award className="w-6 h-6 text-primary" />
                    </motion.div>
                    
                    <div className="flex-1 min-w-0">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                      >
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
                      </motion.div>
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AchievementNotification;