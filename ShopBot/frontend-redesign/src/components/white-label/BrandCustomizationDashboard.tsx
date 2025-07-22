/**
 * Brand Customization Dashboard with Real-time Preview
 * Enterprise-grade white-label customization interface
 * Part of Phase 3: Market Leadership - White-label Configuration
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { 
  Palette, 
  Type, 
  Layout, 
  Eye, 
  Download, 
  Upload, 
  Save, 
  RefreshCw,
  Monitor,
  Tablet,
  Smartphone,
  Settings,
  Image,
  Code,
  Globe,
  Zap
} from 'lucide-react';

import WhiteLabelService from '../../services/WhiteLabelService';
import { BrandConfiguration, PreviewResult } from '../../types/WhiteLabelTypes';

const BrandCustomizationDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('branding');
  const [selectedBrand, setSelectedBrand] = useState<BrandConfiguration | null>(null);
  const [brands, setBrands] = useState<BrandConfiguration[]>([]);
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null);
  const [previewDevice, setPreviewDevice] = useState('desktop');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const whiteLabelService = WhiteLabelService.getInstance();

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    setIsLoading(true);
    try {
      const allBrands = whiteLabelService.getAllBrands();
      setBrands(allBrands);
      if (allBrands.length > 0 && !selectedBrand) {
        const firstBrand = allBrands[0];
        setSelectedBrand(firstBrand);
        if (firstBrand) {
          generatePreview(firstBrand.id);
        }
      }
    } catch (error) {
      console.error('Error loading brands:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generatePreview = useCallback(async (brandId: string, device: string = previewDevice) => {
    try {
      const result = await whiteLabelService.generatePreview(brandId, { device });
      setPreviewResult(result);
    } catch (error) {
      console.error('Error generating preview:', error);
    }
  }, [previewDevice]);

  const handleBrandChange = (brand: BrandConfiguration) => {
    setSelectedBrand(brand);
    generatePreview(brand.id);
    setHasChanges(false);
  };

  const handleBrandingUpdate = (field: string, value: any) => {
    if (!selectedBrand) return;
    
    const updatedBrand = {
      ...selectedBrand,
      branding: {
        ...selectedBrand.branding,
        [field]: value
      }
    };
    
    setSelectedBrand(updatedBrand);
    setHasChanges(true);
    
    // Real-time preview update
    generatePreview(updatedBrand.id);
  };

  const handleColorUpdate = (colorKey: string, value: string) => {
    if (!selectedBrand) return;
    
    const updatedBrand = {
      ...selectedBrand,
      branding: {
        ...selectedBrand.branding,
        colors: {
          ...selectedBrand.branding.colors,
          [colorKey]: value
        }
      }
    };
    
    setSelectedBrand(updatedBrand);
    setHasChanges(true);
    generatePreview(updatedBrand.id);
  };

  const handleTypographyUpdate = (category: string, field: string, value: any) => {
    if (!selectedBrand) return;
    
    const updatedBrand = {
      ...selectedBrand,
      branding: {
        ...selectedBrand.branding,
        typography: {
          ...selectedBrand.branding.typography,
          [category]: {
            ...selectedBrand.branding.typography[category as keyof typeof selectedBrand.branding.typography],
            [field]: value
          }
        }
      }
    };
    
    setSelectedBrand(updatedBrand);
    setHasChanges(true);
    generatePreview(updatedBrand.id);
  };

  const saveBrand = async () => {
    if (!selectedBrand) return;
    
    setIsSaving(true);
    try {
      await whiteLabelService.updateBrand(selectedBrand.id, selectedBrand);
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving brand:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const createNewBrand = async () => {
    try {
      const newBrand = await whiteLabelService.createBrand({
        name: `Brand ${brands.length + 1}`,
        slug: `brand-${Date.now()}`
      });
      setBrands([...brands, newBrand]);
      setSelectedBrand(newBrand);
      generatePreview(newBrand.id);
    } catch (error) {
      console.error('Error creating brand:', error);
    }
  };

  const exportBrand = async () => {
    if (!selectedBrand) return;
    
    try {
      const exportData = await whiteLabelService.exportBrand(selectedBrand.id);
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedBrand.slug}-export.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting brand:', error);
    }
  };

  const formatColor = (color: string) => color.toUpperCase();
  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg">Loading brands...</span>
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      {/* Left Panel - Customization Controls */}
      <div className="w-1/2 border-r bg-white overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Palette className="h-6 w-6 text-purple-600" />
                Brand Customization
              </h1>
              <p className="text-gray-600 mt-1">Real-time white-label configuration</p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={createNewBrand} variant="outline" size="sm">
                <Zap className="h-4 w-4 mr-2" />
                New Brand
              </Button>
              <Button 
                onClick={saveBrand} 
                disabled={!hasChanges || isSaving}
                size="sm"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>

          {/* Brand Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Select Brand</label>
            <select
              value={selectedBrand?.id || ''}
              onChange={(e) => {
                const brand = brands.find(b => b.id === e.target.value);
                if (brand) handleBrandChange(brand);
              }}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {brands.map(brand => (
                <option key={brand.id} value={brand.id}>
                  {brand.name} ({brand.slug})
                </option>
              ))}
            </select>
          </div>

          {selectedBrand && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="branding">Branding</TabsTrigger>
                <TabsTrigger value="colors">Colors</TabsTrigger>
                <TabsTrigger value="typography">Typography</TabsTrigger>
                <TabsTrigger value="layout">Layout</TabsTrigger>
              </TabsList>

              {/* Branding Tab */}
              <TabsContent value="branding" className="space-y-6 mt-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Image className="h-5 w-5" />
                    Logo & Identity
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Brand Name</label>
                      <input
                        type="text"
                        value={selectedBrand.name}
                        onChange={(e) => {
                          const updated = { ...selectedBrand, name: e.target.value };
                          setSelectedBrand(updated);
                          setHasChanges(true);
                        }}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Brand Slug</label>
                      <input
                        type="text"
                        value={selectedBrand.slug}
                        onChange={(e) => {
                          const updated = { ...selectedBrand, slug: e.target.value };
                          setSelectedBrand(updated);
                          setHasChanges(true);
                        }}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Primary Logo URL</label>
                      <input
                        type="text"
                        value={selectedBrand.branding.logo.primary}
                        onChange={(e) => handleBrandingUpdate('logo', {
                          ...selectedBrand.branding.logo,
                          primary: e.target.value
                        })}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="https://example.com/logo.svg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Favicon URL</label>
                      <input
                        type="text"
                        value={selectedBrand.branding.logo.favicon}
                        onChange={(e) => handleBrandingUpdate('logo', {
                          ...selectedBrand.branding.logo,
                          favicon: e.target.value
                        })}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="https://example.com/favicon.ico"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Colors Tab */}
              <TabsContent value="colors" className="space-y-6 mt-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Color Palette
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(selectedBrand.branding.colors).map(([key, value]) => {
                      if (typeof value === 'object') {
                        return (
                          <div key={key} className="space-y-2">
                            <label className="block text-sm font-medium capitalize">{key} Colors</label>
                            {Object.entries(value).map(([subKey, subValue]) => (
                              <div key={`${key}-${subKey}`} className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={subValue as string}
                                  onChange={(e) => {
                                    const updatedColors = {
                                      ...selectedBrand.branding.colors,
                                      [key]: {
                                        ...selectedBrand.branding.colors[key as keyof typeof selectedBrand.branding.colors],
                                        [subKey]: e.target.value
                                      }
                                    };
                                    handleBrandingUpdate('colors', updatedColors);
                                  }}
                                  className="w-8 h-8 rounded border"
                                />
                                <span className="text-sm capitalize">{subKey}</span>
                                <span className="text-xs text-gray-500 ml-auto">
                                  {formatColor(subValue as string)}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      
                      return (
                        <div key={key} className="flex items-center gap-2">
                          <input
                            type="color"
                            value={value as string}
                            onChange={(e) => handleColorUpdate(key, e.target.value)}
                            className="w-8 h-8 rounded border"
                          />
                          <label className="text-sm font-medium capitalize">{key}</label>
                          <span className="text-xs text-gray-500 ml-auto">
                            {formatColor(value as string)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>

              {/* Typography Tab */}
              <TabsContent value="typography" className="space-y-6 mt-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Type className="h-5 w-5" />
                    Typography System
                  </h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Primary Font Family</label>
                      <input
                        type="text"
                        value={selectedBrand.branding.typography.fontFamily.primary}
                        onChange={(e) => handleTypographyUpdate('fontFamily', 'primary', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Inter, system-ui, sans-serif"
                      />
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Font Sizes</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(selectedBrand.branding.typography.fontSizes).map(([size, value]) => (
                          <div key={size} className="flex items-center gap-2">
                            <label className="text-sm w-12">{size}:</label>
                            <input
                              type="text"
                              value={value}
                              onChange={(e) => handleTypographyUpdate('fontSizes', size, e.target.value)}
                              className="flex-1 p-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Font Weights</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(selectedBrand.branding.typography.fontWeights).map(([weight, value]) => (
                          <div key={weight} className="flex items-center gap-2">
                            <label className="text-sm w-16 capitalize">{weight}:</label>
                            <input
                              type="number"
                              value={value}
                              onChange={(e) => handleTypographyUpdate('fontWeights', weight, parseInt(e.target.value))}
                              className="flex-1 p-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              min="100"
                              max="900"
                              step="100"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Layout Tab */}
              <TabsContent value="layout" className="space-y-6 mt-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Layout className="h-5 w-5" />
                    Layout Configuration
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-3">Border Radius</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(selectedBrand.branding.borderRadius).map(([size, value]) => (
                          <div key={size} className="flex items-center gap-2">
                            <label className="text-sm w-12 capitalize">{size}:</label>
                            <input
                              type="text"
                              value={value}
                              onChange={(e) => {
                                const updatedRadius = {
                                  ...selectedBrand.branding.borderRadius,
                                  [size]: e.target.value
                                };
                                handleBrandingUpdate('borderRadius', updatedRadius);
                              }}
                              className="flex-1 p-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Spacing Scale</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedBrand.branding.spacing.scale.map((value, index) => (
                          <div key={index} className="flex items-center gap-1">
                            <input
                              type="number"
                              value={value}
                              onChange={(e) => {
                                const newScale = [...selectedBrand.branding.spacing.scale];
                                newScale[index] = parseInt(e.target.value);
                                handleBrandingUpdate('spacing', {
                                  ...selectedBrand.branding.spacing,
                                  scale: newScale
                                });
                              }}
                              className="w-12 p-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              min="0"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}

          {/* Export/Import Actions */}
          <div className="mt-8 pt-6 border-t">
            <div className="flex gap-2">
              <Button onClick={exportBrand} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Real-time Preview */}
      <div className="w-1/2 bg-gray-50">
        <div className="p-4 border-b bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Live Preview
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant={previewDevice === 'desktop' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setPreviewDevice('desktop');
                  if (selectedBrand) generatePreview(selectedBrand.id, 'desktop');
                }}
              >
                <Monitor className="h-4 w-4" />
              </Button>
              <Button
                variant={previewDevice === 'tablet' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setPreviewDevice('tablet');
                  if (selectedBrand) generatePreview(selectedBrand.id, 'tablet');
                }}
              >
                <Tablet className="h-4 w-4" />
              </Button>
              <Button
                variant={previewDevice === 'mobile' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setPreviewDevice('mobile');
                  if (selectedBrand) generatePreview(selectedBrand.id, 'mobile');
                }}
              >
                <Smartphone className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => selectedBrand && generatePreview(selectedBrand.id)}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="p-4 h-full overflow-auto">
          {previewResult ? (
            <div className="space-y-4">
              {/* Preview Frame */}
              <div 
                className={`mx-auto bg-white rounded-lg shadow-lg overflow-hidden ${
                  previewDevice === 'mobile' ? 'max-w-sm' :
                  previewDevice === 'tablet' ? 'max-w-2xl' :
                  'max-w-full'
                }`}
              >
                <div className="aspect-video bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                      <Globe className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2" style={{ color: selectedBrand?.branding.colors.primary }}>
                      {selectedBrand?.name}
                    </h3>
                    <p className="text-gray-600">Live preview of your customized brand</p>
                    <div className="mt-4 flex gap-2 justify-center">
                      <div 
                        className="w-8 h-8 rounded"
                        style={{ backgroundColor: selectedBrand?.branding.colors.primary }}
                      />
                      <div 
                        className="w-8 h-8 rounded"
                        style={{ backgroundColor: selectedBrand?.branding.colors.secondary }}
                      />
                      <div 
                        className="w-8 h-8 rounded"
                        style={{ backgroundColor: selectedBrand?.branding.colors.accent }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Metrics */}
              {previewResult.metrics && (
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h4 className="font-medium mb-3">Performance Metrics</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Load Time:</span>
                      <span className="ml-2 font-medium">{previewResult.metrics.loadTime}s</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Performance:</span>
                      <span className="ml-2 font-medium">{previewResult.metrics.performanceScore}/100</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Accessibility:</span>
                      <span className="ml-2 font-medium">{previewResult.metrics.accessibilityScore}/100</span>
                    </div>
                    <div>
                      <span className="text-gray-600">SEO:</span>
                      <span className="ml-2 font-medium">{previewResult.metrics.seoScore}/100</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-gray-600">Generating preview...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrandCustomizationDashboard;
