
import { MAX_SAFE_WIND, MAX_SAFE_GUST, msToMph } from '@/utils/windCalculations';

export const createChartOptions = (showMph: boolean, showGusts: boolean) => {
  const safeWindThreshold = showMph ? msToMph(MAX_SAFE_WIND) : MAX_SAFE_WIND;
  const safeGustThreshold = showMph ? msToMph(MAX_SAFE_GUST) : MAX_SAFE_GUST;

  return {
    title: 'Wind Speed Analysis',
    titleTextStyle: {
      fontSize: 18,
      bold: true,
    },
    height: 400,
    curveType: 'function' as const,
    legend: { position: 'bottom' as const },
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
      style: 'line' as const,
      stem: {
        color: 'transparent',
      }
    },
    crosshair: { 
      trigger: 'both' as const
    },
    explorer: {
      actions: ['dragToZoom', 'rightClickToReset'],
      axis: 'horizontal' as const,
      keepInBounds: true,
      maxZoomIn: 0.1
    }
  };
};

export const createDataTable = (transformedData: any[], showGusts: boolean) => {
  const google = window.google;
  if (!google?.visualization) return null;

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
  
  dataTable.addRows(transformedData);
  return dataTable;
};
