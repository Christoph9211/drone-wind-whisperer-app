
import { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import WindAnalysisContent from '@/components/WindAnalysisContent';
import WindAnalysisSettings from '@/components/WindAnalysisSettings';
import WindDataError from '@/components/WindDataError';
import { useWindData } from '@/hooks/useWindData';
import { useStationData } from '@/hooks/useStationData';

const DroneWindAnalysis = () => {
  const [useEstimation, setUseEstimation] = useState(true);
  
  // Use our custom hook for wind data
  const {
    windData,
    loading,
    error,
    location,
    useMockData,
    setUseMockData,
    fetchWindData,
    handleLocationChange,
    handleFallbackToMockData
  } = useWindData();
  
  // Use the station data hook to enhance wind data with gusts
  const { 
    enhancedData, 
    loading: stationLoading, 
    nearestStation 
  } = useStationData({
    latitude: location.latitude,
    longitude: location.longitude,
    forecastData: windData,
    enabled: !useMockData,
    useEstimation
  });
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Drone Wind Analysis
            </h1>
            <Badge variant="outline" className="ml-2">
              LAT: {location.latitude.toFixed(2)}, LON: {location.longitude.toFixed(2)}
            </Badge>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <WindDataError 
            error={error} 
            onRetry={fetchWindData} 
            onUseMockData={handleFallbackToMockData} 
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <WindAnalysisContent 
                loading={loading || stationLoading}
                windData={enhancedData}
                nearestStation={nearestStation}
              />
            </div>
            
            <WindAnalysisSettings 
              onLocationChange={handleLocationChange}
              useMockData={useMockData}
              setUseMockData={setUseMockData}
              useEstimation={useEstimation}
              setUseEstimation={setUseEstimation}
              onRefreshData={fetchWindData}
              nearestStation={nearestStation}
            />
          </div>
        </div>
      </main>
      
      <footer className="bg-white mt-12 border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            Drone Wind Analysis Tool • Data from National Weather Service API
          </p>
        </div>
      </footer>
    </div>
  );
};

export default DroneWindAnalysis;
