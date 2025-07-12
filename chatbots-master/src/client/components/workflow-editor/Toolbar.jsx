import React from 'react';

/**
 * Toolbar Component
 * 
 * Provides actions for the workflow editor
 */
const Toolbar = ({ onSave, onCancel, onTest, saving = false, testing = false }) => {
  return (
    <div className="workflow-editor-toolbar">
      <button 
        className="workflow-editor-toolbar__button workflow-editor-toolbar__button--save"
        onClick={onSave}
        disabled={saving}
      >
        {saving ? 'Saving...' : 'Save Workflow'}
      </button>
      
      {onTest && (
        <button 
          className="workflow-editor-toolbar__button workflow-editor-toolbar__button--test"
          onClick={onTest}
          disabled={testing || saving}
        >
          {testing ? 'Testing...' : 'Test Workflow'}
        </button>
      )}
      
      <button 
        className="workflow-editor-toolbar__button workflow-editor-toolbar__button--cancel"
        onClick={onCancel}
        disabled={saving}
      >
        Cancel
      </button>
    </div>
  );
};

export default Toolbar;
