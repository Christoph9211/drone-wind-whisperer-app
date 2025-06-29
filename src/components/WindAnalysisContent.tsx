
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import WindSpeedChart from '@/components/WindSpeedChart';
import GoogleWindChart from '@/components/GoogleWindChart';
import WindDataTable from '@/components/WindDataTable';
import WindMap from '@/components/WindMap';
import EnhancedWindMap from '@/components/EnhancedWindMap';
import SafetyIndicator from '@/components/SafetyIndicator';
import LoadingSpinner from '@/components/LoadingSpinner';
import { WindData } from '@/utils/weatherApi';

interface WindAnalysisContentProps {
  loading: boolean;
  windData: WindData[];
  nearestStation: { name: string } | null;
  location: { latitude: number; longitude: number };
}

const WindAnalysisContent = ({ 
  loading,
  windData,
  nearestStation,
  location
}: WindAnalysisContentProps) => {
  const [showMph, setShowMph] = useState(false);
  
  // Get day names for the data
  const dayNames = [...new Set(windData.map(data => 
    data.timestamp.toLocaleDateString(undefined, { weekday: 'long' })
  ))];
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return (
    <>
      <SafetyIndicator windData={windData} />
      
      <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            Wind Analysis {dayNames.length > 0 ? `for ${dayNames.join(' & ')}` : ''}
          </h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowMph(!showMph)}
              className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md"
            >
              Show in: {showMph ? 'm/s' : 'mph'}
            </button>
            
            {nearestStation && (
              <Badge variant="secondary">
                Data source: {nearestStation.name}
              </Badge>
            )}
          </div>
        </div>
        
        <Tabs defaultValue="enhanced-map">
          <TabsList>
            <TabsTrigger value="enhanced-map">Enhanced Map</TabsTrigger>
            <TabsTrigger value="chart">Chart View</TabsTrigger>
            <TabsTrigger value="table">Table View</TabsTrigger>
            <TabsTrigger value="map">Basic Map</TabsTrigger>
            <TabsTrigger value="google-chart">Google Chart</TabsTrigger>
          </TabsList>
          <TabsContent value="enhanced-map" className="mt-4">
            <EnhancedWindMap windData={windData} location={location} />
          </TabsContent>
          <TabsContent value="chart" className="mt-4">
            <WindSpeedChart windData={windData} showMph={showMph} />
          </TabsContent>
          <TabsContent value="google-chart" className="mt-4">
            <GoogleWindChart windData={windData} showMph={showMph} />
          </TabsContent>
          <TabsContent value="table" className="mt-4">
            <WindDataTable windData={windData} />
          </TabsContent>
          <TabsContent value="map" className="mt-4">
            <WindMap windData={windData} showMph={showMph} location={location} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default WindAnalysisContent;
