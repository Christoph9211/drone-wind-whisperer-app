
import { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { WindData, CurrentWindPoint } from '@/utils/weatherApi';
import { ANALYSIS_HEIGHTS } from '@/utils/constants';
import { estimateWindAtHeight, MAX_SAFE_WIND, MAX_SAFE_GUST } from '@/utils/windCalculations';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Layers, Info } from 'lucide-react';

interface EnhancedWindMapProps {
  windData: WindData[];
  location: { latitude: number; longitude: number };
}

interface VisualizationLayers {
  heatMap: boolean;
  vectors: boolean;
  particles: boolean;
  contours: boolean;
  safetyZones: boolean;
}

const EnhancedWindMap = ({ windData, location }: EnhancedWindMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const animationFrame = useRef<number>();
  const particles = useRef<Array<{ x: number; y: number; age: number; speed: number; direction: number }>>([]);
  
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedHeight, setSelectedHeight] = useState(ANALYSIS_HEIGHTS[0]);
  const [mapboxToken, setMapboxToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(true);
  const [timeIndex, setTimeIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; windData?: any } | null>(null);
  
  const [layers, setLayers] = useState<VisualizationLayers>({
    heatMap: true,
    vectors: true,
    particles: false,
    contours: false,
    safetyZones: true
  });

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mapboxToken) {
      setShowTokenInput(false);
      initializeMap();
    }
  };

  const initializeMap = useCallback(() => {
    if (!mapContainer.current || !mapboxToken) return;
    
    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-v9',
      center: [location.longitude, location.latitude],
      zoom: 9
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      setMapLoaded(true);
      setupWindLayers();
    });

    // Click handler for detailed wind info
    map.current.on('click', (e) => {
      const windInfo = calculateWindAtPoint(e.lngLat.lat, e.lngLat.lng);
      setSelectedLocation({
        lat: e.lngLat.lat,
        lng: e.lngLat.lng,
        windData: windInfo
      });
    });
  }, [mapboxToken, location]);

  const calculateWindAtPoint = (lat: number, lng: number) => {
    if (windData.length === 0) return null;
    
    const currentData = windData[timeIndex] || windData[0];
    const windAtHeight = selectedHeight === 10 ? 
      currentData.windSpeed : 
      estimateWindAtHeight(currentData.windSpeed, 10, selectedHeight);
    
    return {
      windSpeed: windAtHeight,
      windDirection: currentData.windDirection || 0,
      windGust: currentData.windGust,
      isSafe: windAtHeight <= MAX_SAFE_WIND,
      timestamp: currentData.timestamp
    };
  };

  const setupWindLayers = () => {
    if (!map.current || !windData.length) return;

    // Heat map layer
    if (layers.heatMap) {
      addHeatMapLayer();
    }

    // Vector field layer
    if (layers.vectors) {
      addVectorLayer();
    }

    // Safety zones layer
    if (layers.safetyZones) {
      addSafetyZonesLayer();
    }

    // Particle animation
    if (layers.particles) {
      startParticleAnimation();
    }
  };

  const addHeatMapLayer = () => {
    if (!map.current) return;

    const currentData = windData[timeIndex] || windData[0];
    const windSpeed = selectedHeight === 10 ? 
      currentData.windSpeed : 
      estimateWindAtHeight(currentData.windSpeed, 10, selectedHeight);

    // Create heat map data points
    const heatMapPoints = generateHeatMapGrid(location.latitude, location.longitude, windSpeed);

    if (map.current.getSource('wind-heatmap')) {
      (map.current.getSource('wind-heatmap') as mapboxgl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: heatMapPoints
      });
    } else {
      map.current.addSource('wind-heatmap', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: heatMapPoints
        }
      });

      map.current.addLayer({
        id: 'wind-heatmap-layer',
        type: 'heatmap',
        source: 'wind-heatmap',
        paint: {
          'heatmap-weight': ['get', 'intensity'],
          'heatmap-intensity': 1,
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(0, 255, 0, 0)',
            0.3, 'rgba(0, 255, 0, 0.6)',
            0.5, 'rgba(255, 255, 0, 0.7)',
            0.7, 'rgba(255, 165, 0, 0.8)',
            1, 'rgba(255, 0, 0, 0.9)'
          ],
          'heatmap-radius': 50,
          'heatmap-opacity': 0.7
        }
      });
    }
  };

  const addVectorLayer = () => {
    if (!map.current) return;

    const currentData = windData[timeIndex] || windData[0];
    const vectors = generateWindVectors(location.latitude, location.longitude, currentData);

    if (map.current.getSource('wind-vectors')) {
      (map.current.getSource('wind-vectors') as mapboxgl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: vectors
      });
    } else {
      map.current.addSource('wind-vectors', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: vectors
        }
      });

      map.current.addLayer({
        id: 'wind-vectors-layer',
        type: 'line',
        source: 'wind-vectors',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': [
            'case',
            ['<=', ['get', 'windSpeed'], MAX_SAFE_WIND],
            '#4ade80',
            '#ef4444'
          ],
          'line-width': [
            'interpolate',
            ['linear'],
            ['get', 'windSpeed'],
            0, 1,
            5, 2,
            10, 4,
            15, 6
          ],
          'line-opacity': 0.8
        }
      });
    }
  };

  const addSafetyZonesLayer = () => {
    if (!map.current) return;

    const safetyZones = generateSafetyZones(location.latitude, location.longitude);

    if (map.current.getSource('safety-zones')) {
      (map.current.getSource('safety-zones') as mapboxgl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: safetyZones
      });
    } else {
      map.current.addSource('safety-zones', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: safetyZones
        }
      });

      map.current.addLayer({
        id: 'safety-zones-layer',
        type: 'fill',
        source: 'safety-zones',
        paint: {
          'fill-color': [
            'case',
            ['get', 'isSafe'],
            'rgba(74, 222, 128, 0.3)',
            'rgba(239, 68, 68, 0.3)'
          ],
          'fill-outline-color': [
            'case',
            ['get', 'isSafe'],
            '#4ade80',
            '#ef4444'
          ]
        }
      });
    }
  };

  const generateHeatMapGrid = (centerLat: number, centerLng: number, baseWindSpeed: number) => {
    const features = [];
    const gridSize = 0.01;
    const range = 0.1;

    for (let lat = centerLat - range; lat <= centerLat + range; lat += gridSize) {
      for (let lng = centerLng - range; lng <= centerLng + range; lng += gridSize) {
        const distance = Math.sqrt(Math.pow(lat - centerLat, 2) + Math.pow(lng - centerLng, 2));
        const intensity = Math.max(0, 1 - distance * 5) * (baseWindSpeed / MAX_SAFE_WIND);
        
        features.push({
          type: 'Feature' as const,
          properties: { intensity },
          geometry: {
            type: 'Point' as const,
            coordinates: [lng, lat]
          }
        });
      }
    }

    return features;
  };

  const generateWindVectors = (centerLat: number, centerLng: number, windData: WindData) => {
    const vectors = [];
    const gridSize = 0.02;
    const range = 0.08;

    for (let lat = centerLat - range; lat <= centerLat + range; lat += gridSize) {
      for (let lng = centerLng - range; lng <= centerLng + range; lng += gridSize) {
        const windSpeed = selectedHeight === 10 ? 
          windData.windSpeed : 
          estimateWindAtHeight(windData.windSpeed, 10, selectedHeight);
        
        const direction = (windData.windDirection || 0) * Math.PI / 180;
        const length = windSpeed * 0.001;
        
        const endLat = lat + Math.sin(direction) * length;
        const endLng = lng + Math.cos(direction) * length;

        vectors.push({
          type: 'Feature' as const,
          properties: { 
            windSpeed,
            windDirection: windData.windDirection || 0
          },
          geometry: {
            type: 'LineString' as const,
            coordinates: [[lng, lat], [endLng, endLat]]
          }
        });
      }
    }

    return vectors;
  };

  const generateSafetyZones = (centerLat: number, centerLng: number) => {
    const currentData = windData[timeIndex] || windData[0];
    const windSpeed = selectedHeight === 10 ? 
      currentData.windSpeed : 
      estimateWindAtHeight(currentData.windSpeed, 10, selectedHeight);
    
    const isSafe = windSpeed <= MAX_SAFE_WIND;
    const radius = 0.05;

    return [{
      type: 'Feature' as const,
      properties: { isSafe },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[
          [centerLng - radius, centerLat - radius],
          [centerLng + radius, centerLat - radius],
          [centerLng + radius, centerLat + radius],
          [centerLng - radius, centerLat + radius],
          [centerLng - radius, centerLat - radius]
        ]]
      }
    }];
  };

  const startParticleAnimation = () => {
    if (!layers.particles) return;

    const animate = () => {
      // Update particle positions based on wind data
      particles.current = particles.current
        .map(particle => ({
          ...particle,
          age: particle.age + 1,
          x: particle.x + Math.cos(particle.direction) * particle.speed,
          y: particle.y + Math.sin(particle.direction) * particle.speed
        }))
        .filter(particle => particle.age < 100);

      // Add new particles
      if (particles.current.length < 50) {
        const currentData = windData[timeIndex] || windData[0];
        particles.current.push({
          x: location.longitude + (Math.random() - 0.5) * 0.1,
          y: location.latitude + (Math.random() - 0.5) * 0.1,
          age: 0,
          speed: (currentData.windSpeed || 1) * 0.0001,
          direction: ((currentData.windDirection || 0) + Math.random() * 30 - 15) * Math.PI / 180
        });
      }

      if (isAnimating) {
        animationFrame.current = requestAnimationFrame(animate);
      }
    };

    animate();
  };

  const toggleLayer = (layerName: keyof VisualizationLayers) => {
    setLayers(prev => ({
      ...prev,
      [layerName]: !prev[layerName]
    }));
  };

  const toggleAnimation = () => {
    setIsAnimating(!isAnimating);
    if (!isAnimating && layers.particles) {
      startParticleAnimation();
    }
  };

  // Update layers when settings change
  useEffect(() => {
    if (mapLoaded) {
      setupWindLayers();
    }
  }, [mapLoaded, selectedHeight, timeIndex, layers]);

  // Initialize map
  useEffect(() => {
    if (mapboxToken && !map.current) {
      initializeMap();
    }
    
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxToken, initializeMap]);

  if (showTokenInput) {
    return (
      <div className="relative h-[600px] w-full rounded-lg overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10 p-4">
          <form onSubmit={handleTokenSubmit} className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">MapBox API Token Required</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please enter your MapBox public token to enable the enhanced map visualization.
            </p>
            <div className="space-y-4">
              <input
                type="text"
                value={mapboxToken}
                onChange={(e) => setMapboxToken(e.target.value)}
                placeholder="pk.eyJ1IjoieW91..."
                className="w-full rounded-md border-gray-300 shadow-sm p-2 border"
              />
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
              >
                Initialize Enhanced Map
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[600px] w-full rounded-lg overflow-hidden">
      <div ref={mapContainer} className="h-full w-full" />
      
      {/* Enhanced Controls Panel */}
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 max-w-sm">
        <div className="space-y-4">
          {/* Height Control */}
          <div>
            <label className="text-sm font-medium block mb-2">
              Altitude: {selectedHeight}m
            </label>
            <Slider
              value={[selectedHeight]}
              onValueChange={(value) => setSelectedHeight(value[0])}
              min={10}
              max={120}
              step={10}
              className="w-full"
            />
          </div>

          {/* Time Control */}
          <div>
            <label className="text-sm font-medium block mb-2">
              Time: {windData[timeIndex]?.timestamp.toLocaleTimeString() || 'N/A'}
            </label>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={toggleAnimation}
                className="p-2"
              >
                {isAnimating ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Slider
                value={[timeIndex]}
                onValueChange={(value) => setTimeIndex(value[0])}
                min={0}
                max={Math.max(0, windData.length - 1)}
                step={1}
                className="flex-1"
              />
            </div>
          </div>

          {/* Layer Controls */}
          <div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowLayerPanel(!showLayerPanel)}
              className="w-full mb-2"
            >
              <Layers className="h-4 w-4 mr-2" />
              Visualization Layers
            </Button>
            
            {showLayerPanel && (
              <div className="space-y-2 bg-gray-50 p-3 rounded-md">
                {Object.entries(layers).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <label className="text-sm capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    <Switch
                      checked={value}
                      onCheckedChange={() => toggleLayer(key as keyof VisualizationLayers)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Wind Info Panel */}
      {selectedLocation && (
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 max-w-xs">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium flex items-center">
              <Info className="h-4 w-4 mr-1" />
              Wind Details
            </h4>
            <button
              onClick={() => setSelectedLocation(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          
          {selectedLocation.windData && (
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Location:</span><br />
                {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
              </div>
              <div>
                <span className="font-medium">Wind Speed:</span><br />
                {selectedLocation.windData.windSpeed.toFixed(1)} m/s
              </div>
              <div>
                <span className="font-medium">Direction:</span><br />
                {selectedLocation.windData.windDirection}°
              </div>
              <Badge variant={selectedLocation.windData.isSafe ? "default" : "destructive"}>
                {selectedLocation.windData.isSafe ? "Safe" : "Unsafe"}
              </Badge>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3">
        <h5 className="font-medium mb-2 text-sm">Wind Speed Legend</h5>
        <div className="space-y-1 text-xs">
          <div className="flex items-center">
            <div className="w-4 h-2 bg-green-400 mr-2 rounded"></div>
            <span>0-5 m/s (Very Safe)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-2 bg-yellow-400 mr-2 rounded"></div>
            <span>5-8 m/s (Safe)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-2 bg-orange-400 mr-2 rounded"></div>
            <span>8-11 m/s (Caution)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-2 bg-red-400 mr-2 rounded"></div>
            <span>11+ m/s (Unsafe)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedWindMap;
