
import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { WindData } from '@/utils/weatherApi';
import { MAX_SAFE_WIND, MAX_SAFE_GUST, estimateWindAtHeight, msToMph } from '@/utils/windCalculations';

interface WindChartData {
  time: string;
  wind10m: number;
  wind50m: number;
  wind80m: number;
  wind100m: number;
  gust?: number;
}

interface WindSpeedChartProps {
  windData: WindData[];
  showMph?: boolean;
}

const WindSpeedChart = ({ windData, showMph = false }: WindSpeedChartProps) => {
  const [showGusts, setShowGusts] = useState(true);
  
  // Transform wind data for chart
  const chartData: WindChartData[] = windData.map(data => {
    // Calculate estimated wind speeds at different altitudes
    const baseSpeed = data.windSpeed;
    const speed50m = estimateWindAtHeight(baseSpeed, 10, 50);
    const speed80m = estimateWindAtHeight(baseSpeed, 10, 80);
    const speed100m = estimateWindAtHeight(baseSpeed, 10, 100);
    
    // Convert if needed
    const conversionFactor = showMph ? 1 / 0.44704 : 1;
    
    return {
      time: data.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      wind10m: baseSpeed * conversionFactor,
      wind50m: speed50m * conversionFactor,
      wind80m: speed80m * conversionFactor,
      wind100m: speed100m * conversionFactor,
      gust: data.windGust ? data.windGust * conversionFactor : undefined
    };
  });
  
  // Safety threshold converted if needed
  const safeWindThreshold = showMph ? msToMph(MAX_SAFE_WIND) : MAX_SAFE_WIND;
  const safeGustThreshold = showMph ? msToMph(MAX_SAFE_GUST) : MAX_SAFE_GUST;

  // Format tooltip values
  const formatTooltipValue = (value: number) => {
    return `${value.toFixed(1)} ${showMph ? 'mph' : 'm/s'}`;
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-medium mb-4">Wind Speed Analysis</h3>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="time"
              label={{ value: 'Time', position: 'insideBottomRight', offset: -10 }}
            />
            <YAxis 
              label={{ 
                value: showMph ? 'Wind Speed (mph)' : 'Wind Speed (m/s)', 
                angle: -90, 
                position: 'insideLeft' 
              }}
            />
            <Tooltip 
              formatter={(value: number) => formatTooltipValue(value)}
              labelFormatter={(label) => `Time: ${label}`}
            />
            <Legend />
            
            {/* Reference line for safety threshold */}
            <ReferenceLine 
              y={safeWindThreshold} 
              label="Max Safe Wind" 
              stroke="red" 
              strokeDasharray="3 3" 
            />
            
            {showGusts && windData.some(d => d.windGust !== undefined) && (
              <ReferenceLine 
                y={safeGustThreshold} 
                label="Max Safe Gust" 
                stroke="orange" 
                strokeDasharray="3 3" 
              />
            )}
            
            {/* Wind speed lines */}
            <Line 
              type="monotone" 
              dataKey="wind10m" 
              name="10m Height" 
              stroke="#8884d8" 
              activeDot={{ r: 8 }} 
            />
            <Line 
              type="monotone" 
              dataKey="wind50m" 
              name="50m Height" 
              stroke="#82ca9d" 
              activeDot={{ r: 8 }} 
            />
            <Line 
              type="monotone" 
              dataKey="wind80m" 
              name="80m Height" 
              stroke="#ffc658" 
              activeDot={{ r: 8 }} 
            />
            <Line 
              type="monotone" 
              dataKey="wind100m" 
              name="100m Height" 
              stroke="#ff8042" 
              activeDot={{ r: 8 }} 
            />
            
            {/* Gust line */}
            {showGusts && windData.some(d => d.windGust !== undefined) && (
              <Line 
                type="monotone" 
                dataKey="gust" 
                name="Wind Gusts" 
                stroke="#ff0000" 
                strokeDasharray="5 5"
                activeDot={{ r: 8 }} 
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {windData.some(d => d.windGust !== undefined) && (
        <div className="flex items-center mt-2">
          <input
            type="checkbox"
            id="showGusts"
            checked={showGusts}
            onChange={() => setShowGusts(!showGusts)}
            className="mr-2"
          />
          <label htmlFor="showGusts">Show Wind Gusts</label>
        </div>
      )}
    </div>
  );
};

export default WindSpeedChart;
