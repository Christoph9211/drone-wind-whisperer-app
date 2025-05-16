
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface ErrorDisplayProps {
  error: Error | string;
  onRetry?: () => void;
  actionText?: string;
  onAction?: () => void;
}

const ErrorDisplay = ({ error, onRetry, actionText, onAction }: ErrorDisplayProps) => {
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error fetching weather data</AlertTitle>
      <AlertDescription>
        <div className="mt-2">
          {errorMessage}
          <div className="mt-2 space-x-3">
            {onRetry && (
              <button 
                onClick={onRetry}
                className="underline hover:text-red-700"
              >
                Retry
              </button>
            )}
            {onAction && actionText && (
              <button 
                onClick={onAction}
                className="underline hover:text-red-700"
              >
                {actionText}
              </button>
            )}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default ErrorDisplay;
