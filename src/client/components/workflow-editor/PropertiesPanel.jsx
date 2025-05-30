import React from 'react';

/**
 * PropertiesPanel Component
 * 
 * Provides a panel for editing the properties of a selected node
 */
const PropertiesPanel = ({ node, nodes, onUpdate, onDelete }) => {
  if (!node) {
    return null;
  }
  
  // Handle input changes
  const handleChange = (field, value) => {
    onUpdate(node.id, { [field]: value });
  };
  
  // Handle nested data changes
  const handleDataChange = (field, value) => {
    const newData = { ...node.data };
    newData[field] = value;
    onUpdate(node.id, newData);
  };
  
  // Handle nested object property changes
  const handleNestedChange = (object, property, value) => {
    const newData = { ...node.data };
    if (!newData[object]) {
      newData[object] = {};
    }
    newData[object][property] = value;
    onUpdate(node.id, newData);
  };
  
  // Render different property forms based on node type
  const renderProperties = () => {
    switch (node.type) {
      case 'start':
        return (
          <div className="properties-panel__start">
            <p>This is the starting point of your workflow.</p>
            <p>Connect this node to the first step in your workflow.</p>
          </div>
        );
        
      case 'message':
        return (
          <div className="properties-panel__message">
            <div className="form-group">
              <label htmlFor="message-text">Message</label>
              <textarea
                id="message-text"
                value={node.data.message || ''}
                onChange={(e) => handleDataChange('message', e.target.value)}
                placeholder="Enter message text"
                rows={4}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="message-type">Message Type</label>
              <select
                id="message-type"
                value={node.data.messageType || 'text'}
                onChange={(e) => handleDataChange('messageType', e.target.value)}
              >
                <option value="text">Text</option>
                <option value="image">Image</option>
                <option value="card">Card</option>
                <option value="buttons">Buttons</option>
                <option value="quick_replies">Quick Replies</option>
              </select>
            </div>
            
            {node.data.messageType === 'buttons' && (
              <div className="form-group">
                <label>Buttons</label>
                {(node.data.buttons || []).map((button, index) => (
                  <div key={index} className="button-item">
                    <input
                      type="text"
                      value={button.text}
                      onChange={(e) => {
                        const newButtons = [...(node.data.buttons || [])];
                        newButtons[index].text = e.target.value;
                        handleDataChange('buttons', newButtons);
                      }}
                      placeholder="Button text"
                    />
                    <select
                      value={button.type}
                      onChange={(e) => {
                        const newButtons = [...(node.data.buttons || [])];
                        newButtons[index].type = e.target.value;
                        handleDataChange('buttons', newButtons);
                      }}
                    >
                      <option value="url">URL</option>
                      <option value="postback">Postback</option>
                    </select>
                    <input
                      type="text"
                      value={button.value}
                      onChange={(e) => {
                        const newButtons = [...(node.data.buttons || [])];
                        newButtons[index].value = e.target.value;
                        handleDataChange('buttons', newButtons);
                      }}
                      placeholder="Button value"
                    />
                    <button
                      onClick={() => {
                        const newButtons = [...(node.data.buttons || [])];
                        newButtons.splice(index, 1);
                        handleDataChange('buttons', newButtons);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newButtons = [...(node.data.buttons || []), { text: '', type: 'url', value: '' }];
                    handleDataChange('buttons', newButtons);
                  }}
                >
                  Add Button
                </button>
              </div>
            )}
          </div>
        );
        
      case 'condition':
        return (
          <div className="properties-panel__condition">
            <div className="form-group">
              <label htmlFor="condition-field">Field</label>
              <input
                id="condition-field"
                type="text"
                value={node.data.condition?.field || ''}
                onChange={(e) => handleNestedChange('condition', 'field', e.target.value)}
                placeholder="e.g., user.name, data.value"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="condition-operator">Operator</label>
              <select
                id="condition-operator"
                value={node.data.condition?.operator || 'equals'}
                onChange={(e) => handleNestedChange('condition', 'operator', e.target.value)}
              >
                <option value="equals">Equals</option>
                <option value="notEquals">Not Equals</option>
                <option value="contains">Contains</option>
                <option value="notContains">Not Contains</option>
                <option value="greaterThan">Greater Than</option>
                <option value="lessThan">Less Than</option>
                <option value="exists">Exists</option>
                <option value="notExists">Not Exists</option>
              </select>
            </div>
            
            {node.data.condition?.operator !== 'exists' && node.data.condition?.operator !== 'notExists' && (
              <div className="form-group">
                <label htmlFor="condition-value">Value</label>
                <input
                  id="condition-value"
                  type="text"
                  value={node.data.condition?.value || ''}
                  onChange={(e) => handleNestedChange('condition', 'value', e.target.value)}
                  placeholder="Value to compare against"
                />
              </div>
            )}
            
            <div className="form-group">
              <p>Connect this node to two paths:</p>
              <ul>
                <li>Connect with condition "true" for when the condition is met</li>
                <li>Connect with condition "false" for when the condition is not met</li>
              </ul>
            </div>
          </div>
        );
        
      case 'input':
        return (
          <div className="properties-panel__input">
            <div className="form-group">
              <label htmlFor="input-prompt">Prompt</label>
              <textarea
                id="input-prompt"
                value={node.data.prompt || ''}
                onChange={(e) => handleDataChange('prompt', e.target.value)}
                placeholder="Enter prompt text"
                rows={3}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="input-type">Input Type</label>
              <select
                id="input-type"
                value={node.data.inputType || 'text'}
                onChange={(e) => handleDataChange('inputType', e.target.value)}
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="time">Time</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="select">Select (Options)</option>
              </select>
            </div>
            
            {node.data.inputType === 'select' && (
              <div className="form-group">
                <label>Options</label>
                {(node.data.options || []).map((option, index) => (
                  <div key={index} className="option-item">
                    <input
                      type="text"
                      value={option.label}
                      onChange={(e) => {
                        const newOptions = [...(node.data.options || [])];
                        newOptions[index].label = e.target.value;
                        handleDataChange('options', newOptions);
                      }}
                      placeholder="Option label"
                    />
                    <input
                      type="text"
                      value={option.value}
                      onChange={(e) => {
                        const newOptions = [...(node.data.options || [])];
                        newOptions[index].value = e.target.value;
                        handleDataChange('options', newOptions);
                      }}
                      placeholder="Option value"
                    />
                    <button
                      onClick={() => {
                        const newOptions = [...(node.data.options || [])];
                        newOptions.splice(index, 1);
                        handleDataChange('options', newOptions);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newOptions = [...(node.data.options || []), { label: '', value: '' }];
                    handleDataChange('options', newOptions);
                  }}
                >
                  Add Option
                </button>
              </div>
            )}
          </div>
        );
        
      case 'action':
        return (
          <div className="properties-panel__action">
            <div className="form-group">
              <label htmlFor="action-type">Action Type</label>
              <select
                id="action-type"
                value={node.data.action?.type || 'setVariable'}
                onChange={(e) => handleNestedChange('action', 'type', e.target.value)}
              >
                <option value="setVariable">Set Variable</option>
                <option value="calculateValue">Calculate Value</option>
                <option value="delay">Delay</option>
              </select>
            </div>
            
            {node.data.action?.type === 'setVariable' && (
              <>
                <div className="form-group">
                  <label htmlFor="action-variable">Variable Name</label>
                  <input
                    id="action-variable"
                    type="text"
                    value={node.data.action?.variable || ''}
                    onChange={(e) => handleNestedChange('action', 'variable', e.target.value)}
                    placeholder="e.g., user.name, data.value"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="action-value">Value</label>
                  <input
                    id="action-value"
                    type="text"
                    value={node.data.action?.value || ''}
                    onChange={(e) => handleNestedChange('action', 'value', e.target.value)}
                    placeholder="Value to set"
                  />
                </div>
              </>
            )}
            
            {node.data.action?.type === 'calculateValue' && (
              <div className="form-group">
                <label htmlFor="action-expression">Expression</label>
                <input
                  id="action-expression"
                  type="text"
                  value={node.data.action?.expression || ''}
                  onChange={(e) => handleNestedChange('action', 'expression', e.target.value)}
                  placeholder="e.g., 2 + 2, ${data.value} * 100"
                />
                <small>Use ${variable} syntax to reference variables</small>
              </div>
            )}
            
            {node.data.action?.type === 'delay' && (
              <div className="form-group">
                <label htmlFor="action-delay">Delay (milliseconds)</label>
                <input
                  id="action-delay"
                  type="number"
                  value={node.data.action?.milliseconds || 1000}
                  onChange={(e) => handleNestedChange('action', 'milliseconds', parseInt(e.target.value))}
                  min={1}
                  step={100}
                />
              </div>
            )}
          </div>
        );
        
      case 'integration':
        return (
          <div className="properties-panel__integration">
            <div className="form-group">
              <label htmlFor="integration-type">Integration Type</label>
              <select
                id="integration-type"
                value={node.data.integration?.type || 'http'}
                onChange={(e) => handleNestedChange('integration', 'type', e.target.value)}
              >
                <option value="http">HTTP Request</option>
                <option value="database">Database</option>
              </select>
            </div>
            
            {node.data.integration?.type === 'http' && (
              <>
                <div className="form-group">
                  <label htmlFor="integration-url">URL</label>
                  <input
                    id="integration-url"
                    type="text"
                    value={node.data.integration?.url || ''}
                    onChange={(e) => handleNestedChange('integration', 'url', e.target.value)}
                    placeholder="https://example.com/api"
                  />
                  <small>Use ${variable} syntax to reference variables</small>
                </div>
                <div className="form-group">
                  <label htmlFor="integration-method">Method</label>
                  <select
                    id="integration-method"
                    value={node.data.integration?.method || 'GET'}
                    onChange={(e) => handleNestedChange('integration', 'method', e.target.value)}
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="integration-headers">Headers (JSON)</label>
                  <textarea
                    id="integration-headers"
                    value={node.data.integration?.headers ? JSON.stringify(node.data.integration.headers, null, 2) : '{}'}
                    onChange={(e) => {
                      try {
                        const headers = JSON.parse(e.target.value);
                        handleNestedChange('integration', 'headers', headers);
                      } catch (err) {
                        // Invalid JSON, don't update
                      }
                    }}
                    placeholder='{"Content-Type": "application/json"}'
                    rows={3}
                  />
                </div>
                {(node.data.integration?.method === 'POST' || 
                  node.data.integration?.method === 'PUT' || 
                  node.data.integration?.method === 'PATCH') && (
                  <div className="form-group">
                    <label htmlFor="integration-data">Request Body (JSON)</label>
                    <textarea
                      id="integration-data"
                      value={node.data.integration?.data ? JSON.stringify(node.data.integration.data, null, 2) : '{}'}
                      onChange={(e) => {
                        try {
                          const data = JSON.parse(e.target.value);
                          handleNestedChange('integration', 'data', data);
                        } catch (err) {
                          // Invalid JSON, don't update
                        }
                      }}
                      placeholder='{"key": "value"}'
                      rows={5}
                    />
                    <small>Use ${variable} syntax to reference variables</small>
                  </div>
                )}
              </>
            )}
            
            {node.data.integration?.type === 'database' && (
              <div className="form-group">
                <p>Database integrations are not yet implemented.</p>
              </div>
            )}
          </div>
        );
        
      case 'context':
        return (
          <div className="properties-panel__context">
            <div className="form-group">
              <label htmlFor="context-type">Context Operation</label>
              <select
                id="context-type"
                value={node.data.contextOperation?.type || 'setPreference'}
                onChange={(e) => handleNestedChange('contextOperation', 'type', e.target.value)}
              >
                <option value="setPreference">Set Preference</option>
                <option value="trackEntity">Track Entity</option>
                <option value="detectTopic">Detect Topic</option>
              </select>
            </div>
            
            {node.data.contextOperation?.type === 'setPreference' && (
              <>
                <div className="form-group">
                  <label htmlFor="context-category">Category</label>
                  <input
                    id="context-category"
                    type="text"
                    value={node.data.contextOperation?.category || ''}
                    onChange={(e) => handleNestedChange('contextOperation', 'category', e.target.value)}
                    placeholder="e.g., communication, interface"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="context-key">Key</label>
                  <input
                    id="context-key"
                    type="text"
                    value={node.data.contextOperation?.key || ''}
                    onChange={(e) => handleNestedChange('contextOperation', 'key', e.target.value)}
                    placeholder="e.g., responseStyle, theme"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="context-value">Value</label>
                  <input
                    id="context-value"
                    type="text"
                    value={node.data.contextOperation?.value || ''}
                    onChange={(e) => handleNestedChange('contextOperation', 'value', e.target.value)}
                    placeholder="Value to set"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="context-source">Source</label>
                  <select
                    id="context-source"
                    value={node.data.contextOperation?.source || 'explicit'}
                    onChange={(e) => handleNestedChange('contextOperation', 'source', e.target.value)}
                  >
                    <option value="explicit">Explicit</option>
                    <option value="implicit">Implicit</option>
                  </select>
                </div>
              </>
            )}
            
            {node.data.contextOperation?.type === 'trackEntity' && (
              <div className="form-group">
                <p>Entity tracking operations are not yet implemented in the visual editor.</p>
              </div>
            )}
            
            {node.data.contextOperation?.type === 'detectTopic' && (
              <div className="form-group">
                <p>Topic detection operations are not yet implemented in the visual editor.</p>
              </div>
            )}
          </div>
        );
        
      case 'jump':
        return (
          <div className="properties-panel__jump">
            <div className="form-group">
              <label htmlFor="jump-target">Target Node</label>
              <select
                id="jump-target"
                value={node.data.targetNodeId || ''}
                onChange={(e) => handleDataChange('targetNodeId', e.target.value)}
              >
                <option value="">Select a target node</option>
                {nodes
                  .filter(n => n.id !== node.id) // Don't allow jumping to self
                  .map(n => (
                    <option key={n.id} value={n.id}>
                      {n.data.label || n.id}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        );
        
      case 'end':
        return (
          <div className="properties-panel__end">
            <p>This node marks the end of a workflow path.</p>
            <p>No further nodes will be processed after this node.</p>
          </div>
        );
        
      default:
        return (
          <div className="properties-panel__unknown">
            <p>Unknown node type: {node.type}</p>
          </div>
        );
    }
  };
  
  return (
    <div className="properties-panel">
      <div className="properties-panel__header">
        <h3>Node Properties: {node.data.label || node.type}</h3>
        <button 
          className="properties-panel__delete"
          onClick={() => onDelete(node.id)}
        >
          Delete Node
        </button>
      </div>
      
      <div className="properties-panel__content">
        {renderProperties()}
      </div>
    </div>
  );
};

export default PropertiesPanel;
