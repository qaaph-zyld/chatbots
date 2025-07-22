/**
 * Domain Configuration Dashboard with SSL Management
 * Enterprise-grade domain setup with automated SSL and security controls
 * Part of Phase 3: Market Leadership - White-label Configuration
 */

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { 
  Globe, Shield, CheckCircle, AlertTriangle, Clock, Settings,
  Key, Lock, Zap, RefreshCw, Copy, ExternalLink, Server, Database
} from 'lucide-react';

import WhiteLabelService from '../../services/WhiteLabelService';
import { 
  BrandConfiguration, DomainConfiguration, DNSRecord, 
  DomainValidationResult, SSLSetupResult, DNSCheckResult 
} from '../../types/WhiteLabelTypes';

const DomainConfigurationDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('domain');
  const [selectedBrand, setSelectedBrand] = useState<BrandConfiguration | null>(null);
  const [brands, setBrands] = useState<BrandConfiguration[]>([]);
  const [domainInput, setDomainInput] = useState<string>('');
  const [subdomainInput, setSubdomainInput] = useState<string>('');
  const [validationResult, setValidationResult] = useState<DomainValidationResult | null>(null);
  const [sslResult, setSSLResult] = useState<SSLSetupResult | null>(null);
  const [dnsResult, setDNSResult] = useState<DNSCheckResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isSettingUpSSL, setIsSettingUpSSL] = useState(false);
  const [isCheckingDNS, setIsCheckingDNS] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const whiteLabelService = WhiteLabelService.getInstance();

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      const allBrands = whiteLabelService.getAllBrands();
      setBrands(allBrands);
      if (allBrands.length > 0 && !selectedBrand) {
        const firstBrand = allBrands[0];
        setSelectedBrand(firstBrand);
        setDomainInput(firstBrand.domain.customDomain || '');
        setSubdomainInput(firstBrand.domain.subdomain);
      }
    } catch (error) {
      console.error('Error loading brands:', error);
    }
  };

  const validateDomain = async () => {
    if (!domainInput.trim()) return;
    setIsValidating(true);
    try {
      const result = await whiteLabelService.validateDomain(domainInput);
      setValidationResult(result);
    } catch (error) {
      console.error('Error validating domain:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const setupSSL = async () => {
    if (!selectedBrand) return;
    setIsSettingUpSSL(true);
    try {
      const result = await whiteLabelService.setupSSL(selectedBrand.id);
      setSSLResult(result);
      if (result.success) {
        const updatedDomain: DomainConfiguration = {
          ...selectedBrand.domain,
          ssl: {
            ...selectedBrand.domain.ssl,
            enabled: true,
            certificate: {
              type: 'letsencrypt',
              status: 'active',
              expiresAt: result.expiresAt,
              issuer: 'Let\'s Encrypt'
            }
          }
        };
        await whiteLabelService.configureDomain(selectedBrand.id, updatedDomain);
        setSelectedBrand({ ...selectedBrand, domain: updatedDomain });
      }
    } catch (error) {
      console.error('Error setting up SSL:', error);
    } finally {
      setIsSettingUpSSL(false);
    }
  };

  const checkDNS = async () => {
    if (!selectedBrand) return;
    setIsCheckingDNS(true);
    try {
      const result = await whiteLabelService.checkDNS(selectedBrand.id);
      setDNSResult(result);
    } catch (error) {
      console.error('Error checking DNS:', error);
    } finally {
      setIsCheckingDNS(false);
    }
  };

  const saveDomainConfiguration = async () => {
    if (!selectedBrand) return;
    try {
      const updatedDomain: DomainConfiguration = {
        ...selectedBrand.domain,
        customDomain: domainInput || undefined,
        subdomain: subdomainInput
      };
      await whiteLabelService.configureDomain(selectedBrand.id, updatedDomain);
      setSelectedBrand({ ...selectedBrand, domain: updatedDomain });
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving domain configuration:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'valid':
      case 'configured':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'error':
      case 'expired':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const requiredDNSRecords: DNSRecord[] = [
    { type: 'A', name: '@', value: '192.168.1.100', ttl: 3600, status: 'pending' },
    { type: 'CNAME', name: 'www', value: domainInput || 'example.com', ttl: 3600, status: 'pending' },
    { type: 'TXT', name: '_shopbot-verification', value: `shopbot-site-verification=${selectedBrand?.id}`, ttl: 3600, status: 'pending' }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Globe className="h-8 w-8 text-blue-600" />
            Domain Configuration
          </h1>
          <p className="text-gray-600 mt-1">Enterprise-grade domain setup with automated SSL management</p>
        </div>
        <Button onClick={saveDomainConfiguration} disabled={!hasChanges} size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Save Configuration
        </Button>
      </div>

      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <label className="block text-sm font-medium mb-2">Select Brand</label>
        <select
          value={selectedBrand?.id || ''}
          onChange={(e) => {
            const brand = brands.find(b => b.id === e.target.value);
            if (brand) {
              setSelectedBrand(brand);
              setDomainInput(brand.domain.customDomain || '');
              setSubdomainInput(brand.domain.subdomain);
              setHasChanges(false);
            }
          }}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          {brands.map(brand => (
            <option key={brand.id} value={brand.id}>
              {brand.name} ({brand.slug})
            </option>
          ))}
        </select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="domain">Domain Setup</TabsTrigger>
          <TabsTrigger value="dns">DNS Configuration</TabsTrigger>
          <TabsTrigger value="ssl">SSL Management</TabsTrigger>
          <TabsTrigger value="security">Security Controls</TabsTrigger>
        </TabsList>

        <TabsContent value="domain" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Domain Configuration
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Custom Domain</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={domainInput}
                      onChange={(e) => {
                        setDomainInput(e.target.value);
                        setHasChanges(true);
                      }}
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="yourdomain.com"
                    />
                    <Button onClick={validateDomain} disabled={isValidating || !domainInput.trim()} variant="outline">
                      {isValidating ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Validate'}
                    </Button>
                  </div>
                  {validationResult && (
                    <div className={`mt-2 p-3 rounded-lg ${
                      validationResult.isValid && validationResult.isAvailable 
                        ? 'bg-green-50 text-green-800' 
                        : 'bg-red-50 text-red-800'
                    }`}>
                      {validationResult.isValid && validationResult.isAvailable ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Domain is valid and available
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-4 w-4" />
                            Domain validation failed
                          </div>
                          {validationResult.errors.map((error, index) => (
                            <div key={index} className="text-sm">• {error}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Subdomain</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={subdomainInput}
                      onChange={(e) => {
                        setSubdomainInput(e.target.value);
                        setHasChanges(true);
                      }}
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="your-brand"
                    />
                    <span className="text-gray-500">.shopbot.ai</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Server className="h-5 w-5" />
                Current Configuration
              </h3>
              
              {selectedBrand && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Primary Domain:</span>
                    <span className="font-medium">
                      {selectedBrand.domain.customDomain || 'Not configured'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">SSL Status:</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedBrand.domain.ssl.enabled ? 'active' : 'pending')}
                      <span className="text-sm">
                        {selectedBrand.domain.ssl.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ssl" className="space-y-6">
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              SSL Certificate Management
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <div className="font-medium">Auto SSL</div>
                  <div className="text-sm text-gray-600">Automatically provision and renew SSL certificates</div>
                </div>
                <Button onClick={setupSSL} disabled={isSettingUpSSL || !domainInput} size="sm">
                  {isSettingUpSSL ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Lock className="h-4 w-4 mr-2" />
                  )}
                  {isSettingUpSSL ? 'Setting up...' : 'Setup SSL'}
                </Button>
              </div>

              {sslResult && (
                <div className={`p-3 rounded-lg ${
                  sslResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {sslResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                    <span className="font-medium">SSL Setup {sslResult.success ? 'Successful' : 'Failed'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Enterprise Security Controls
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Access Controls</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Role-based access control (RBAC)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Multi-factor authentication</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>API key rotation</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Data Protection</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>End-to-end encryption</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>GDPR compliance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Audit logging</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DomainConfigurationDashboard;
