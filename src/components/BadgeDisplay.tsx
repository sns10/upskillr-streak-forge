import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Crown, Star, Trophy, Award, Zap, Target } from 'lucide-react';

interface BadgeData {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  condition_type: string;
  condition_value: number;
  earned_at?: string;
}

interface BadgeDisplayProps {
  badge: BadgeData;
  earned?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showDescription?: boolean;
}

const getIconComponent = (iconName: string | null) => {
  switch (iconName?.toLowerCase()) {
    case 'crown':
      return Crown;
    case 'star':
      return Star;
    case 'trophy':
      return Trophy;
    case 'award':
      return Award;
    case 'zap':
      return Zap;
    case 'target':
      return Target;
    default:
      return Award;
  }
};

const BadgeDisplay = ({ 
  badge, 
  earned = false, 
  size = 'md', 
  showDescription = true 
}: BadgeDisplayProps) => {
  const IconComponent = getIconComponent(badge.icon);
  
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <Card className={`relative transition-all duration-300 ${
      earned 
        ? 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 shadow-lg hover:shadow-xl' 
        : 'bg-muted/30 border-muted opacity-60'
    }`}>
      <CardContent className="p-4 text-center">
        <div className={`mx-auto ${sizeClasses[size]} flex items-center justify-center rounded-full ${
          earned 
            ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg' 
            : 'bg-muted text-muted-foreground'
        }`}>
          <IconComponent className={iconSizes[size]} />
        </div>
        
        <h3 className={`font-semibold mt-3 ${
          size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base'
        }`}>
          {badge.name}
        </h3>
        
        {showDescription && badge.description && (
          <p className={`text-muted-foreground mt-1 ${
            size === 'sm' ? 'text-xs' : 'text-sm'
          }`}>
            {badge.description}
          </p>
        )}
        
        {earned && badge.earned_at && (
          <Badge variant="secondary" className="mt-2 text-xs">
            Earned {new Date(badge.earned_at).toLocaleDateString()}
          </Badge>
        )}
        
        {!earned && (
          <div className={`mt-2 text-xs text-muted-foreground ${
            size === 'sm' ? 'text-xs' : 'text-sm'
          }`}>
            {badge.condition_type === 'xp' && `Earn ${badge.condition_value} XP`}
            {badge.condition_type === 'streak' && `Maintain ${badge.condition_value} day streak`}
            {badge.condition_type === 'courses' && `Complete ${badge.condition_value} courses`}
            {badge.condition_type === 'quizzes' && `Complete ${badge.condition_value} quizzes`}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BadgeDisplay;