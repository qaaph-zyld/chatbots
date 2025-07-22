/**
 * Advanced Chart Component
 * D3.js-powered sophisticated data visualization with interactive features
 */

'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  ChartConfiguration,
  ChartDataPoint,
  TimeSeriesDataPoint,
  AdvancedChartProps
} from '../../types/AdvancedAnalyticsTypes';

export function AdvancedChart({
  configuration,
  data,
  onDataPointClick,
  onChartReady,
  className = ''
}: AdvancedChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartInstance, setChartInstance] = useState<any>(null);
  const [dimensions, setDimensions] = useState(configuration.dimensions);

  // Memoize processed data
  const processedData = useMemo(() => {
    if (!data) return configuration.data;
    
    // Sort time series data by timestamp
    if (configuration.type === 'line' || configuration.type === 'area') {
      return [...data].sort((a, b) => {
        const aTime = 'timestamp' in a ? new Date(a.timestamp).getTime() : 0;
        const bTime = 'timestamp' in b ? new Date(b.timestamp).getTime() : 0;
        return aTime - bTime;
      });
    }
    
    return data;
  }, [data, configuration.data, configuration.type]);

  // Handle responsive resize
  useEffect(() => {
    if (!configuration.responsive) return;

    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const aspectRatio = configuration.dimensions.height / configuration.dimensions.width;
        
        setDimensions({
          ...configuration.dimensions,
          width: containerWidth,
          height: containerWidth * aspectRatio
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial resize

    return () => window.removeEventListener('resize', handleResize);
  }, [configuration.responsive, configuration.dimensions]);

  // Main chart rendering effect
  useEffect(() => {
    if (!svgRef.current || !processedData.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous chart

    const { width, height, margin = { top: 20, right: 30, bottom: 40, left: 40 } } = dimensions;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create main group
    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Render chart based on type
    switch (configuration.type) {
      case 'line':
        renderLineChart(g, processedData as TimeSeriesDataPoint[], innerWidth, innerHeight);
        break;
      case 'bar':
        renderBarChart(g, processedData, innerWidth, innerHeight);
        break;
      case 'area':
        renderAreaChart(g, processedData as TimeSeriesDataPoint[], innerWidth, innerHeight);
        break;
      case 'pie':
        renderPieChart(g, processedData, Math.min(innerWidth, innerHeight) / 2);
        break;
      case 'donut':
        renderDonutChart(g, processedData, Math.min(innerWidth, innerHeight) / 2);
        break;
      case 'scatter':
        renderScatterPlot(g, processedData, innerWidth, innerHeight);
        break;
      case 'gauge':
        renderGaugeChart(g, processedData[0], Math.min(innerWidth, innerHeight) / 2);
        break;
      default:
        console.warn(`Chart type ${configuration.type} not implemented`);
    }

    // Add title if provided
    if (configuration.title) {
      svg
        .append('text')
        .attr('x', width / 2)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', 'bold')
        .style('fill', configuration.styling?.theme === 'dark' ? '#ffffff' : '#333333')
        .text(configuration.title);
    }

    const instance = { svg, g, data: processedData, dimensions };
    setChartInstance(instance);
    onChartReady?.(instance);

  }, [processedData, dimensions, configuration, onDataPointClick, onChartReady]);

  // Line Chart Implementation
  const renderLineChart = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    data: TimeSeriesDataPoint[],
    width: number,
    height: number
  ) => {
    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => new Date(d.timestamp)) as [Date, Date])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.value) as [number, number])
      .nice()
      .range([height, 0]);

    // Add axes
    if (configuration.axes?.x !== false) {
      g.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat('%m/%d')));
    }

    if (configuration.axes?.y !== false) {
      g.append('g')
        .call(d3.axisLeft(yScale));
    }

    // Add grid lines
    if (configuration.axes?.x?.gridLines) {
      g.append('g')
        .attr('class', 'grid')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickSize(-height).tickFormat(() => ''))
        .style('stroke-dasharray', '3,3')
        .style('opacity', 0.3);
    }

    if (configuration.axes?.y?.gridLines) {
      g.append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft(yScale).tickSize(-width).tickFormat(() => ''))
        .style('stroke-dasharray', '3,3')
        .style('opacity', 0.3);
    }

    // Create line generator
    const line = d3.line<TimeSeriesDataPoint>()
      .x(d => xScale(new Date(d.timestamp)))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Add the line
    const path = g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', configuration.styling?.colorScheme?.[0] || '#3b82f6')
      .attr('stroke-width', configuration.styling?.strokeWidth || 2)
      .attr('d', line);

    // Add animation
    if (configuration.animation?.enabled) {
      const totalLength = path.node()?.getTotalLength() || 0;
      path
        .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
        .attr('stroke-dashoffset', totalLength)
        .transition()
        .duration(configuration.animation.duration)
        .ease(d3.easeLinear)
        .attr('stroke-dashoffset', 0);
    }

    // Add data points
    g.selectAll('.dot')
      .data(data)
      .enter().append('circle')
      .attr('class', 'dot')
      .attr('cx', d => xScale(new Date(d.timestamp)))
      .attr('cy', d => yScale(d.value))
      .attr('r', 4)
      .attr('fill', configuration.styling?.colorScheme?.[0] || '#3b82f6')
      .style('cursor', onDataPointClick ? 'pointer' : 'default')
      .on('click', (event, d) => onDataPointClick?.(d))
      .on('mouseover', function(event, d) {
        if (configuration.interactions?.tooltip?.enabled) {
          showTooltip(event, d);
        }
        d3.select(this).attr('r', 6);
      })
      .on('mouseout', function() {
        hideTooltip();
        d3.select(this).attr('r', 4);
      });
  };

  // Bar Chart Implementation
  const renderBarChart = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    data: ChartDataPoint[],
    width: number,
    height: number
  ) => {
    const xScale = d3.scaleBand()
      .domain(data.map(d => d.label))
      .range([0, width])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value) || 0])
      .nice()
      .range([height, 0]);

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale));

    g.append('g')
      .call(d3.axisLeft(yScale));

    // Add bars
    g.selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.label) || 0)
      .attr('width', xScale.bandwidth())
      .attr('y', height)
      .attr('height', 0)
      .attr('fill', (d, i) => configuration.styling?.colorScheme?.[i % (configuration.styling?.colorScheme?.length || 1)] || '#3b82f6')
      .style('cursor', onDataPointClick ? 'pointer' : 'default')
      .on('click', (event, d) => onDataPointClick?.(d))
      .on('mouseover', function(event, d) {
        if (configuration.interactions?.tooltip?.enabled) {
          showTooltip(event, d);
        }
        d3.select(this).attr('opacity', 0.8);
      })
      .on('mouseout', function() {
        hideTooltip();
        d3.select(this).attr('opacity', 1);
      })
      .transition()
      .duration(configuration.animation?.duration || 750)
      .attr('y', d => yScale(d.value))
      .attr('height', d => height - yScale(d.value));
  };

  // Area Chart Implementation
  const renderAreaChart = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    data: TimeSeriesDataPoint[],
    width: number,
    height: number
  ) => {
    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => new Date(d.timestamp)) as [Date, Date])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value) || 0])
      .nice()
      .range([height, 0]);

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat('%m/%d')));

    g.append('g')
      .call(d3.axisLeft(yScale));

    // Create area generator
    const area = d3.area<TimeSeriesDataPoint>()
      .x(d => xScale(new Date(d.timestamp)))
      .y0(height)
      .y1(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Add gradient if enabled
    if (configuration.styling?.gradient) {
      const gradient = g.append('defs')
        .append('linearGradient')
        .attr('id', `area-gradient-${configuration.id}`)
        .attr('gradientUnits', 'userSpaceOnUse')
        .attr('x1', 0).attr('y1', height)
        .attr('x2', 0).attr('y2', 0);

      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', configuration.styling?.colorScheme?.[0] || '#3b82f6')
        .attr('stop-opacity', 0.1);

      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', configuration.styling?.colorScheme?.[0] || '#3b82f6')
        .attr('stop-opacity', 0.8);
    }

    // Add the area
    g.append('path')
      .datum(data)
      .attr('fill', configuration.styling?.gradient ? `url(#area-gradient-${configuration.id})` : configuration.styling?.colorScheme?.[0] || '#3b82f6')
      .attr('opacity', configuration.styling?.opacity || 0.7)
      .attr('d', area);
  };

  // Pie Chart Implementation
  const renderPieChart = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    data: ChartDataPoint[],
    radius: number
  ) => {
    const pie = d3.pie<ChartDataPoint>()
      .value(d => d.value)
      .sort(null);

    const arc = d3.arc<d3.PieArcDatum<ChartDataPoint>>()
      .innerRadius(0)
      .outerRadius(radius);

    const arcs = g.selectAll('.arc')
      .data(pie(data))
      .enter().append('g')
      .attr('class', 'arc')
      .attr('transform', `translate(${radius},${radius})`);

    arcs.append('path')
      .attr('d', arc)
      .attr('fill', (d, i) => configuration.styling?.colorScheme?.[i % (configuration.styling?.colorScheme?.length || 1)] || d3.schemeCategory10[i])
      .style('cursor', onDataPointClick ? 'pointer' : 'default')
      .on('click', (event, d) => onDataPointClick?.(d.data))
      .on('mouseover', function(event, d) {
        if (configuration.interactions?.tooltip?.enabled) {
          showTooltip(event, d.data);
        }
        d3.select(this).attr('opacity', 0.8);
      })
      .on('mouseout', function() {
        hideTooltip();
        d3.select(this).attr('opacity', 1);
      });

    // Add labels
    arcs.append('text')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#ffffff')
      .text(d => d.data.label);
  };

  // Donut Chart Implementation
  const renderDonutChart = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    data: ChartDataPoint[],
    radius: number
  ) => {
    const pie = d3.pie<ChartDataPoint>()
      .value(d => d.value)
      .sort(null);

    const arc = d3.arc<d3.PieArcDatum<ChartDataPoint>>()
      .innerRadius(radius * 0.6)
      .outerRadius(radius);

    const arcs = g.selectAll('.arc')
      .data(pie(data))
      .enter().append('g')
      .attr('class', 'arc')
      .attr('transform', `translate(${radius},${radius})`);

    arcs.append('path')
      .attr('d', arc)
      .attr('fill', (d, i) => configuration.styling?.colorScheme?.[i % (configuration.styling?.colorScheme?.length || 1)] || d3.schemeCategory10[i])
      .style('cursor', onDataPointClick ? 'pointer' : 'default')
      .on('click', (event, d) => onDataPointClick?.(d.data))
      .on('mouseover', function(event, d) {
        if (configuration.interactions?.tooltip?.enabled) {
          showTooltip(event, d.data);
        }
      })
      .on('mouseout', hideTooltip);

    // Add center text
    g.append('text')
      .attr('transform', `translate(${radius},${radius})`)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('font-size', '24px')
      .style('font-weight', 'bold')
      .style('fill', configuration.styling?.theme === 'dark' ? '#ffffff' : '#333333')
      .text(d3.sum(data, d => d.value).toLocaleString());
  };

  // Scatter Plot Implementation
  const renderScatterPlot = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    data: ChartDataPoint[],
    width: number,
    height: number
  ) => {
    const xScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.value) as [number, number])
      .nice()
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.metadata?.y || 0) as [number, number])
      .nice()
      .range([height, 0]);

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale));

    g.append('g')
      .call(d3.axisLeft(yScale));

    // Add dots
    g.selectAll('.dot')
      .data(data)
      .enter().append('circle')
      .attr('class', 'dot')
      .attr('cx', d => xScale(d.value))
      .attr('cy', d => yScale(d.metadata?.y || 0))
      .attr('r', d => Math.sqrt(d.metadata?.size || 50))
      .attr('fill', (d, i) => configuration.styling?.colorScheme?.[i % (configuration.styling?.colorScheme?.length || 1)] || '#3b82f6')
      .attr('opacity', configuration.styling?.opacity || 0.7)
      .style('cursor', onDataPointClick ? 'pointer' : 'default')
      .on('click', (event, d) => onDataPointClick?.(d))
      .on('mouseover', function(event, d) {
        if (configuration.interactions?.tooltip?.enabled) {
          showTooltip(event, d);
        }
        d3.select(this).attr('opacity', 1);
      })
      .on('mouseout', function() {
        hideTooltip();
        d3.select(this).attr('opacity', configuration.styling?.opacity || 0.7);
      });
  };

  // Gauge Chart Implementation
  const renderGaugeChart = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    dataPoint: ChartDataPoint,
    radius: number
  ) => {
    const value = dataPoint.value;
    const maxValue = dataPoint.metadata?.max || 100;
    const minValue = dataPoint.metadata?.min || 0;
    
    const angleScale = d3.scaleLinear()
      .domain([minValue, maxValue])
      .range([-Math.PI / 2, Math.PI / 2]);

    // Background arc
    const backgroundArc = d3.arc()
      .innerRadius(radius * 0.7)
      .outerRadius(radius)
      .startAngle(-Math.PI / 2)
      .endAngle(Math.PI / 2);

    g.append('path')
      .attr('d', backgroundArc)
      .attr('fill', '#e5e7eb')
      .attr('transform', `translate(${radius},${radius})`);

    // Value arc
    const valueArc = d3.arc()
      .innerRadius(radius * 0.7)
      .outerRadius(radius)
      .startAngle(-Math.PI / 2)
      .endAngle(angleScale(value));

    g.append('path')
      .attr('d', valueArc)
      .attr('fill', configuration.styling?.colorScheme?.[0] || '#3b82f6')
      .attr('transform', `translate(${radius},${radius})`);

    // Center text
    g.append('text')
      .attr('transform', `translate(${radius},${radius + 10})`)
      .attr('text-anchor', 'middle')
      .style('font-size', '24px')
      .style('font-weight', 'bold')
      .style('fill', configuration.styling?.theme === 'dark' ? '#ffffff' : '#333333')
      .text(`${value}%`);
  };

  // Tooltip functions
  const showTooltip = (event: any, data: ChartDataPoint) => {
    const tooltip = d3.select('body')
      .append('div')
      .attr('class', 'chart-tooltip')
      .style('position', 'absolute')
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('padding', '8px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('opacity', 0);

    const content = configuration.interactions?.tooltip?.customRenderer?.(data) || 
      `${data.label}: ${data.value.toLocaleString()}`;

    tooltip
      .html(content)
      .style('left', (event.pageX + 10) + 'px')
      .style('top', (event.pageY - 10) + 'px')
      .transition()
      .duration(200)
      .style('opacity', 1);
  };

  const hideTooltip = () => {
    d3.selectAll('.chart-tooltip').remove();
  };

  return (
    <div ref={containerRef} className={`advanced-chart ${className}`}>
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ display: 'block' }}
      />
      {configuration.description && (
        <p className="text-sm text-gray-600 mt-2 text-center">
          {configuration.description}
        </p>
      )}
    </div>
  );
}

export default AdvancedChart;
