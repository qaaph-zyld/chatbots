import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

/**
 * JumpNode Component
 * 
 * Represents a node that jumps to another node in the workflow
 */
const JumpNode = ({ data, isConnectable }) => {
  return (
    <div className="workflow-node workflow-node--jump">
      <Handle
        type="target"
        position={Position.Top}
        id="in"
        isConnectable={isConnectable}
        className="workflow-node__handle workflow-node__handle--input"
      />
      
      <div className="workflow-node__header">
        <div className="workflow-node__icon">↪️</div>
        <div className="workflow-node__title">Jump</div>
      </div>
      
      <div className="workflow-node__content">
        <div className="workflow-node__jump-target">
          {data.targetNodeId 
            ? `Jump to: ${data.targetNodeId}`
            : 'No target selected'}
        </div>
      </div>
    </div>
  );
};

export default memo(JumpNode);
