import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

/**
 * EndNode Component
 * 
 * Represents the end point of a workflow path
 */
const EndNode = ({ data, isConnectable }) => {
  return (
    <div className="workflow-node workflow-node--end">
      <Handle
        type="target"
        position={Position.Top}
        id="in"
        isConnectable={isConnectable}
        className="workflow-node__handle workflow-node__handle--input"
      />
      
      <div className="workflow-node__header">
        <div className="workflow-node__icon">🔴</div>
        <div className="workflow-node__title">End</div>
      </div>
      
      <div className="workflow-node__content">
        <p>Workflow end point</p>
      </div>
    </div>
  );
};

export default memo(EndNode);
