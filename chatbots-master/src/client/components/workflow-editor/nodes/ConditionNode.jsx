import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

/**
 * ConditionNode Component
 * 
 * Represents a conditional branch in the workflow
 */
const ConditionNode = ({ data, isConnectable }) => {
  // Format condition for display
  const getConditionDisplay = () => {
    if (!data.condition) return 'No condition set';
    
    const { field, operator, value } = data.condition;
    
    if (!field) return 'No field set';
    
    switch (operator) {
      case 'equals':
        return `${field} = ${value}`;
      case 'notEquals':
        return `${field} ≠ ${value}`;
      case 'contains':
        return `${field} contains "${value}"`;
      case 'notContains':
        return `${field} does not contain "${value}"`;
      case 'greaterThan':
        return `${field} > ${value}`;
      case 'lessThan':
        return `${field} < ${value}`;
      case 'exists':
        return `${field} exists`;
      case 'notExists':
        return `${field} does not exist`;
      default:
        return `${field} ${operator} ${value}`;
    }
  };
  
  return (
    <div className="workflow-node workflow-node--condition">
      <Handle
        type="target"
        position={Position.Top}
        id="in"
        isConnectable={isConnectable}
        className="workflow-node__handle workflow-node__handle--input"
      />
      
      <div className="workflow-node__header">
        <div className="workflow-node__icon">❓</div>
        <div className="workflow-node__title">Condition</div>
      </div>
      
      <div className="workflow-node__content">
        <div className="workflow-node__condition">
          {getConditionDisplay()}
        </div>
      </div>
      
      <div className="workflow-node__outputs">
        <div className="workflow-node__output workflow-node__output--true">
          <span>True</span>
          <Handle
            type="source"
            position={Position.Bottom}
            id="true"
            isConnectable={isConnectable}
            className="workflow-node__handle workflow-node__handle--output workflow-node__handle--true"
            style={{ left: '25%' }}
          />
        </div>
        
        <div className="workflow-node__output workflow-node__output--false">
          <span>False</span>
          <Handle
            type="source"
            position={Position.Bottom}
            id="false"
            isConnectable={isConnectable}
            className="workflow-node__handle workflow-node__handle--output workflow-node__handle--false"
            style={{ left: '75%' }}
          />
        </div>
      </div>
    </div>
  );
};

export default memo(ConditionNode);
