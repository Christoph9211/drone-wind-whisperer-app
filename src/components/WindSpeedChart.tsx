
import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Sunset } from "lucide-react";
import { WindData } from '@/utils/weatherApi';
import { MAX_SAFE_WIND, MAX_SAFE_GUST, estimateWindAtHeight, msToMph } from '@/utils/windCalculations';

interface WindChartData {
  time: string;
  wind10m: number;
  wind20m: number;
  wind50m: number;
  wind80m: number;
  wind100m: number;
  wind120m: number;
  gust?: number;
  isSunset?: boolean;
}

interface WindSpeedChartProps {
  windData: WindData[];
  showMph?: boolean;
}

const WindSpeedChart = ({ windData, showMph = false }: WindSpeedChartProps) => {
  const [showGusts, setShowGusts] = useState(true);
  
  // Find sunset times - where isDaytime changes from true to false
  const findSunsetIndices = () => {
    const sunsetIndices: number[] = [];
    
    for (let i = 0; i < windData.length - 1; i++) {
      if (windData[i].isDaytime && !windData[i + 1].isDaytime) {
        sunsetIndices.push(i);
      }
    }
    
    return sunsetIndices;
  };
  
  const sunsetIndices = findSunsetIndices();
  
  // Transform wind data for chart
  const chartData: WindChartData[] = windData.map((data, index) => {
    // Calculate estimated wind speeds at different altitudes
    const baseSpeed = data.windSpeed;
    const speed20m = estimateWindAtHeight(baseSpeed, 10, 20);
    const speed50m = estimateWindAtHeight(baseSpeed, 10, 50);
    const speed80m = estimateWindAtHeight(baseSpeed, 10, 80);
    const speed100m = estimateWindAtHeight(baseSpeed, 10, 100);
    const speed120m = estimateWindAtHeight(baseSpeed, 10, 120);
    
    // Convert if needed
    const conversionFactor = showMph ? 1 / 0.44704 : 1;
    
    // Check if this is a sunset point
    const isSunset = sunsetIndices.includes(index);
    
    return {
      time: data.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      wind10m: baseSpeed * conversionFactor,
      wind20m: speed20m * conversionFactor,
      wind50m: speed50m * conversionFactor,
      wind80m: speed80m * conversionFactor,
      wind100m: speed100m * conversionFactor,
      wind120m: speed120m * conversionFactor,
      gust: data.windGust ? data.windGust * conversionFactor : undefined,
      isSunset
    };
  });
  
  // Safety threshold converted if needed
  const safeWindThreshold = showMph ? msToMph(MAX_SAFE_WIND) : MAX_SAFE_WIND;
  const safeGustThreshold = showMph ? msToMph(MAX_SAFE_GUST) : MAX_SAFE_GUST;

  // Format tooltip values
  const formatTooltipValue = (value: number) => {
    return `${value.toFixed(1)} ${showMph ? 'mph' : 'm/s'}`;
  };
  
  // Custom tooltip component to show sunset indicator
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    
    const dataPoint = payload[0].payload;
    
    return (
      <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
        <p className="font-medium">{label}</p>
        {dataPoint.isSunset && (
          <div className="flex items-center text-amber-600 mb-1">
            <Sunset className="h-4 w-4 mr-1" />
            <span>Sunset</span>
          </div>
        )}
        {payload.map((entry: any) => (
          <p 
            key={entry.name} 
            className="text-sm" 
            style={{ color: entry.color }}
          >
            {entry.name}: {entry.value.toFixed(1)} {showMph ? 'mph' : 'm/s'}
          </p>
        ))}
      </div>
    );
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
            <Tooltip content={<CustomTooltip />} />
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
            
            {/* Sunset reference lines */}
            {sunsetIndices.map((idx) => {
              const time = windData[idx].timestamp.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              });
              return (
                <ReferenceLine 
                  key={`sunset-${idx}`}
                  x={time}
                  stroke="orange"
                  label={{ 
                    value: "Sunset", 
                    position: "top", 
                    fill: "orange" 
                  }}
                />
              );
            })}
            
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
              dataKey="wind20m" 
              name="20m Height" 
              stroke="#4CAF50" 
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
            <Line 
              type="monotone" 
              dataKey="wind120m" 
              name="120m Height" 
              stroke="#9c27b0" 
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
