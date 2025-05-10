
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface ErrorDisplayProps {
  error: Error | string;
  onRetry?: () => void;
}

const ErrorDisplay = ({ error, onRetry }: ErrorDisplayProps) => {
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error fetching weather data</AlertTitle>
      <AlertDescription>
        <div className="mt-2">
          {errorMessage}
          {onRetry && (
            <button 
              onClick={onRetry}
              className="ml-4 underline hover:text-red-700"
            >
              Retry
            </button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default ErrorDisplay;
