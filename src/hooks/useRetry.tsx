
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseRetryOptions {
  maxAttempts?: number;
  delay?: number;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const useRetry = (options: UseRetryOptions = {}) => {
  const { maxAttempts = 3, delay = 1000, onSuccess, onError } = options;
  const [isRetrying, setIsRetrying] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const { toast } = useToast();

  const retry = useCallback(async (asyncFn: () => Promise<any>) => {
    setIsRetrying(true);
    let currentAttempt = 0;

    while (currentAttempt < maxAttempts) {
      try {
        const result = await asyncFn();
        setAttemptCount(0);
        setIsRetrying(false);
        onSuccess?.();
        return result;
      } catch (error) {
        currentAttempt++;
        setAttemptCount(currentAttempt);
        
        if (currentAttempt >= maxAttempts) {
          setIsRetrying(false);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          toast({
            title: "Operation Failed",
            description: `Failed after ${maxAttempts} attempts: ${errorMessage}`,
            variant: "destructive",
          });
          onError?.(error instanceof Error ? error : new Error(errorMessage));
          throw error;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * currentAttempt));
      }
    }
  }, [maxAttempts, delay, onSuccess, onError, toast]);

  return { retry, isRetrying, attemptCount };
};
