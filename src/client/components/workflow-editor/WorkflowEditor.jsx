import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import axios from 'axios';

// Import custom node types
import StartNode from './nodes/StartNode';
import MessageNode from './nodes/MessageNode';
import ConditionNode from './nodes/ConditionNode';
import InputNode from './nodes/InputNode';
import ActionNode from './nodes/ActionNode';
import IntegrationNode from './nodes/IntegrationNode';
import ContextNode from './nodes/ContextNode';
import JumpNode from './nodes/JumpNode';
import EndNode from './nodes/EndNode';

// Import sidebar and toolbar components
import NodePalette from './NodePalette';
import Toolbar from './Toolbar';
import PropertiesPanel from './PropertiesPanel';

// Configure axios with proxy as specified in user requirements
axios.defaults.proxy = {
  host: '104.129.196.38',
  port: 10563
};

// Node types mapping
const nodeTypes = {
  start: StartNode,
  message: MessageNode,
  condition: ConditionNode,
  input: InputNode,
  action: ActionNode,
  integration: IntegrationNode,
  context: ContextNode,
  jump: JumpNode,
  end: EndNode
};

const WorkflowEditor = ({ chatbotId, workflowId, onSave, onCancel }) => {
  // State for nodes and edges
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // State for workflow metadata
  const [workflow, setWorkflow] = useState({
    name: '',
    description: '',
    isActive: false,
    tags: []
  });
  
  // State for selected node (for properties panel)
  const [selectedNode, setSelectedNode] = useState(null);
  
  // State for loading and saving
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  // Reference to the ReactFlow instance
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  
  // Load workflow data if workflowId is provided
  useEffect(() => {
    if (workflowId) {
      loadWorkflow();
    } else {
      // Create a new workflow with a start node
      const startNode = {
        id: 'start-1',
        type: 'start',
        position: { x: 250, y: 100 },
        data: { label: 'Start' }
      };
      
      setNodes([startNode]);
    }
  }, [workflowId]);
  
  // Load workflow from API
  const loadWorkflow = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`/api/chatbots/${chatbotId}/workflows/${workflowId}`);
      
      if (response.data.success) {
        const workflowData = response.data.data;
        
        // Set workflow metadata
        setWorkflow({
          name: workflowData.name,
          description: workflowData.description,
          isActive: workflowData.isActive,
          tags: workflowData.tags || []
        });
        
        // Convert nodes and connections to ReactFlow format
        const flowNodes = workflowData.nodes.map(node => ({
          id: node.nodeId,
          type: node.type,
          position: node.position,
          data: { ...node.data, label: getNodeLabel(node) }
        }));
        
        const flowEdges = workflowData.connections.map(conn => ({
          id: conn.id,
          source: conn.sourceId,
          target: conn.targetId,
          label: conn.label || '',
          data: { condition: conn.condition }
        }));
        
        setNodes(flowNodes);
        setEdges(flowEdges);
      } else {
        setError('Failed to load workflow');
      }
    } catch (err) {
      setError(`Error loading workflow: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Get label for node based on type and data
  const getNodeLabel = (node) => {
    switch (node.type) {
      case 'start':
        return 'Start';
      case 'message':
        return `Message: ${node.data.message?.substring(0, 20)}${node.data.message?.length > 20 ? '...' : ''}`;
      case 'condition':
        return `Condition: ${node.data.condition?.field || 'Unknown'}`;
      case 'input':
        return `Input: ${node.data.prompt?.substring(0, 20)}${node.data.prompt?.length > 20 ? '...' : ''}`;
      case 'action':
        return `Action: ${node.data.action?.type || 'Unknown'}`;
      case 'integration':
        return `Integration: ${node.data.integration?.type || 'Unknown'}`;
      case 'context':
        return `Context: ${node.data.contextOperation?.type || 'Unknown'}`;
      case 'jump':
        return `Jump to: ${node.data.targetNodeId || 'Unknown'}`;
      case 'end':
        return 'End';
      default:
        return node.type;
    }
  };
  
  // Handle node selection
  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);
  
  // Handle node deselection
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);
  
  // Handle connecting nodes
  const onConnect = useCallback((params) => {
    // Create a unique ID for the edge
    const edgeId = `edge-${params.source}-${params.target}`;
    
    setEdges((eds) => addEdge({ 
      ...params, 
      id: edgeId,
      data: { condition: null }
    }, eds));
  }, [setEdges]);
  
  // Handle drag over for node palette items
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);
  
  // Handle dropping node from palette
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');
      
      // Check if the dropped element is valid
      if (typeof type === 'undefined' || !type) {
        return;
      }
      
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      
      // Create a unique ID for the new node
      const newNodeId = `${type}-${Date.now()}`;
      
      // Create default data based on node type
      let nodeData = { label: type };
      
      switch (type) {
        case 'message':
          nodeData = { ...nodeData, message: 'Enter your message here', messageType: 'text' };
          break;
        case 'condition':
          nodeData = { ...nodeData, condition: { field: '', operator: 'equals', value: '' } };
          break;
        case 'input':
          nodeData = { ...nodeData, prompt: 'Enter your question here', inputType: 'text', options: [] };
          break;
        case 'action':
          nodeData = { ...nodeData, action: { type: 'setVariable', variable: '', value: '' } };
          break;
        case 'integration':
          nodeData = { ...nodeData, integration: { type: 'http', url: '', method: 'GET' } };
          break;
        case 'context':
          nodeData = { ...nodeData, contextOperation: { type: 'setPreference', category: '', key: '', value: '' } };
          break;
        case 'jump':
          nodeData = { ...nodeData, targetNodeId: '' };
          break;
        default:
          break;
      }
      
      const newNode = {
        id: newNodeId,
        type,
        position,
        data: nodeData,
      };
      
      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );
  
  // Handle updating node data from properties panel
  const handleNodeDataUpdate = (nodeId, newData) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          // Update the node data
          const updatedData = { ...node.data, ...newData };
          
          // Update the node label based on the new data
          updatedData.label = getNodeLabel({ type: node.type, data: updatedData });
          
          return { ...node, data: updatedData };
        }
        return node;
      })
    );
  };
  
  // Handle updating edge data (e.g., conditions)
  const handleEdgeDataUpdate = (edgeId, newData) => {
    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.id === edgeId) {
          return { ...edge, label: newData.label || '', data: { ...edge.data, ...newData } };
        }
        return edge;
      })
    );
  };
  
  // Handle updating workflow metadata
  const handleWorkflowUpdate = (field, value) => {
    setWorkflow((prev) => ({ ...prev, [field]: value }));
  };
  
  // Handle saving the workflow
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Validate workflow
      if (!workflow.name) {
        setError('Workflow name is required');
        setSaving(false);
        return;
      }
      
      // Check if we have a start node
      const hasStartNode = nodes.some(node => node.type === 'start');
      if (!hasStartNode) {
        setError('Workflow must have a start node');
        setSaving(false);
        return;
      }
      
      // Convert ReactFlow nodes and edges to workflow format
      const workflowNodes = nodes.map(node => ({
        nodeId: node.id,
        type: node.type,
        position: node.position,
        data: { ...node.data }
      }));
      
      const workflowConnections = edges.map(edge => ({
        id: edge.id,
        sourceId: edge.source,
        targetId: edge.target,
        label: edge.label,
        condition: edge.data?.condition
      }));
      
      // Create the workflow data object
      const workflowData = {
        ...workflow,
        nodes: workflowNodes,
        connections: workflowConnections,
        chatbotId
      };
      
      let response;
      
      if (workflowId) {
        // Update existing workflow
        response = await axios.put(`/api/chatbots/${chatbotId}/workflows/${workflowId}`, workflowData);
      } else {
        // Create new workflow
        response = await axios.post(`/api/chatbots/${chatbotId}/workflows`, workflowData);
      }
      
      if (response.data.success) {
        if (onSave) {
          onSave(response.data.data);
        }
      } else {
        setError('Failed to save workflow');
      }
    } catch (err) {
      setError(`Error saving workflow: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };
  
  // Handle deleting a node
  const handleDeleteNode = (nodeId) => {
    // Remove all connected edges
    setEdges((eds) => eds.filter(edge => edge.source !== nodeId && edge.target !== nodeId));
    
    // Remove the node
    setNodes((nds) => nds.filter(node => node.id !== nodeId));
    
    // Clear selected node if it was the deleted node
    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode(null);
    }
  };
  
  // Handle deleting an edge
  const handleDeleteEdge = (edgeId) => {
    setEdges((eds) => eds.filter(edge => edge.id !== edgeId));
  };
  
  return (
    <div className="workflow-editor">
      <div className="workflow-editor__header">
        <h2>{workflowId ? 'Edit Workflow' : 'Create Workflow'}</h2>
        <div className="workflow-editor__metadata">
          <div className="form-group">
            <label htmlFor="workflow-name">Name</label>
            <input
              id="workflow-name"
              type="text"
              value={workflow.name}
              onChange={(e) => handleWorkflowUpdate('name', e.target.value)}
              placeholder="Enter workflow name"
            />
          </div>
          <div className="form-group">
            <label htmlFor="workflow-description">Description</label>
            <textarea
              id="workflow-description"
              value={workflow.description}
              onChange={(e) => handleWorkflowUpdate('description', e.target.value)}
              placeholder="Enter workflow description"
            />
          </div>
          <div className="form-group">
            <label htmlFor="workflow-active">
              <input
                id="workflow-active"
                type="checkbox"
                checked={workflow.isActive}
                onChange={(e) => handleWorkflowUpdate('isActive', e.target.checked)}
              />
              Active
            </label>
          </div>
        </div>
      </div>
      
      <div className="workflow-editor__content">
        <div className="workflow-editor__sidebar">
          <NodePalette />
        </div>
        
        <div className="workflow-editor__canvas" ref={reactFlowWrapper}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              nodeTypes={nodeTypes}
              fitView
            >
              <Controls />
              <Background color="#aaa" gap={16} />
              <Panel position="top-right">
                <Toolbar
                  onSave={handleSave}
                  onCancel={onCancel}
                  saving={saving}
                />
              </Panel>
            </ReactFlow>
          </ReactFlowProvider>
        </div>
        
        {selectedNode && (
          <div className="workflow-editor__properties">
            <PropertiesPanel
              node={selectedNode}
              nodes={nodes}
              onUpdate={handleNodeDataUpdate}
              onDelete={handleDeleteNode}
            />
          </div>
        )}
      </div>
      
      {error && (
        <div className="workflow-editor__error">
          {error}
        </div>
      )}
    </div>
  );
};

export default WorkflowEditor;
