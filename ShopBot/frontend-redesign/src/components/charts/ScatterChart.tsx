'use client';

import React from 'react';
import { Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

interface ScatterChartProps {
  data: ChartData<'scatter'>;
  options?: ChartOptions<'scatter'>;
  height?: number;
}

export function ScatterChart({ data, options, height = 300 }: ScatterChartProps) {
  const defaultOptions: ChartOptions<'scatter'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const x = context.parsed.x;
            const y = context.parsed.y;
            return `${label}: (${x}, ${y})`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
        },
        title: {
          display: true,
          text: 'X Axis'
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        title: {
          display: true,
          text: 'Y Axis'
        }
      },
    },
  };

  const mergedOptions = { ...defaultOptions, ...options };

  return (
    <div style={{ height: `${height}px`, width: '100%' }}>
      <Scatter data={data} options={mergedOptions} />
    </div>
  );
}
