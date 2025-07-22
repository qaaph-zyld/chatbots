'use client';

import React from 'react';
import { Chart } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';
import { HeatmapController, HeatmapElement } from 'chartjs-chart-matrix';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  HeatmapController,
  HeatmapElement
);

interface HeatMapProps {
  data: any;
  options?: ChartOptions<'matrix'>;
  height?: number;
}

export function HeatMap({ data, options, height = 300 }: HeatMapProps) {
  const defaultOptions: ChartOptions<'matrix'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          title: function() {
            return '';
          },
          label: function(context) {
            const v = context.dataset.data[context.dataIndex] as any;
            return ['x: ' + v.x, 'y: ' + v.y, 'v: ' + v.v];
          }
        }
      }
    },
    scales: {
      x: {
        type: 'category',
        labels: data.xLabels,
        grid: {
          display: false
        }
      },
      y: {
        type: 'category',
        labels: data.yLabels,
        grid: {
          display: false
        },
        offset: true
      }
    },
  };

  const mergedOptions = { ...defaultOptions, ...options };

  // Format data for heatmap
  const chartData = {
    datasets: [{
      label: data.label || 'Heatmap',
      data: data.values,
      backgroundColor: (context: any) => {
        const value = context.dataset.data[context.dataIndex].v;
        const alpha = (value - data.min) / (data.max - data.min);
        return `rgba(59, 130, 246, ${alpha})`;
      },
      borderColor: 'rgba(255, 255, 255, 0.2)',
      borderWidth: 1,
      width: ({ chart }: any) => (chart.chartArea || {}).width / data.xLabels.length - 1,
      height: ({ chart }: any) => (chart.chartArea || {}).height / data.yLabels.length - 1
    }]
  };

  return (
    <div style={{ height: `${height}px`, width: '100%' }}>
      <Chart type="matrix" data={chartData} options={mergedOptions} />
    </div>
  );
}
