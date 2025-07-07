import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

/**
 * StartNode Component
 * 
 * Represents the starting point of a workflow
 */
const StartNode = ({ data, isConnectable }) => {
  return (
    <div className="workflow-node workflow-node--start">
      <div className="workflow-node__header">
        <div className="workflow-node__icon">⚫</div>
        <div className="workflow-node__title">Start</div>
      </div>
      <div className="workflow-node__content">
        <p>Workflow starting point</p>
      </div>
      
      {/* Output handle */}
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

export default memo(StartNode);
