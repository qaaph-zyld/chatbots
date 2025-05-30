import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

/**
 * ContextNode Component
 * 
 * Represents a node that interacts with the advanced context awareness system
 */
const ContextNode = ({ data, isConnectable }) => {
  // Get context operation display text
  const getContextDisplay = () => {
    if (!data.contextOperation) return 'No operation set';
    
    const { type, category, key, value } = data.contextOperation;
    
    switch (type) {
      case 'setPreference':
        return `Set ${category ? category + '.' : ''}${key || 'preference'} = ${value || ''}`;
      case 'trackEntity':
        return 'Track entity';
      case 'detectTopic':
        return 'Detect topic';
      default:
        return `Context: ${type}`;
    }
  };
  
  return (
    <div className="workflow-node workflow-node--context">
      <Handle
        type="target"
        position={Position.Top}
        id="in"
        isConnectable={isConnectable}
        className="workflow-node__handle workflow-node__handle--input"
      />
      
      <div className="workflow-node__header">
        <div className="workflow-node__icon">🧠</div>
        <div className="workflow-node__title">Context</div>
        <div className="workflow-node__subtitle">{data.contextOperation?.type || 'setPreference'}</div>
      </div>
      
      <div className="workflow-node__content">
        <div className="workflow-node__context-display">
          {getContextDisplay()}
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

export default memo(ContextNode);
