import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

/**
 * InputNode Component
 * 
 * Represents a node that collects input from the user
 */
const InputNode = ({ data, isConnectable }) => {
  // Get prompt preview (truncate if too long)
  const promptPreview = data.prompt 
    ? data.prompt.length > 50 
      ? `${data.prompt.substring(0, 50)}...` 
      : data.prompt
    : 'No prompt set';
  
  // Get icon based on input type
  const getIcon = () => {
    switch (data.inputType) {
      case 'number':
        return '🔢';
      case 'date':
        return '📅';
      case 'time':
        return '⏰';
      case 'email':
        return '📧';
      case 'phone':
        return '📱';
      case 'select':
        return '📋';
      default:
        return '📝';
    }
  };
  
  return (
    <div className="workflow-node workflow-node--input">
      <Handle
        type="target"
        position={Position.Top}
        id="in"
        isConnectable={isConnectable}
        className="workflow-node__handle workflow-node__handle--input"
      />
      
      <div className="workflow-node__header">
        <div className="workflow-node__icon">{getIcon()}</div>
        <div className="workflow-node__title">Input</div>
        <div className="workflow-node__subtitle">{data.inputType || 'text'}</div>
      </div>
      
      <div className="workflow-node__content">
        <div className="workflow-node__prompt-preview">
          {promptPreview}
        </div>
        
        {data.inputType === 'select' && data.options && data.options.length > 0 && (
          <div className="workflow-node__options-preview">
            <small>{data.options.length} option(s)</small>
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

export default memo(InputNode);
