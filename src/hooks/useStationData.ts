
import { useState, useEffect } from 'react';
import { toast } from "@/components/ui/use-toast";
import { 
  fetchNearbyStations, 
  fetchStationObservations,
  mergeWindDataWithObservations,
  estimateWindGusts,
  WindData
} from '@/utils/weatherApi';

interface UseStationDataProps {
  latitude: number;
  longitude: number;
  forecastData: WindData[];
  enabled?: boolean;
  useEstimation?: boolean;
}

interface StationInfo {
  id: string;
  name: string;
  distance?: number;
}

export const useStationData = ({ 
  latitude, 
  longitude, 
  forecastData, 
  enabled = true,
  useEstimation = true
}: UseStationDataProps) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [enhancedData, setEnhancedData] = useState<WindData[]>(forecastData);
  const [nearestStation, setNearestStation] = useState<StationInfo | null>(null);
  
  useEffect(() => {
    // Always update with the latest forecast data, even if we don't have station data
    setEnhancedData(forecastData);
    
    if (!enabled || !forecastData.length) return;
    
    const fetchStationData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Find nearby stations
        const stations = await fetchNearbyStations(latitude, longitude);
        
        if (stations.length === 0) {
          if (useEstimation) {
            // If no stations are found but estimation is enabled, use estimation
            setEnhancedData(estimateWindGusts(forecastData));
            toast({
              title: "Using estimated gust data",
              description: "No nearby weather stations found. Using wind gust estimation algorithm.",
              variant: "default",
            });
          }
          setLoading(false);
          return;
        }
        
        // Use the first station (closest)
        const nearestStation = stations[0];
        const stationId = nearestStation.properties.stationIdentifier;
        const stationName = nearestStation.properties.name;
        
        setNearestStation({
          id: stationId,
          name: stationName
        });
        
        // Fetch observations from the station
        const observations = await fetchStationObservations(stationId);
        
        if (observations.length === 0) {
          if (useEstimation) {
            // If no observations are found but estimation is enabled, use estimation
            setEnhancedData(estimateWindGusts(forecastData));
            toast({
              title: "Using estimated gust data",
              description: `No observation data from ${stationName}. Using wind gust estimation algorithm.`,
              variant: "default",
            });
          }
          setLoading(false);
          return;
        }
        
        // Merge forecast data with observation data
        const mergedData = mergeWindDataWithObservations(forecastData, observations);
        
        // If there are still missing gusts and estimation is enabled, fill them in
        const finalData = useEstimation 
          ? estimateWindGusts(mergedData) 
          : mergedData;
        
        setEnhancedData(finalData);
        toast({
          title: "Wind gust data added",
          description: `Added gust data from ${stationName} weather station.`,
          variant: "default",
        });
        
      } catch (err) {
        console.error("Error fetching station data:", err);
        setError(err as Error);
        
        if (useEstimation) {
          // If there's an error but estimation is enabled, use estimation
          setEnhancedData(estimateWindGusts(forecastData));
          toast({
            title: "Using estimated gust data",
            description: "Error fetching station data. Using wind gust estimation algorithm.",
            variant: "warning",
          });
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchStationData();
  }, [latitude, longitude, forecastData, enabled, useEstimation]);
  
  return {
    enhancedData,
    loading,
    error,
    nearestStation
  };
};
