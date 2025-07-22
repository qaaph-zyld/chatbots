'use client';

import React from 'react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface RadarChartProps {
  data: ChartData<'radar'>;
  options?: ChartOptions<'radar'>;
  height?: number;
}

export function RadarChart({ data, options, height = 300 }: RadarChartProps) {
  const defaultOptions: ChartOptions<'radar'> = {
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
            const value = context.raw as number;
            return `${label}: ${value}`;
          }
        }
      }
    },
    scales: {
      r: {
        angleLines: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        pointLabels: {
          font: {
            size: 12,
          },
        },
        ticks: {
          backdropColor: 'transparent',
          color: 'rgba(0, 0, 0, 0.7)',
        }
      }
    }
  };

  const mergedOptions = { ...defaultOptions, ...options };

  return (
    <div style={{ height: `${height}px`, width: '100%' }}>
      <Radar data={data} options={mergedOptions} />
    </div>
  );
}
