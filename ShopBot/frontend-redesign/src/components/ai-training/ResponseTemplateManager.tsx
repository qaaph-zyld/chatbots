/**
 * Response Template Manager Component
 * Advanced template management system with real-time editing and testing
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  Copy,
  Play,
  Save,
  X,
  Filter,
  Tag,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAITraining } from '@/contexts/AITrainingContext';
import {
  ResponseTemplate,
  TemplateCategory,
  TemplateVariable,
  ValidationRule
} from '@/types/AITrainingTypes';

interface ResponseTemplateManagerProps {
  className?: string;
}

export default function ResponseTemplateManager({ className = '' }: ResponseTemplateManagerProps) {
  const { state, actions } = useAITraining();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ResponseTemplate | null>(null);
  const [testingTemplate, setTestingTemplate] = useState<string | null>(null);
  const [testVariables, setTestVariables] = useState<Record<string, any>>({});
  const [testResult, setTestResult] = useState<string>('');

  // Filter templates based on search and category
  const filteredTemplates = useMemo(() => {
    return state.templates.filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          template.template.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [state.templates, searchTerm, selectedCategory]);

  // Handle template creation
  const handleCreateTemplate = useCallback(async (templateData: Omit<ResponseTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    await actions.createTemplate(templateData);
    setIsCreating(false);
  }, [actions]);

  // Handle template testing
  const handleTestTemplate = useCallback(async (templateId: string) => {
    try {
      const result = await actions.testTemplate(templateId, testVariables);
      setTestResult(result);
    } catch (error) {
      setTestResult('Error: ' + (error as Error).message);
    }
  }, [actions, testVariables]);

  // Template form component
  const TemplateForm = ({ template, onSave, onCancel }: {
    template?: ResponseTemplate;
    onSave: (data: Omit<ResponseTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
    onCancel: () => void;
  }) => {
    const [formData, setFormData] = useState({
      name: template?.name || '',
      category: template?.category || 'custom' as const,
      template: template?.template || '',
      variables: template?.variables || [] as TemplateVariable[],
      isActive: template?.isActive ?? true,
      tags: template?.tags || []
    });

    const [newTag, setNewTag] = useState('');

    const addVariable = () => {
      setFormData(prev => ({
        ...prev,
        variables: [...prev.variables, {
          name: '',
          type: 'string',
          description: '',
          required: false
        }]
      }));
    };

    const updateVariable = (index: number, updates: Partial<TemplateVariable>) => {
      setFormData(prev => ({
        ...prev,
        variables: prev.variables.map((variable, i) => 
          i === index ? { ...variable, ...updates } : variable
        )
      }));
    };

    const removeVariable = (index: number) => {
      setFormData(prev => ({
        ...prev,
        variables: prev.variables.filter((_, i) => i !== index)
      }));
    };

    const addTag = () => {
      if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, newTag.trim()]
        }));
        setNewTag('');
      }
    };

    const removeTag = (tagToRemove: string) => {
      setFormData(prev => ({
        ...prev,
        tags: prev.tags.filter(tag => tag !== tagToRemove)
      }));
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-white rounded-xl shadow-lg p-6 space-y-6"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">
            {template ? 'Edit Template' : 'Create New Template'}
          </h3>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <label htmlFor="template-name" className="block text-sm font-medium text-gray-700 mb-2">
                Template Name
              </label>
              <input
                id="template-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter template name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {state.categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Active Template
              </label>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add tag"
                />
                <button
                  onClick={addTag}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Tag className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Template Content */}
        <div>
          <label htmlFor="template-content" className="block text-sm font-medium text-gray-700 mb-2">
            Template Content
          </label>
          <textarea
            id="template-content"
            value={formData.template}
            onChange={(e) => setFormData(prev => ({ ...prev, template: e.target.value }))}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter template content. Use {{variable_name}} for variables."
          />
          <p className="mt-1 text-sm text-gray-500">
            Use double curly braces for variables: {`{{customer_name}}, {{product_name}}, etc.`}
          </p>
        </div>

        {/* Variables */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Template Variables
            </label>
            <button
              onClick={addVariable}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Variable
            </button>
          </div>

          <div className="space-y-3">
            {formData.variables.map((variable, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <input
                  type="text"
                  value={variable.name}
                  onChange={(e) => updateVariable(index, { name: e.target.value })}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="Variable name"
                />
                <select
                  value={variable.type}
                  onChange={(e) => updateVariable(index, { type: e.target.value as any })}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                  <option value="array">Array</option>
                  <option value="object">Object</option>
                </select>
                <input
                  type="text"
                  value={variable.description}
                  onChange={(e) => updateVariable(index, { description: e.target.value })}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="Description"
                />
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={variable.required}
                    onChange={(e) => updateVariable(index, { required: e.target.checked })}
                    className="mr-1"
                  />
                  Required
                </label>
                <button
                  onClick={() => removeVariable(index)}
                  className="p-1 text-red-600 hover:text-red-800 transition-colors"
                  title="Delete Template"
                  aria-label="Delete Template Variable"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(formData)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save className="w-4 h-4 inline mr-2" />
            Save Template
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Response Templates</h2>
          <p className="text-gray-600">Manage and optimize your AI response templates</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Template
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Search templates..."
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Categories</option>
          {state.categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.icon} {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Template Creation/Edit Form */}
      <AnimatePresence>
        {isCreating && (
          <TemplateForm
            onSave={handleCreateTemplate}
            onCancel={() => setIsCreating(false)}
          />
        )}
        {editingTemplate && (
          <TemplateForm
            template={editingTemplate}
            onSave={async (data) => {
              await actions.updateTemplate(editingTemplate.id, data);
              setEditingTemplate(null);
            }}
            onCancel={() => setEditingTemplate(null)}
          />
        )}
      </AnimatePresence>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredTemplates.map(template => (
            <motion.div
              key={template.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-xl shadow-lg p-6 space-y-4"
            >
              {/* Template Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">
                      {state.categories.find(c => c.id === template.category)?.icon}
                    </span>
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    {template.isActive ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {state.categories.find(c => c.id === template.category)?.name}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setTestingTemplate(template.id)}
                    className="p-1 text-green-600 hover:text-green-800 transition-colors"
                    title="Test Template"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingTemplate(template)}
                    className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                    title="Edit Template"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => actions.duplicateTemplate(template.id, `${template.name} (Copy)`)}
                    className="p-1 text-purple-600 hover:text-purple-800 transition-colors"
                    title="Duplicate Template"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => actions.deleteTemplate(template.id)}
                    className="p-1 text-red-600 hover:text-red-800 transition-colors"
                    title="Delete Template"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Template Preview */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700 line-clamp-3">
                  {template.template}
                </p>
              </div>

              {/* Tags */}
              {template.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {template.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    <span>{template.effectiveness_score.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{template.usage_count} uses</span>
                  </div>
                </div>
                <span>{new Date(template.updatedAt).toLocaleDateString()}</span>
              </div>

              {/* Test Panel */}
              <AnimatePresence>
                {testingTemplate === template.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t pt-4 space-y-3"
                  >
                    <h4 className="font-medium text-gray-900">Test Template</h4>
                    {template.variables.map(variable => (
                      <div key={variable.name}>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          {variable.name} {variable.required && '*'}
                        </label>
                        <input
                          type={variable.type === 'number' ? 'number' : 'text'}
                          value={testVariables[variable.name] || ''}
                          onChange={(e) => setTestVariables(prev => ({
                            ...prev,
                            [variable.name]: e.target.value
                          }))}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder={variable.description}
                        />
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleTestTemplate(template.id)}
                        className="flex-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                      >
                        Test
                      </button>
                      <button
                        onClick={() => setTestingTemplate(null)}
                        className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                    {testResult && (
                      <div className="p-2 bg-gray-100 rounded text-sm">
                        <strong>Result:</strong> {testResult}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedCategory !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'Create your first response template to get started'
            }
          </p>
          {!searchTerm && selectedCategory === 'all' && (
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Template
            </button>
          )}
        </div>
      )}

      {/* Loading State */}
      {state.loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
}
