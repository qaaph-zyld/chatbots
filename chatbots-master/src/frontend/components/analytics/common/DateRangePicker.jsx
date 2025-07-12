import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Form, Button, Row, Col, Dropdown } from 'react-bootstrap';
import { DateRangePicker as ReactDateRangePicker } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

/**
 * Date Range Picker component for filtering analytics data
 * Provides date range selection and period options
 */
const DateRangePicker = ({ dateRange, onChange }) => {
  const [showCalendar, setShowCalendar] = useState(false);
  
  // Handle date range selection
  const handleSelect = (ranges) => {
    const { startDate, endDate } = ranges.selection;
    onChange({
      ...dateRange,
      startDate,
      endDate
    });
  };
  
  // Handle period selection
  const handlePeriodChange = (period) => {
    onChange({
      ...dateRange,
      period
    });
  };
  
  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Predefined date ranges
  const setPresetRange = (days) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    onChange({
      ...dateRange,
      startDate,
      endDate
    });
    
    setShowCalendar(false);
  };
  
  // Date range selection configuration
  const selectionRange = {
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    key: 'selection'
  };

  return (
    <div className="date-range-picker">
      <Row className="align-items-center">
        <Col>
          <Button 
            variant="outline-secondary" 
            className="date-display"
            onClick={() => setShowCalendar(!showCalendar)}
          >
            <i className="bi bi-calendar3"></i>
            {' '}
            {formatDate(dateRange.startDate)} - {formatDate(dateRange.endDate)}
          </Button>
          
          {showCalendar && (
            <div className="calendar-popup">
              <div className="d-flex justify-content-between mb-2">
                <Button variant="link" size="sm" onClick={() => setPresetRange(7)}>Last 7 days</Button>
                <Button variant="link" size="sm" onClick={() => setPresetRange(30)}>Last 30 days</Button>
                <Button variant="link" size="sm" onClick={() => setPresetRange(90)}>Last 90 days</Button>
              </div>
              
              <ReactDateRangePicker
                ranges={[selectionRange]}
                onChange={handleSelect}
                maxDate={new Date()}
              />
              
              <div className="d-flex justify-content-end mt-2">
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={() => setShowCalendar(false)}
                >
                  Apply
                </Button>
              </div>
            </div>
          )}
        </Col>
        
        <Col xs="auto">
          <Dropdown>
            <Dropdown.Toggle variant="outline-secondary" id="period-dropdown">
              {dateRange.period === 'daily' && 'Daily'}
              {dateRange.period === 'weekly' && 'Weekly'}
              {dateRange.period === 'monthly' && 'Monthly'}
            </Dropdown.Toggle>
            
            <Dropdown.Menu>
              <Dropdown.Item 
                active={dateRange.period === 'daily'}
                onClick={() => handlePeriodChange('daily')}
              >
                Daily
              </Dropdown.Item>
              <Dropdown.Item 
                active={dateRange.period === 'weekly'}
                onClick={() => handlePeriodChange('weekly')}
              >
                Weekly
              </Dropdown.Item>
              <Dropdown.Item 
                active={dateRange.period === 'monthly'}
                onClick={() => handlePeriodChange('monthly')}
              >
                Monthly
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Col>
      </Row>
    </div>
  );
};

DateRangePicker.propTypes = {
  dateRange: PropTypes.shape({
    startDate: PropTypes.instanceOf(Date).isRequired,
    endDate: PropTypes.instanceOf(Date).isRequired,
    period: PropTypes.oneOf(['daily', 'weekly', 'monthly']).isRequired
  }).isRequired,
  onChange: PropTypes.func.isRequired
};

export default DateRangePicker;