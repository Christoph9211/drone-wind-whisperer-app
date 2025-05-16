
import ErrorDisplay from '@/components/ErrorDisplay';
import { toast } from "@/components/ui/use-toast";

interface WindDataErrorProps {
  error: Error | null;
  onRetry: () => void;
  onUseMockData: () => void;
}

const WindDataError = ({ error, onRetry, onUseMockData }: WindDataErrorProps) => {
  if (!error) return null;
  
  const handleUseMockData = () => {
    onUseMockData();
    toast({
      title: "Using mock data",
      description: "Real API data is not available."
    });
  };
  
  return (
    <div className="mb-6">
      <ErrorDisplay 
        error={error} 
        onRetry={onRetry}
        actionText="Use Mock Data"
        onAction={handleUseMockData}
      />
    </div>
  );
};

export default WindDataError;
