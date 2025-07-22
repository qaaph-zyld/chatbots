/**
 * Training Data Curator Component
 * Advanced training data management with quality assessment and validation
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Download,
  Search,
  Filter,
  Plus,
  Edit3,
  Trash2,
  CheckCircle,
  XCircle,
  Star,
  AlertTriangle,
  FileText,
  BarChart3,
  Calendar,
  User,
  MessageSquare,
  Target,
  TrendingUp,
  Eye,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { useAITraining } from '@/contexts/AITrainingContext';
import {
  TrainingDataEntry,
  TrainingFeedback,
  TrainingDataFilters
} from '@/types/AITrainingTypes';

interface TrainingDataCuratorProps {
  className?: string;
}

export default function TrainingDataCurator({ className = '' }: TrainingDataCuratorProps) {
  const { state, actions } = useAITraining();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<TrainingDataFilters>({});
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TrainingDataEntry | null>(null);
  const [validatingEntry, setValidatingEntry] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter and search training data
  const filteredData = useMemo(() => {
    return state.training_data.filter(entry => {
      const matchesSearch = !searchTerm || 
        entry.input.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.expected_output.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = !filters.category || entry.category === filters.category;
      const matchesQuality = !filters.quality_score_min || entry.quality_score >= filters.quality_score_min;
      const matchesValidation = filters.validated === undefined || entry.validated === filters.validated;

      return matchesSearch && matchesCategory && matchesQuality && matchesValidation;
    });
  }, [state.training_data, searchTerm, filters]);

  // Statistics
  const stats = useMemo(() => {
    const total = state.training_data.length;
    const validated = state.training_data.filter(d => d.validated).length;
    const avgQuality = total > 0 
      ? state.training_data.reduce((sum, d) => sum + d.quality_score, 0) / total 
      : 0;
    const categories = [...new Set(state.training_data.map(d => d.category))];

    return { total, validated, avgQuality, categories: categories.length };
  }, [state.training_data]);

  // Handle bulk validation
  const handleBulkValidation = useCallback(async (validated: boolean) => {
    for (const entryId of selectedEntries) {
      const feedback: TrainingFeedback = {
        rating: validated ? 4 : 2,
        comments: validated ? 'Bulk validated' : 'Bulk rejected',
        improvements: [],
        reviewer: 'System',
        reviewed_at: new Date()
      };
      await actions.validateTrainingData(entryId, feedback);
    }
    setSelectedEntries(new Set());
  }, [selectedEntries, actions]);

  // Handle file import
  const handleFileImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split('\n').slice(1);
      const importData: TrainingDataEntry[] = [];

      lines.forEach((line, index) => {
        const [input, expectedOutput, category] = line.split(',').map(s => s.trim().replace(/"/g, ''));
        if (input && expectedOutput && category) {
          importData.push({
            id: `import_${Date.now()}_${index}`,
            input,
            expected_output: expectedOutput,
            category,
            quality_score: 3,
            validated: false,
            created_by: 'Import',
            created_at: new Date()
          });
        }
      });

      if (importData.length > 0) {
        await actions.bulkImportTrainingData(importData);
      }
    } catch (error) {
      console.error('Failed to import training data:', error);
    }
  }, [actions]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Training Data Curator</h2>
          <p className="text-gray-600">Manage and validate AI training datasets</p>
        </div>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-xs text-blue-600">Total</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-green-600">{stats.validated}</div>
            <div className="text-xs text-green-600">Validated</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-yellow-600">{stats.avgQuality.toFixed(1)}</div>
            <div className="text-xs text-yellow-600">Avg Quality</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-purple-600">{stats.categories}</div>
            <div className="text-xs text-purple-600">Categories</div>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Search training data..."
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors ${
              showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        <div className="flex items-center gap-2">
          {selectedEntries.size > 0 && (
            <>
              <button
                onClick={() => handleBulkValidation(true)}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <ThumbsUp className="w-4 h-4" />
                Validate ({selectedEntries.size})
              </button>
              <button
                onClick={() => handleBulkValidation(false)}
                className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <ThumbsDown className="w-4 h-4" />
                Reject ({selectedEntries.size})
              </button>
            </>
          )}
          
          <label className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            Import CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleFileImport}
              className="hidden"
            />
          </label>
          
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Entry
          </button>
        </div>
      </div>

      {/* Training Data Grid */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedEntries.size === filteredData.length && filteredData.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedEntries(new Set(filteredData.map(d => d.id)));
                      } else {
                        setSelectedEntries(new Set());
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Input/Output
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Quality
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <AnimatePresence>
                {filteredData.map(entry => (
                  <motion.tr
                    key={entry.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedEntries.has(entry.id)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedEntries);
                          if (e.target.checked) {
                            newSelected.add(entry.id);
                          } else {
                            newSelected.delete(entry.id);
                          }
                          setSelectedEntries(newSelected);
                        }}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-2">
                        <div>
                          <div className="text-xs font-medium text-gray-500 mb-1">Input:</div>
                          <div className="text-sm text-gray-900 line-clamp-2">{entry.input}</div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-500 mb-1">Expected:</div>
                          <div className="text-sm text-gray-700 line-clamp-2">{entry.expected_output}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {entry.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < entry.quality_score ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-sm text-gray-600">({entry.quality_score})</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {entry.validated ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Validated
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setValidatingEntry(entry.id)}
                          className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                          title="Validate"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingEntry(entry)}
                          className="p-1 text-green-600 hover:text-green-800 transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => console.log('Delete entry:', entry.id)}
                          className="p-1 text-red-600 hover:text-red-800 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredData.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <FileText className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No training data found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || Object.keys(filters).length > 0
              ? 'Try adjusting your search or filter criteria'
              : 'Add your first training data entry to get started'
            }
          </p>
          {!searchTerm && Object.keys(filters).length === 0 && (
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Training Data
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
