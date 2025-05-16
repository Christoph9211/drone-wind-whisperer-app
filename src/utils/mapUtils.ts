
import mapboxgl from 'mapbox-gl';
import { WindData } from './weatherApi';
import { estimateWindAtHeight, MAX_SAFE_WIND } from './windCalculations';

/**
 * Create wind vector data for visualization on the map
 */
export const createWindVectorData = (
  data: WindData,
  latitude: number,
  longitude: number,
  height: number
) => {
  // Calculate wind speed at selected height
  const windSpeed = height === 10 ? 
    data.windSpeed : 
    estimateWindAtHeight(data.windSpeed, 10, height);
  
  // Get wind direction in radians (0 is north, convert to match geospatial where 0 is east)
  const directionRad = data.windDirection ? 
    ((450 - data.windDirection) % 360) * Math.PI / 180 : 
    0;
  
  // Scale factor for the vector length based on wind speed
  const scale = 0.02;
  
  // Calculate vector end point (scaled by wind speed)
  const endLng = longitude + Math.cos(directionRad) * windSpeed * scale;
  const endLat = latitude + Math.sin(directionRad) * windSpeed * scale;
  
  return {
    type: 'Feature',
    properties: {
      windSpeed: windSpeed,
      windDirection: data.windDirection || 0,
      isSafe: windSpeed <= MAX_SAFE_WIND
    },
    geometry: {
      type: 'LineString',
      coordinates: [
        [longitude, latitude],
        [endLng, endLat]
      ]
    }
  };
};

/**
 * Add wind vector layer to the map
 */
export const addWindVectorLayer = (
  map: mapboxgl.Map,
  data: WindData[],
  latitude: number,
  longitude: number,
  height: number
) => {
  if (!map || data.length === 0) return;
  
  // Remove existing layers if they exist
  if (map.getSource('wind-vectors')) {
    map.removeLayer('wind-vectors');
    map.removeLayer('wind-vector-heads');
    map.removeSource('wind-vectors');
  }
  
  if (map.getSource('wind-circle')) {
    map.removeLayer('wind-circle');
    map.removeSource('wind-circle');
  }
  
  // Get the current/most recent wind data
  const currentData = data[0];
  
  // Create wind vector
  const vectorData = createWindVectorData(currentData, latitude, longitude, height);
  
  // Calculate wind speed at selected height
  const windSpeed = height === 10 ? 
    currentData.windSpeed : 
    estimateWindAtHeight(currentData.windSpeed, 10, height);
  
  // Add circle for wind intensity
  map.addSource('wind-circle', {
    type: 'geojson',
    data: {
      type: 'Feature',
      properties: {
        windSpeed: windSpeed,
        isSafe: windSpeed <= MAX_SAFE_WIND
      },
      geometry: {
        type: 'Point',
        coordinates: [longitude, latitude]
      }
    }
  });
  
  map.addLayer({
    id: 'wind-circle',
    type: 'circle',
    source: 'wind-circle',
    paint: {
      'circle-radius': 50,
      'circle-opacity': 0.6,
      'circle-color': [
        'case',
        ['<=', ['get', 'windSpeed'], MAX_SAFE_WIND],
        '#4ade80', // Green for safe
        '#ef4444'  // Red for unsafe
      ]
    }
  });
  
  // Add vector line
  map.addSource('wind-vectors', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: [vectorData]
    }
  });
  
  // Add vector line
  map.addLayer({
    id: 'wind-vectors',
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
        '#4ade80', // Green for safe
        '#ef4444'  // Red for unsafe
      ],
      'line-width': 3
    }
  });
  
  // Add arrow head for direction
  const endCoord = vectorData.geometry.coordinates[1];
  
  map.addLayer({
    id: 'wind-vector-heads',
    type: 'symbol',
    source: 'wind-vectors',
    layout: {
      'symbol-placement': 'point',
      'symbol-spacing': 1,
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-image': 'arrow',
      'icon-size': 0.75,
      'icon-rotate': ['get', 'windDirection'],
      'icon-anchor': 'center'
    }
  });
};

/**
 * Initialize map with custom images and settings
 */
export const initializeWindMap = (
  map: mapboxgl.Map,
  onLoad: () => void
) => {
  // Load arrow image for wind direction
  map.on('load', () => {
    // Create an arrow image
    const arrowSize = 16;
    const canvas = document.createElement('canvas');
    canvas.width = arrowSize;
    canvas.height = arrowSize;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Draw arrow triangle
      ctx.beginPath();
      ctx.moveTo(arrowSize * 0.5, 0);
      ctx.lineTo(0, arrowSize);
      ctx.lineTo(arrowSize, arrowSize);
      ctx.closePath();
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
    
    // Add the arrow image to the map
    map.addImage('arrow', { 
      width: arrowSize, 
      height: arrowSize, 
      data: new Uint8Array(ctx?.getImageData(0, 0, arrowSize, arrowSize).data || [])
    });
    
    onLoad();
  });
};
