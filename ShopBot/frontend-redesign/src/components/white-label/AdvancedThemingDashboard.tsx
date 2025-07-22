/**
 * Advanced Theming Dashboard with Component-level Customization
 * Enterprise-grade theme builder with visual component editor
 * Part of Phase 3: Market Leadership - White-label Configuration
 */

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { 
  Paintbrush, Code, Eye, Save, Copy, Trash2, Plus, Settings,
  Layers, Box, Type, Palette, Zap, RefreshCw
} from 'lucide-react';

import WhiteLabelService from '../../services/WhiteLabelService';
import { ThemeConfiguration, BrandConfiguration } from '../../types/WhiteLabelTypes';

const AdvancedThemingDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('components');
  const [selectedBrand, setSelectedBrand] = useState<BrandConfiguration | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<ThemeConfiguration | null>(null);
  const [themes, setThemes] = useState<ThemeConfiguration[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<string>('button');
  const [selectedVariant, setSelectedVariant] = useState<string>('primary');
  const [customCSS, setCustomCSS] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const whiteLabelService = WhiteLabelService.getInstance();

  const componentPreviews = [
    { id: 'button', name: 'Button', variants: ['primary', 'secondary', 'outline', 'ghost', 'link'] },
    { id: 'input', name: 'Input Field', variants: ['default', 'filled', 'outline'] },
    { id: 'card', name: 'Card', variants: ['default', 'elevated', 'outlined', 'filled'] },
    { id: 'navigation', name: 'Navigation', variants: ['header', 'sidebar', 'footer', 'breadcrumb'] },
    { id: 'dashboard', name: 'Dashboard Widget', variants: ['widget', 'chart', 'table', 'metric'] }
  ];

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const brands = whiteLabelService.getAllBrands();
      if (brands.length > 0) {
        const firstBrand = brands[0];
        setSelectedBrand(firstBrand);
        const brandThemes = await whiteLabelService.listThemes(firstBrand.id);
        setThemes(brandThemes);
        if (brandThemes.length > 0) {
          setSelectedTheme(brandThemes[0]);
          setCustomCSS(brandThemes[0].customCSS || '');
        }
      }
    } catch (error) {
      console.error('Error loading themes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewTheme = async () => {
    if (!selectedBrand) return;
    try {
      const newTheme = await whiteLabelService.createTheme(selectedBrand.id, {
        name: `Theme ${themes.length + 1}`, type: 'light', baseTheme: 'modern'
      });
      setThemes([...themes, newTheme]);
      setSelectedTheme(newTheme);
      setCustomCSS('');
      setHasChanges(false);
    } catch (error) {
      console.error('Error creating theme:', error);
    }
  };

  const saveTheme = async () => {
    if (!selectedBrand || !selectedTheme) return;
    try {
      const updatedTheme = { ...selectedTheme, customCSS };
      await whiteLabelService.updateTheme(selectedBrand.id, selectedTheme.id, updatedTheme);
      setSelectedTheme(updatedTheme);
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const updateComponentVariant = (component: string, variant: string, property: string, value: any) => {
    if (!selectedTheme) return;
    const updatedComponents = {
      ...selectedTheme.components,
      [component]: {
        ...selectedTheme.components[component],
        variants: {
          ...selectedTheme.components[component]?.variants,
          [variant]: {
            ...selectedTheme.components[component]?.variants?.[variant],
            [property]: value
          }
        }
      }
    };
    const updatedTheme = { ...selectedTheme, components: updatedComponents };
    setSelectedTheme(updatedTheme);
    setHasChanges(true);
  };

  const getPreviewStyle = (component: string, variant: string): React.CSSProperties => {
    if (!selectedTheme?.components?.[component]?.variants?.[variant]) return {};
    const styles = selectedTheme.components[component].variants[variant];
    const reactStyles: React.CSSProperties = {};
    Object.entries(styles).forEach(([property, value]) => {
      if (property !== 'hover' && property !== 'active' && property !== 'focus' && typeof value === 'string') {
        (reactStyles as any)[property] = value;
      }
    });
    return reactStyles;
  };

  const currentVariantStyles = selectedTheme?.components?.[selectedComponent]?.variants?.[selectedVariant];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg">Loading themes...</span>
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      {/* Left Panel - Theme Controls */}
      <div className="w-1/2 border-r bg-white overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Paintbrush className="h-6 w-6 text-purple-600" />
                Advanced Theming
              </h1>
              <p className="text-gray-600 mt-1">Component-level customization</p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={createNewTheme} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New
              </Button>
              <Button onClick={saveTheme} disabled={!hasChanges} size="sm">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>

          {/* Theme Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Current Theme</label>
            <select
              value={selectedTheme?.id || ''}
              onChange={(e) => {
                const theme = themes.find(t => t.id === e.target.value);
                if (theme) {
                  setSelectedTheme(theme);
                  setCustomCSS(theme.customCSS || '');
                  setHasChanges(false);
                }
              }}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {themes.map(theme => (
                <option key={theme.id} value={theme.id}>
                  {theme.name} ({theme.type})
                </option>
              ))}
            </select>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="components">Components</TabsTrigger>
              <TabsTrigger value="layout">Layout</TabsTrigger>
              <TabsTrigger value="custom">Custom CSS</TabsTrigger>
            </TabsList>

            {/* Components Tab */}
            <TabsContent value="components" className="space-y-6 mt-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Box className="h-5 w-5" />
                  Component Styling
                </h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Component</label>
                  <select
                    value={selectedComponent}
                    onChange={(e) => {
                      setSelectedComponent(e.target.value);
                      const component = componentPreviews.find(c => c.id === e.target.value);
                      if (component && component.variants.length > 0) {
                        setSelectedVariant(component.variants[0]);
                      }
                    }}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {componentPreviews.map(component => (
                      <option key={component.id} value={component.id}>
                        {component.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Variant</label>
                  <select
                    value={selectedVariant}
                    onChange={(e) => setSelectedVariant(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {componentPreviews.find(c => c.id === selectedComponent)?.variants.map(variant => (
                      <option key={variant} value={variant}>
                        {variant.charAt(0).toUpperCase() + variant.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Style Properties */}
                {currentVariantStyles && (
                  <div className="space-y-4">
                    <h4 className="font-medium">Style Properties</h4>
                    
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Background Color</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={currentVariantStyles.backgroundColor || '#ffffff'}
                            onChange={(e) => updateComponentVariant(selectedComponent, selectedVariant, 'backgroundColor', e.target.value)}
                            className="w-12 h-8 rounded border"
                          />
                          <input
                            type="text"
                            value={currentVariantStyles.backgroundColor || ''}
                            onChange={(e) => updateComponentVariant(selectedComponent, selectedVariant, 'backgroundColor', e.target.value)}
                            className="flex-1 p-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            placeholder="#ffffff"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Text Color</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={currentVariantStyles.color || '#000000'}
                            onChange={(e) => updateComponentVariant(selectedComponent, selectedVariant, 'color', e.target.value)}
                            className="w-12 h-8 rounded border"
                          />
                          <input
                            type="text"
                            value={currentVariantStyles.color || ''}
                            onChange={(e) => updateComponentVariant(selectedComponent, selectedVariant, 'color', e.target.value)}
                            className="flex-1 p-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            placeholder="#000000"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Border Radius</label>
                        <input
                          type="text"
                          value={currentVariantStyles.borderRadius || ''}
                          onChange={(e) => updateComponentVariant(selectedComponent, selectedVariant, 'borderRadius', e.target.value)}
                          className="w-full p-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          placeholder="0.5rem"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Padding</label>
                        <input
                          type="text"
                          value={currentVariantStyles.padding || ''}
                          onChange={(e) => updateComponentVariant(selectedComponent, selectedVariant, 'padding', e.target.value)}
                          className="w-full p-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          placeholder="0.5rem 1rem"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Custom CSS Tab */}
            <TabsContent value="custom" className="space-y-6 mt-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Custom CSS
                </h3>
                
                <textarea
                  value={customCSS}
                  onChange={(e) => {
                    setCustomCSS(e.target.value);
                    setHasChanges(true);
                  }}
                  className="w-full h-64 p-3 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="/* Add your custom CSS here */"
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right Panel - Component Preview */}
      <div className="w-1/2 bg-gray-50">
        <div className="p-4 border-b bg-white">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Component Preview
          </h2>
        </div>

        <div className="p-6">
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-medium mb-4">
                {componentPreviews.find(c => c.id === selectedComponent)?.name} - {selectedVariant}
              </h3>
              
              {/* Live Preview */}
              <div className="mb-4 p-4 bg-gray-50 rounded border-2 border-dashed border-gray-300">
                {selectedComponent === 'button' && (
                  <button
                    style={getPreviewStyle(selectedComponent, selectedVariant)}
                    className="px-4 py-2 rounded transition-colors"
                  >
                    {selectedVariant.charAt(0).toUpperCase() + selectedVariant.slice(1)} Button
                  </button>
                )}
                
                {selectedComponent === 'input' && (
                  <input
                    type="text"
                    placeholder="Sample input text..."
                    style={getPreviewStyle(selectedComponent, selectedVariant)}
                    className="px-3 py-2 rounded border w-full"
                  />
                )}
                
                {selectedComponent === 'card' && (
                  <div
                    style={getPreviewStyle(selectedComponent, selectedVariant)}
                    className="p-4 rounded"
                  >
                    <h4 className="font-medium mb-2">Card Title</h4>
                    <p className="text-sm text-gray-600">Sample card content.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Theme Overview */}
            {selectedTheme && (
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="font-medium mb-3">Theme Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{selectedTheme.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium capitalize">{selectedTheme.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base Theme:</span>
                    <span className="font-medium capitalize">{selectedTheme.baseTheme}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedThemingDashboard;
