import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

/**
 * ActionNode Component
 * 
 * Represents a node that performs an action in the workflow
 */
const ActionNode = ({ data, isConnectable }) => {
  // Get action display text
  const getActionDisplay = () => {
    if (!data.action) return 'No action set';
    
    const { type, variable, value, expression, milliseconds } = data.action;
    
    switch (type) {
      case 'setVariable':
        return `Set ${variable || 'variable'} = ${value || ''}`;
      case 'calculateValue':
        return `Calculate: ${expression || ''}`;
      case 'delay':
        return `Delay: ${milliseconds || 1000}ms`;
      default:
        return `Action: ${type}`;
    }
  };
  
  return (
    <div className="workflow-node workflow-node--action">
      <Handle
        type="target"
        position={Position.Top}
        id="in"
        isConnectable={isConnectable}
        className="workflow-node__handle workflow-node__handle--input"
      />
      
      <div className="workflow-node__header">
        <div className="workflow-node__icon">⚙️</div>
        <div className="workflow-node__title">Action</div>
        <div className="workflow-node__subtitle">{data.action?.type || 'setVariable'}</div>
      </div>
      
      <div className="workflow-node__content">
        <div className="workflow-node__action-display">
          {getActionDisplay()}
        </div>
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

export default memo(ActionNode);
