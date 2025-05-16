
import { useState } from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import LocationInput from '@/components/LocationInput';

interface WindAnalysisSettingsProps {
  onLocationChange: (latitude: number, longitude: number) => void;
  useMockData: boolean;
  setUseMockData: (value: boolean) => void;
  useEstimation: boolean;
  setUseEstimation: (value: boolean) => void;
  onRefreshData: () => void;
  nearestStation: { name: string } | null;
}

const WindAnalysisSettings = ({
  onLocationChange,
  useMockData,
  setUseMockData,
  useEstimation,
  setUseEstimation,
  onRefreshData,
  nearestStation
}: WindAnalysisSettingsProps) => {
  return (
    <div className="space-y-6">
      <LocationInput onLocationChange={onLocationChange} />
      
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-medium mb-2">Safety Thresholds</h3>
        <ul className="space-y-2">
          <li className="flex justify-between">
            <span>Max Safe Wind:</span>
            <span className="font-medium">11.0 m/s (24.6 mph)</span>
          </li>
          <li className="flex justify-between">
            <span>Max Safe Gust:</span>
            <span className="font-medium">12.0 m/s (26.8 mph)</span>
          </li>
        </ul>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-medium mb-2">Data Source</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch 
              id="mock-data" 
              checked={useMockData} 
              onCheckedChange={setUseMockData}
            />
            <Label htmlFor="mock-data">Use Mock Data</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch 
              id="gust-estimation" 
              checked={useEstimation} 
              disabled={useMockData}
              onCheckedChange={setUseEstimation}
            />
            <Label htmlFor="gust-estimation">
              Gust Estimation
              <span className="block text-xs text-gray-500">
                When observation data is unavailable
              </span>
            </Label>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-medium mb-2">Analysis Settings</h3>
        <ul className="space-y-2">
          <li className="flex justify-between">
            <span>Analysis Heights:</span>
            <span className="font-medium">10m, 20m, 50m, 80m, 100m, 120m</span>
          </li>
          <li className="flex justify-between">
            <span>Wind Model:</span>
            <span className="font-medium">Power Law (α=1/7)</span>
          </li>
          <li className="flex justify-between">
            <span>Data Source:</span>
            <span className="font-medium">
              {useMockData ? 'Mock Data' : nearestStation ? `NWS API + ${nearestStation.name}` : 'NWS API'}
            </span>
          </li>
        </ul>
      </div>
      
      <button 
        onClick={onRefreshData}
        className="w-full bg-primary hover:bg-primary/90 text-white py-2 px-4 rounded-md"
      >
        Refresh Data
      </button>
    </div>
  );
};

export default WindAnalysisSettings;
