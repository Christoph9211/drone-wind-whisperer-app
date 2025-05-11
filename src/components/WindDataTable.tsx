
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
import { Sunset } from "lucide-react";
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
  
  // Calculate sunset times for each date in data
  const getSunsetTimes = () => {
    const dates = [...new Set(windData.map(data => getDateString(data.timestamp)))];
    const dateObjects = dates.map(date => new Date(date));
    
    // For each date, find the last entry which has isDaytime=true
    const sunsets = dateObjects.map(date => {
      const sameDay = windData.filter(data => 
        getDateString(data.timestamp) === getDateString(date)
      );
      
      // Find the last daytime entry or the first nighttime entry
      const daytimeEntries = sameDay.filter(data => data.isDaytime);
      const nightTimeEntries = sameDay.filter(data => !data.isDaytime);
      
      if (daytimeEntries.length === 0) {
        return null; // No daytime entries for this date
      }
      
      if (nightTimeEntries.length === 0) {
        return daytimeEntries[daytimeEntries.length - 1].timestamp; // All daytime entries
      }
      
      // Get the last daytime entry
      const lastDaytime = daytimeEntries[daytimeEntries.length - 1];
      
      return lastDaytime.timestamp;
    });
    
    return sunsets.filter(Boolean).map(date => getDateString(date as Date));
  };
  
  const sunsetDates = getSunsetTimes();
  
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

  // Determine if a row represents sunset
  const isSunsetRow = (data: WindData, index: number, dataArray: WindData[]) => {
    if (index === dataArray.length - 1) return false;
    return data.isDaytime && !dataArray[index + 1].isDaytime;
  };

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
              
              // Check if this is a sunset row
              const isSunset = isSunsetRow(data, index, currentData);
              
              return (
                <>
                  <TableRow key={index} className={isSunset ? "border-b-2 border-amber-300" : ""}>
                    <TableCell>
                      <div className="flex items-center">
                        {data.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {isSunset && (
                          <Sunset className="ml-2 h-4 w-4 text-amber-500" />
                        )}
                      </div>
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
                  {isSunset && (
                    <TableRow key={`sunset-${index}`} className="bg-amber-50">
                      <TableCell colSpan={9} className="py-1 text-center text-amber-600 text-sm">
                        <div className="flex items-center justify-center">
                          <Sunset className="mr-2 h-4 w-4" />
                          Sunset
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
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
