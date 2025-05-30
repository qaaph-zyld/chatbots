import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

/**
 * MessageNode Component
 * 
 * Represents a node that sends a message to the user
 */
const MessageNode = ({ data, isConnectable }) => {
  // Get message preview (truncate if too long)
  const messagePreview = data.message 
    ? data.message.length > 50 
      ? `${data.message.substring(0, 50)}...` 
      : data.message
    : 'No message set';
  
  // Get icon based on message type
  const getIcon = () => {
    switch (data.messageType) {
      case 'image':
        return '🖼️';
      case 'card':
        return '📇';
      case 'buttons':
        return '🔘';
      case 'quick_replies':
        return '⚡';
      default:
        return '💬';
    }
  };
  
  return (
    <div className="workflow-node workflow-node--message">
      <Handle
        type="target"
        position={Position.Top}
        id="in"
        isConnectable={isConnectable}
        className="workflow-node__handle workflow-node__handle--input"
      />
      
      <div className="workflow-node__header">
        <div className="workflow-node__icon">{getIcon()}</div>
        <div className="workflow-node__title">Message</div>
        <div className="workflow-node__subtitle">{data.messageType || 'text'}</div>
      </div>
      
      <div className="workflow-node__content">
        <div className="workflow-node__message-preview">
          {messagePreview}
        </div>
        
        {data.messageType === 'buttons' && data.buttons && data.buttons.length > 0 && (
          <div className="workflow-node__buttons-preview">
            <small>{data.buttons.length} button(s)</small>
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

export default memo(MessageNode);
