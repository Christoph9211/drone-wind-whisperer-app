
import { useState, useEffect, useRef } from 'react';
import { WindData } from '@/utils/weatherApi';
import { MAX_SAFE_WIND, MAX_SAFE_GUST, estimateWindAtHeight, msToMph } from '@/utils/windCalculations';
import LoadingSpinner from './LoadingSpinner';

interface GoogleWindChartProps {
  windData: WindData[];
  showMph?: boolean;
}

declare global {
  interface Window {
    google: any;
  }
}

const GoogleWindChart = ({ windData, showMph = false }: GoogleWindChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [showGusts, setShowGusts] = useState(true);
  const [isLibLoaded, setIsLibLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Load Google Charts library
  useEffect(() => {
    const loadGoogleCharts = () => {
      const script = document.createElement('script');
      script.src = 'https://www.gstatic.com/charts/loader.js';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        if (window.google) {
          window.google.charts.load('current', {
            packages: ['corechart', 'line']
          });
          window.google.charts.setOnLoadCallback(() => {
            setIsLibLoaded(true);
          });
        }
      };
      
      script.onerror = () => {
        setError(new Error('Failed to load Google Charts library'));
      };
      
      document.head.appendChild(script);
    };
    
    if (!window.google) {
      loadGoogleCharts();
    } else if (window.google.charts) {
      setIsLibLoaded(true);
    }
    
    return () => {
      // Cleanup if needed
    };
  }, []);

  // Draw chart when data or library changes
  useEffect(() => {
    if (!isLibLoaded || !chartRef.current || !windData.length) return;
    
    try {
      drawChart();
    } catch (err) {
      console.error("Error drawing chart:", err);
      setError(err as Error);
    }
  }, [windData, isLibLoaded, showMph, showGusts]);

  // Function to draw the chart
  const drawChart = () => {
    const google = window.google;
    if (!google || !google.visualization) return;

    // Transform wind data for the chart
    const dataRows = windData.map(data => {
      // Calculate estimated wind speeds at different altitudes
      const baseSpeed = data.windSpeed;
      const speed20m = estimateWindAtHeight(baseSpeed, 10, 20);
      const speed50m = estimateWindAtHeight(baseSpeed, 10, 50);
      const speed80m = estimateWindAtHeight(baseSpeed, 10, 80);
      const speed100m = estimateWindAtHeight(baseSpeed, 10, 100);
      const speed120m = estimateWindAtHeight(baseSpeed, 10, 120);
      
      // Convert if needed
      const conversionFactor = showMph ? 1 / 0.44704 : 1;
      
      const time = data.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      // Prepare row data
      const row = [
        time,
        baseSpeed * conversionFactor,
        speed20m * conversionFactor,
        speed50m * conversionFactor,
        speed80m * conversionFactor,
        speed100m * conversionFactor,
        speed120m * conversionFactor,
      ];
      
      // Add gust data if available and enabled
      if (showGusts && data.windGust !== undefined) {
        row.push(data.windGust * conversionFactor);
      } else if (showGusts) {
        row.push(null); // Add null placeholder for missing gust data
      }
      
      return row;
    });
    
    // Create the data table
    const dataTable = new google.visualization.DataTable();
    dataTable.addColumn('string', 'Time');
    dataTable.addColumn('number', '10m Height');
    dataTable.addColumn('number', '20m Height');
    dataTable.addColumn('number', '50m Height');
    dataTable.addColumn('number', '80m Height');
    dataTable.addColumn('number', '100m Height');
    dataTable.addColumn('number', '120m Height');
    
    if (showGusts) {
      dataTable.addColumn('number', 'Wind Gusts');
    }
    
    dataTable.addRows(dataRows);
    
    // Safety threshold converted if needed
    const safeWindThreshold = showMph ? msToMph(MAX_SAFE_WIND) : MAX_SAFE_WIND;
    const safeGustThreshold = showMph ? msToMph(MAX_SAFE_GUST) : MAX_SAFE_GUST;
    
    // Chart options
    const options = {
      title: 'Wind Speed Analysis',
      titleTextStyle: {
        fontSize: 18,
        bold: true,
      },
      height: 400,
      curveType: 'function',
      legend: { position: 'bottom' },
      hAxis: {
        title: 'Time',
        textStyle: {
          fontSize: 12
        }
      },
      vAxis: {
        title: showMph ? 'Wind Speed (mph)' : 'Wind Speed (m/s)',
        textStyle: {
          fontSize: 12
        }
      },
      series: {
        0: { color: '#8884d8' }, // 10m
        1: { color: '#4CAF50' }, // 20m
        2: { color: '#82ca9d' }, // 50m
        3: { color: '#ffc658' }, // 80m
        4: { color: '#ff8042' }, // 100m
        5: { color: '#9c27b0' }, // 120m
        6: { color: '#ff0000', lineDashStyle: [5, 5] } // Wind Gusts
      },
      annotations: {
        style: 'line',
        stem: {
          color: 'transparent',
        }
      },
      crosshair: { 
        trigger: 'both',
        orientation: 'vertical'
      },
      explorer: {
        actions: ['dragToZoom', 'rightClickToReset'],
        axis: 'horizontal',
        keepInBounds: true,
        maxZoomIn: 0.1
      }
    };
    
    // Create and draw the chart
    const chart = new google.visualization.LineChart(chartRef.current);
    
    chart.draw(dataTable, options);
    
    // Add safety threshold reference lines
    const safetyData = new google.visualization.DataTable();
    safetyData.addColumn('string', 'Label');
    safetyData.addColumn('number', 'Value');
    safetyData.addRows([
      ['Max Safe Wind', safeWindThreshold],
      ['Max Safe Gust', safeGustThreshold]
    ]);
    
    // Draw safety threshold lines after the main chart
    const view = new google.visualization.DataView(dataTable);
    const chartWrapper = new google.visualization.ChartWrapper({
      chartType: 'LineChart',
      containerId: chartRef.current,
      dataTable: view,
      options: {
        ...options,
        series: {
          ...options.series,
          7: { color: 'red', enableInteractivity: false, lineWidth: 1, lineDashStyle: [4, 4] },
          8: { color: 'orange', enableInteractivity: false, lineWidth: 1, lineDashStyle: [4, 4] }
        }
      }
    });
    
    // Add event listener for interactivity if needed
    google.visualization.events.addListener(chart, 'ready', () => {
      // Add custom annotations or additional features here if needed
    });
  };

  if (error) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="text-red-600 p-4 rounded-md bg-red-50 mb-4">
          Error loading Google Charts: {error.message}
        </div>
      </div>
    );
  }

  if (!isLibLoaded) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md h-[400px] flex items-center justify-center">
        <LoadingSpinner />
        <span className="ml-2">Loading Google Charts...</span>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Google Wind Speed Chart</h3>
        <div className="text-sm text-gray-500">
          Interactive features: zoom, pan, tooltips
        </div>
      </div>
      
      <div ref={chartRef} className="h-[400px] w-full" />
      
      {windData.some(d => d.windGust !== undefined) && (
        <div className="flex items-center mt-2">
          <input
            type="checkbox"
            id="showGoogleGusts"
            checked={showGusts}
            onChange={() => setShowGusts(!showGusts)}
            className="mr-2"
          />
          <label htmlFor="showGoogleGusts">Show Wind Gusts</label>
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-500">
        <p>
          * Google Charts provides enhanced interactive features such as zooming and panning.
          Try dragging to zoom in on specific time periods.
        </p>
      </div>
    </div>
  );
};

export default GoogleWindChart;
