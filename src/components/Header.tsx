
import { User, Trophy, Zap, Flame, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useResponsive } from "@/hooks/useResponsive";

interface HeaderProps {
  user: any;
  profile: any;
}

export const Header = ({ user, profile }: HeaderProps) => {
  const { toast } = useToast();
  const { isMobile, isTablet } = useResponsive();

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

  return (
    <header className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg sticky top-0 z-40">
      <div className={`container mx-auto px-4 py-3 md:py-4 flex justify-between items-center ${isMobile ? 'px-2' : ''}`}>
        <div className="flex items-center space-x-2">
          <Trophy className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'}`} />
          <h1 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>
            {isMobile ? "Upskillr" : "Upskillr"}
          </h1>
        </div>
        
        {user && profile && (
          <div className="flex items-center space-x-2 md:space-x-6">
            <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-4'}`}>
              <div className="flex items-center space-x-1">
                <Zap className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-yellow-300`} />
                <span className={`font-semibold ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  {isMobile ? profile.xp : `${profile.xp} XP`}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <div className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} bg-blue-400 rounded-full`} />
                <span className={`font-semibold ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  {isMobile ? profile.bits : `${profile.bits} Bits`}
                </span>
              </div>
              {!isMobile && (
                <div className="flex items-center space-x-1">
                  <Flame className="h-4 w-4 text-orange-400" />
                  <span className="font-semibold text-sm">{profile.streak} Day Streak</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2 md:space-x-3">
              {!isMobile && (
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span className="text-sm">{profile.name}</span>
                </div>
              )}
              <Button
                variant="ghost"
                size={isMobile ? "sm" : "sm"}
                onClick={handleSignOut}
                className="text-white hover:bg-white/20 p-2"
              >
                <LogOut className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
