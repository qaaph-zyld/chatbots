import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

/**
 * IntegrationNode Component
 * 
 * Represents a node that connects to external systems and APIs
 */
const IntegrationNode = ({ data, isConnectable }) => {
  // Get integration display text
  const getIntegrationDisplay = () => {
    if (!data.integration) return 'No integration set';
    
    const { type, url, method } = data.integration;
    
    switch (type) {
      case 'http':
        return `${method || 'GET'} ${url ? (url.length > 25 ? url.substring(0, 25) + '...' : url) : 'URL'}`;
      case 'database':
        return 'Database operation';
      default:
        return `Integration: ${type}`;
    }
  };
  
  return (
    <div className="workflow-node workflow-node--integration">
      <Handle
        type="target"
        position={Position.Top}
        id="in"
        isConnectable={isConnectable}
        className="workflow-node__handle workflow-node__handle--input"
      />
      
      <div className="workflow-node__header">
        <div className="workflow-node__icon">🔌</div>
        <div className="workflow-node__title">Integration</div>
        <div className="workflow-node__subtitle">{data.integration?.type || 'http'}</div>
      </div>
      
      <div className="workflow-node__content">
        <div className="workflow-node__integration-display">
          {getIntegrationDisplay()}
        </div>
        
        {/* Show proxy info if using HTTP */}
        {data.integration?.type === 'http' && (
          <div className="workflow-node__proxy-info">
            <small>Using proxy: 104.129.196.38:10563</small>
          </div>
        )}
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        id="out"
        isConnectable={isConnectable}
        className="workflow-node__handle workflow-node__handle--output"
      />
    </div>
  );
};

export default memo(IntegrationNode);
