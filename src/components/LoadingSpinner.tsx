
import { Skeleton } from "@/components/ui/skeleton";

const LoadingSpinner = () => {
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-center py-12">
        <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      </div>
      <Skeleton className="h-[400px] w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  );
};

export default LoadingSpinner;
