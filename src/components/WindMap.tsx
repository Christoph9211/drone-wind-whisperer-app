
import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { WindData } from '@/utils/weatherApi';
import { ANALYSIS_HEIGHTS } from '@/utils/constants';
import { addWindVectorLayer, initializeWindMap } from '@/utils/mapUtils';

interface WindMapProps {
  windData: WindData[];
  showMph?: boolean;
  location: { latitude: number; longitude: number };
}

const WindMap = ({ windData, location }: WindMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedHeight, setSelectedHeight] = useState(ANALYSIS_HEIGHTS[0]);
  const [mapboxToken, setMapboxToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(true);
  const [mapStyle, setMapStyle] = useState('satellite-v9');

  // Set Mapbox token
  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mapboxToken) {
      setShowTokenInput(false);
      initializeMap();
    }
  };

  const initializeMap = () => {
    if (!mapContainer.current || !mapboxToken) return;
    
    mapboxgl.accessToken = mapboxToken;
    
    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: `mapbox://styles/mapbox/${mapStyle}`,
      center: [location.longitude, location.latitude],
      zoom: 9
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl(),
      'top-right'
    );

    // Initialize wind map with custom images
    initializeWindMap(map.current, () => {
      setMapLoaded(true);
      updateWindLayer();
    });
  };

  // Update wind visualization when data or selected height changes
  const updateWindLayer = () => {
    if (!map.current || !mapLoaded || windData.length === 0) return;
    
    // Add wind vector layer
    addWindVectorLayer(
      map.current,
      windData,
      location.latitude,
      location.longitude,
      selectedHeight
    );

    // Add or update a marker at the current location
    if (!markerRef.current) {
      markerRef.current = new mapboxgl.Marker({
        color: "#ffffff"
      })
        .setLngLat([location.longitude, location.latitude])
        .addTo(map.current);
    } else {
      markerRef.current.setLngLat([location.longitude, location.latitude]);
    }
  };

  // Change map style
  const changeMapStyle = (style: string) => {
    setMapStyle(style);
    if (map.current) {
      map.current.setStyle(`mapbox://styles/mapbox/${style}`);
      map.current.once('styledata', updateWindLayer);
    }
  };

  // Effect to initialize map
  useEffect(() => {
    if (mapboxToken && !map.current) {
      initializeMap();
    }
    
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxToken]);

  // Effect to update map center when location changes
  useEffect(() => {
    if (map.current) {
      map.current.setCenter([location.longitude, location.latitude]);
      updateWindLayer();
    }
  }, [location]);

  // Effect to update wind layer when data or selected height changes
  useEffect(() => {
    updateWindLayer();
  }, [windData, selectedHeight, mapLoaded]);

  // Get current wind data for display
  const currentWindData = windData.length > 0 ? windData[0] : null;

  return (
    <div className="relative h-[500px] w-full rounded-lg overflow-hidden">
      {showTokenInput ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10 p-4">
          <form onSubmit={handleTokenSubmit} className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">MapBox API Token Required</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please enter your MapBox public token to enable the map visualization.
              You can get one for free at <a href="https://mapbox.com/" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">mapbox.com</a>.
            </p>
            <div className="space-y-4">
              <div>
                <label htmlFor="mapbox-token" className="block text-sm font-medium text-gray-700">
                  MapBox Token
                </label>
                <input
                  id="mapbox-token"
                  type="text"
                  value={mapboxToken}
                  onChange={(e) => setMapboxToken(e.target.value)}
                  placeholder="pk.eyJ1IjoieW91..."
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                />
              </div>
              <button
                type="submit"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700"
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      ) : null}
      
      <div ref={mapContainer} className="h-full w-full" />
      
      {/* Map controls */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-md shadow-md p-3 space-y-3">
        <div className="flex flex-col space-y-1">
          <label className="text-sm font-medium">Height:</label>
          <select
            value={selectedHeight}
            onChange={(e) => setSelectedHeight(Number(e.target.value))}
            className="rounded border p-1 text-sm"
          >
            {ANALYSIS_HEIGHTS.map((height) => (
              <option key={height} value={height}>
                {height}m
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex flex-col space-y-1">
          <label className="text-sm font-medium">Map Style:</label>
          <select
            value={mapStyle}
            onChange={(e) => changeMapStyle(e.target.value)}
            className="rounded border p-1 text-sm"
          >
            <option value="satellite-v9">Satellite</option>
            <option value="streets-v11">Streets</option>
            <option value="outdoors-v11">Outdoors</option>
            <option value="light-v10">Light</option>
            <option value="dark-v10">Dark</option>
          </select>
        </div>
        
        {currentWindData && (
          <div className="border-t pt-2">
            <p className="text-sm font-medium">Current Wind:</p>
            <p className="text-sm">{currentWindData.windSpeed.toFixed(1)} m/s at {selectedHeight}m</p>
            {currentWindData.windDirection && (
              <p className="text-sm">Direction: {currentWindData.windDirection}°</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WindMap;
