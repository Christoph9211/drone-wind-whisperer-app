
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WindData } from '@/utils/weatherApi';
import { 
  MAX_SAFE_WIND, 
  MAX_SAFE_GUST, 
  estimateWindAtHeight, 
  isSafeForDrones 
} from '@/utils/windCalculations';
import { ANALYSIS_HEIGHTS } from '@/utils/constants';

interface SafetyIndicatorProps {
  windData: WindData[];
}

const SafetyIndicator = ({ windData }: SafetyIndicatorProps) => {
  // Filter for current and near-future data
  const now = new Date();
  const nextTwoHours = windData.filter(data => {
    return data.timestamp >= now && 
          data.timestamp <= new Date(now.getTime() + 2 * 60 * 60 * 1000);
  });
  
  // If no near-future data, use the first available
  const relevantData = nextTwoHours.length > 0 ? nextTwoHours : windData.slice(0, 2);
  
  // Calculate safety status for each height
  const safetyByHeight = ANALYSIS_HEIGHTS.map(height => {
    // Check if safe at all relevant times
    const isSafeAtHeight = relevantData.every(data => {
      const windAtHeight = height === 10 
        ? data.windSpeed 
        : estimateWindAtHeight(data.windSpeed, 10, height);
      
      return isSafeForDrones(windAtHeight, data.windGust);
    });
    
    return {
      height,
      isSafe: isSafeAtHeight
    };
  });
  
  // Overall safety
  const isOverallSafe = safetyByHeight.every(s => s.isSafe);
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Current Safety Status</h3>
          <Badge
            variant={isOverallSafe ? "outline" : "destructive"}
            className={isOverallSafe 
              ? "bg-green-100 text-green-800 border-green-500" 
              : ""
            }
          >
            {isOverallSafe ? "SAFE FOR OPERATIONS" : "UNSAFE CONDITIONS"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {safetyByHeight.map(({ height, isSafe }) => (
            <div 
              key={height}
              className="p-3 rounded-lg text-center border"
            >
              <div className="text-lg font-bold">{height}m</div>
              <div className={`text-2xl mt-1 ${isSafe ? 'text-green-600' : 'text-red-600'}`}>
                {isSafe ? '✅' : '❌'}
              </div>
              <div className="text-sm mt-1">{isSafe ? 'Safe' : 'Unsafe'}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SafetyIndicator;
