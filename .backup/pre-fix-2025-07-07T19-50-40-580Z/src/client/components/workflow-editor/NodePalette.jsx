import React from 'react';

/**
 * NodePalette Component
 * 
 * Provides a palette of node types that can be dragged onto the workflow canvas
 */
const NodePalette = () => {
  // Handle drag start for node types
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };
  
  return (
    <div className="node-palette">
      <h3>Node Types</h3>
      <div className="node-palette__items">
        <div 
          className="node-palette__item node-palette__item--start"
          onDragStart={(e) => onDragStart(e, 'start')}
          draggable
        >
          <div className="node-palette__item-icon">⚫</div>
          <div className="node-palette__item-label">Start</div>
        </div>
        
        <div 
          className="node-palette__item node-palette__item--message"
          onDragStart={(e) => onDragStart(e, 'message')}
          draggable
        >
          <div className="node-palette__item-icon">💬</div>
          <div className="node-palette__item-label">Message</div>
        </div>
        
        <div 
          className="node-palette__item node-palette__item--condition"
          onDragStart={(e) => onDragStart(e, 'condition')}
          draggable
        >
          <div className="node-palette__item-icon">❓</div>
          <div className="node-palette__item-label">Condition</div>
        </div>
        
        <div 
          className="node-palette__item node-palette__item--input"
          onDragStart={(e) => onDragStart(e, 'input')}
          draggable
        >
          <div className="node-palette__item-icon">📝</div>
          <div className="node-palette__item-label">Input</div>
        </div>
        
        <div 
          className="node-palette__item node-palette__item--action"
          onDragStart={(e) => onDragStart(e, 'action')}
          draggable
        >
          <div className="node-palette__item-icon">⚙️</div>
          <div className="node-palette__item-label">Action</div>
        </div>
        
        <div 
          className="node-palette__item node-palette__item--integration"
          onDragStart={(e) => onDragStart(e, 'integration')}
          draggable
        >
          <div className="node-palette__item-icon">🔌</div>
          <div className="node-palette__item-label">Integration</div>
        </div>
        
        <div 
          className="node-palette__item node-palette__item--context"
          onDragStart={(e) => onDragStart(e, 'context')}
          draggable
        >
          <div className="node-palette__item-icon">🧠</div>
          <div className="node-palette__item-label">Context</div>
        </div>
        
        <div 
          className="node-palette__item node-palette__item--jump"
          onDragStart={(e) => onDragStart(e, 'jump')}
          draggable
        >
          <div className="node-palette__item-icon">↪️</div>
          <div className="node-palette__item-label">Jump</div>
        </div>
        
        <div 
          className="node-palette__item node-palette__item--end"
          onDragStart={(e) => onDragStart(e, 'end')}
          draggable
        >
          <div className="node-palette__item-icon">🔴</div>
          <div className="node-palette__item-label">End</div>
        </div>
      </div>
      
      <div className="node-palette__help">
        <h4>How to use:</h4>
        <ol>
          <li>Drag a node from the palette to the canvas</li>
          <li>Connect nodes by dragging from one handle to another</li>
          <li>Click on a node to edit its properties</li>
          <li>Save your workflow when finished</li>
        </ol>
      </div>
    </div>
  );
};

export default NodePalette;
