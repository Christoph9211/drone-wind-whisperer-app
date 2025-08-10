import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { CurrentWindPoint } from '@/utils/weatherApi';
import { estimateWindAtHeight } from '@/utils/windCalculations';

interface WindParticlesCanvasProps {
  map: mapboxgl.Map | null;
  points: CurrentWindPoint[];
  height: number; // meters
  enabled?: boolean;
}

interface Particle {
  lng: number;
  lat: number;
  age: number;
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const WindParticlesCanvas = ({ map, points, height, enabled = true }: WindParticlesCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const [dpr, setDpr] = useState(1);

  // Sample wind vector at a geographic location using inverse-distance weighting
  const sampleVector = (lng: number, lat: number) => {
    if (!points.length) return { east: 0, north: 0, speed: 0 };

    // Find up to 4 nearest points
    const distances = points.map((p) => {
      const dLat = (p.latitude - lat);
      const dLng = (p.longitude - lng);
      const dist = Math.hypot(dLat, dLng) + 1e-6;
      return { p, dist };
    });
    distances.sort((a, b) => a.dist - b.dist);
    const neighbors = distances.slice(0, 4);

    let sumW = 0;
    let east = 0;
    let north = 0;
    let speed = 0;

    neighbors.forEach(({ p, dist }) => {
      const w = 1 / (dist * dist); // IDW power=2
      // Adjust speed to selected height (points are at 10m nominal)
      const s = estimateWindAtHeight(p.windSpeed, 10, height);
      const dirRad = (p.windDirection || 0) * Math.PI / 180;
      // meteorological: 0=N -> convert to components (north, east)
      const vNorth = Math.cos(dirRad) * s;
      const vEast = Math.sin(dirRad) * s;

      east += vEast * w;
      north += vNorth * w;
      speed += s * w;
      sumW += w;
    });

    if (sumW === 0) return { east: 0, north: 0, speed: 0 };

    return { east: east / sumW, north: north / sumW, speed: speed / sumW };
  };

  // Initialize particles
  const seedParticles = (count: number) => {
    particlesRef.current = [];
    if (!map) return;
    const bounds = map.getBounds();
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        lng: bounds.getWest() + Math.random() * (bounds.getEast() - bounds.getWest()),
        lat: bounds.getSouth() + Math.random() * (bounds.getNorth() - bounds.getSouth()),
        age: Math.floor(Math.random() * 90)
      });
    }
  };

  // Resize canvas to match map container
  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !map) return;
    const { clientWidth, clientHeight } = map.getContainer();
    const ratio = window.devicePixelRatio || 1;
    setDpr(ratio);
    canvas.width = Math.floor(clientWidth * ratio);
    canvas.height = Math.floor(clientHeight * ratio);
    canvas.style.width = `${clientWidth}px`;
    canvas.style.height = `${clientHeight}px`;
  };

  // Advance particle positions and draw
  const step = () => {
    const canvas = canvasRef.current;
    if (!canvas || !map || !enabled) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Gentle fade for trails
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = 'rgba(0,0,0,0.92)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';

    // Use design token color for strokes
    const root = getComputedStyle(document.documentElement);
    const fg = root.getPropertyValue('--foreground') || '0 0% 10%';
    ctx.strokeStyle = `hsl(${fg})`;
    ctx.lineWidth = Math.max(1, dpr * 0.8);
    ctx.lineCap = 'round';

    const bounds = map.getBounds();

    // Zoom-aware speed scale (visualization only)
    const zoom = map.getZoom();
    const meterPerDegLat = 111320;

    particlesRef.current.forEach((pt) => {
      // Skip if outside current bounds
      if (
        pt.lng < bounds.getWest() ||
        pt.lng > bounds.getEast() ||
        pt.lat < bounds.getSouth() ||
        pt.lat > bounds.getNorth()
      ) {
        // Respawn inside bounds
        pt.lng = bounds.getWest() + Math.random() * (bounds.getEast() - bounds.getWest());
        pt.lat = bounds.getSouth() + Math.random() * (bounds.getNorth() - bounds.getSouth());
        pt.age = 0;
        return;
      }

      const v = sampleVector(pt.lng, pt.lat);

      // Convert m/s to degrees per frame using simple geographic conversion
      const latRad = (pt.lat * Math.PI) / 180;
      const meterPerDegLng = meterPerDegLat * Math.cos(latRad);
      // dt scaled with zoom to keep motion perceptually consistent
      const dt = clamp(0.6 + (zoom - 8) * 0.08, 0.3, 1.2);
      const dLat = (v.north * dt) / meterPerDegLat;
      const dLng = (v.east * dt) / meterPerDegLng;

      const prev = map.project([pt.lng, pt.lat]);
      pt.lng += dLng;
      pt.lat += dLat;
      const curr = map.project([pt.lng, pt.lat]);

      // Draw small segment
      ctx.beginPath();
      ctx.moveTo(prev.x * dpr, prev.y * dpr);
      ctx.lineTo(curr.x * dpr, curr.y * dpr);
      ctx.stroke();

      pt.age++;
      if (pt.age > 100) {
        // respawn
        pt.lng = bounds.getWest() + Math.random() * (bounds.getEast() - bounds.getWest());
        pt.lat = bounds.getSouth() + Math.random() * (bounds.getNorth() - bounds.getSouth());
        pt.age = 0;
      }
    });

    rafRef.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    if (!map) return;

    const handleResize = () => {
      resizeCanvas();
      // reseed to fill new area
      seedParticles(500);
    };

    resizeCanvas();
    seedParticles(500);

    // Start animation
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(step);

    map.on('move', step);
    map.on('zoom', step);
    map.on('resize', handleResize);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      map.off('move', step);
      map.off('zoom', step);
      map.off('resize', handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, enabled]);

  // Re-seed when field changes significantly (points or height)
  useEffect(() => {
    if (!map) return;
    seedParticles(500);
  }, [points, height, map]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0"
      aria-hidden="true"
    />
  );
};

export default WindParticlesCanvas;
