
import { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { WindData } from '@/utils/weatherApi';
import { 
  MAX_SAFE_WIND, 
  MAX_SAFE_GUST, 
  estimateWindAtHeight, 
  isSafeForDrones, 
  formatWindSpeed 
} from '@/utils/windCalculations';

interface WindDataTableProps {
  windData: WindData[];
}

const WindDataTable = ({ windData }: WindDataTableProps) => {
  // Group data by date
  const getDateString = (date: Date) => {
    return date.toLocaleDateString();
  };
  
  const groupedData = windData.reduce((acc, data) => {
    const dateKey = getDateString(data.timestamp);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(data);
    return acc;
  }, {} as Record<string, WindData[]>);
  
  // Get unique dates
  const dates = Object.keys(groupedData);
  const [selectedDate, setSelectedDate] = useState(dates[0]);
  
  const currentData = groupedData[selectedDate] || [];

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-medium mb-4">Hourly Wind Analysis</h3>
      
      {dates.length > 1 && (
        <div className="mb-4 flex space-x-2">
          {dates.map(date => (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className={`px-3 py-1 rounded-md ${
                selectedDate === date 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </button>
          ))}
        </div>
      )}
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>10m Wind</TableHead>
              <TableHead>20m Wind</TableHead>
              <TableHead>50m Wind</TableHead>
              <TableHead>80m Wind</TableHead>
              <TableHead>100m Wind</TableHead>
              <TableHead>120m Wind</TableHead>
              <TableHead>Gusts</TableHead>
              <TableHead>Safety</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.map((data, index) => {
              // Calculate wind at different heights
              const baseWind = data.windSpeed;
              const wind20m = estimateWindAtHeight(baseWind, 10, 20);
              const wind50m = estimateWindAtHeight(baseWind, 10, 50);
              const wind80m = estimateWindAtHeight(baseWind, 10, 80);
              const wind100m = estimateWindAtHeight(baseWind, 10, 100);
              const wind120m = estimateWindAtHeight(baseWind, 10, 120);
              
              // Check safety at each height
              const safe10m = isSafeForDrones(baseWind, data.windGust);
              const safe20m = isSafeForDrones(wind20m, data.windGust);
              const safe50m = isSafeForDrones(wind50m, data.windGust);
              const safe80m = isSafeForDrones(wind80m, data.windGust);
              const safe100m = isSafeForDrones(wind100m, data.windGust);
              const safe120m = isSafeForDrones(wind120m, data.windGust);
              
              // Overall safety
              const isOverallSafe = safe10m && safe20m && safe50m && safe80m && safe100m && safe120m;
              
              return (
                <TableRow key={index}>
                  <TableCell>
                    {data.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </TableCell>
                  <TableCell>
                    {formatWindSpeed(baseWind)}
                    {!safe10m && <span className="text-red-500 ml-1">❌</span>}
                  </TableCell>
                  <TableCell>
                    {formatWindSpeed(wind20m)}
                    {!safe20m && <span className="text-red-500 ml-1">❌</span>}
                  </TableCell>
                  <TableCell>
                    {formatWindSpeed(wind50m)}
                    {!safe50m && <span className="text-red-500 ml-1">❌</span>}
                  </TableCell>
                  <TableCell>
                    {formatWindSpeed(wind80m)}
                    {!safe80m && <span className="text-red-500 ml-1">❌</span>}
                  </TableCell>
                  <TableCell>
                    {formatWindSpeed(wind100m)}
                    {!safe100m && <span className="text-red-500 ml-1">❌</span>}
                  </TableCell>
                  <TableCell>
                    {formatWindSpeed(wind120m)}
                    {!safe120m && <span className="text-red-500 ml-1">❌</span>}
                  </TableCell>
                  <TableCell>
                    {data.windGust 
                      ? formatWindSpeed(data.windGust)
                      : 'No data'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={isOverallSafe ? "outline" : "destructive"}
                      className={isOverallSafe ? "bg-green-100 text-green-800 border-green-500" : ""}
                    >
                      {isOverallSafe ? "SAFE ✅" : "UNSAFE ❌"}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
            
            {currentData.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4">
                  No data available for this date
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default WindDataTable;
