/**
 * White-label Configuration Types
 * Enterprise-grade multi-tenant customization system
 * Part of Phase 3: Market Leadership - White-label Configuration
 */

export interface BrandConfiguration {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  owner: {
    userId: string;
    email: string;
    organizationId: string;
  };
  branding: BrandingSettings;
  theming: ThemeConfiguration;
  domain: DomainConfiguration;
  features: FeatureConfiguration;
  customization: ComponentCustomization;
  preview: PreviewSettings;
}

export interface BrandingSettings {
  logo: {
    primary: string; // URL or base64
    secondary?: string;
    favicon: string;
    dimensions: {
      width: number;
      height: number;
      maxWidth?: number;
      maxHeight?: number;
    };
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: {
      primary: string;
      secondary: string;
      muted: string;
    };
    border: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  typography: {
    fontFamily: {
      primary: string;
      secondary?: string;
      monospace?: string;
    };
    fontSizes: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
      '4xl': string;
    };
    fontWeights: {
      light: number;
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
    lineHeights: {
      tight: number;
      normal: number;
      relaxed: number;
    };
  };
  spacing: {
    unit: number; // Base spacing unit (e.g., 4px)
    scale: number[]; // Multipliers for spacing scale
  };
  borderRadius: {
    none: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    full: string;
  };
  shadows: {
    sm: string;
    base: string;
    lg: string;
    xl: string;
  };
}

export interface ThemeConfiguration {
  id: string;
  name: string;
  type: 'light' | 'dark' | 'auto' | 'custom';
  baseTheme?: 'modern' | 'classic' | 'minimal' | 'bold';
  customCSS?: string;
  components: ComponentThemeOverrides;
  layouts: LayoutConfiguration;
  animations: AnimationConfiguration;
}

export interface ComponentThemeOverrides {
  button: {
    variants: {
      primary: ComponentVariant;
      secondary: ComponentVariant;
      outline: ComponentVariant;
      ghost: ComponentVariant;
      link: ComponentVariant;
    };
    sizes: {
      sm: ComponentSize;
      base: ComponentSize;
      lg: ComponentSize;
      xl: ComponentSize;
    };
  };
  input: {
    variants: {
      default: ComponentVariant;
      filled: ComponentVariant;
      outline: ComponentVariant;
    };
    states: {
      default: ComponentState;
      focus: ComponentState;
      error: ComponentState;
      disabled: ComponentState;
    };
  };
  card: {
    variants: {
      default: ComponentVariant;
      elevated: ComponentVariant;
      outlined: ComponentVariant;
      filled: ComponentVariant;
    };
  };
  navigation: {
    header: ComponentVariant;
    sidebar: ComponentVariant;
    footer: ComponentVariant;
    breadcrumb: ComponentVariant;
  };
  dashboard: {
    widget: ComponentVariant;
    chart: ComponentVariant;
    table: ComponentVariant;
    metric: ComponentVariant;
  };
}

export interface ComponentVariant {
  backgroundColor?: string;
  color?: string;
  borderColor?: string;
  borderWidth?: string;
  borderRadius?: string;
  padding?: string;
  margin?: string;
  fontSize?: string;
  fontWeight?: string;
  boxShadow?: string;
  transition?: string;
  hover?: Partial<ComponentVariant>;
  active?: Partial<ComponentVariant>;
  focus?: Partial<ComponentVariant>;
}

export interface ComponentSize {
  padding: string;
  fontSize: string;
  lineHeight: string;
  minHeight?: string;
  iconSize?: string;
}

export interface ComponentState {
  backgroundColor?: string;
  borderColor?: string;
  color?: string;
  boxShadow?: string;
  outline?: string;
}

export interface LayoutConfiguration {
  container: {
    maxWidth: string;
    padding: string;
    margin: string;
  };
  grid: {
    columns: number;
    gap: string;
    breakpoints: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
      '2xl': string;
    };
  };
  header: {
    height: string;
    position: 'fixed' | 'sticky' | 'relative';
    background: string;
    zIndex: number;
  };
  sidebar: {
    width: string;
    collapsedWidth: string;
    background: string;
    position: 'fixed' | 'relative';
  };
  footer: {
    height: string;
    background: string;
    position: 'fixed' | 'relative';
  };
}

export interface AnimationConfiguration {
  duration: {
    fast: string;
    normal: string;
    slow: string;
  };
  easing: {
    linear: string;
    easeIn: string;
    easeOut: string;
    easeInOut: string;
  };
  transitions: {
    fade: string;
    slide: string;
    scale: string;
    bounce: string;
  };
  reducedMotion: boolean;
}

export interface DomainConfiguration {
  customDomain?: string;
  subdomain: string;
  ssl: {
    enabled: boolean;
    certificate?: {
      type: 'letsencrypt' | 'custom' | 'cloudflare';
      status: 'pending' | 'active' | 'expired' | 'error';
      expiresAt?: Date;
      issuer?: string;
    };
    forceHttps: boolean;
  };
  dns: {
    status: 'pending' | 'active' | 'error';
    records: DNSRecord[];
    lastChecked: Date;
  };
  redirects: DomainRedirect[];
}

export interface DNSRecord {
  type: 'A' | 'AAAA' | 'CNAME' | 'TXT' | 'MX';
  name: string;
  value: string;
  ttl: number;
  priority?: number;
  status: 'pending' | 'active' | 'error';
}

export interface DomainRedirect {
  from: string;
  to: string;
  type: 'permanent' | 'temporary';
  preservePath: boolean;
  isActive: boolean;
}

export interface FeatureConfiguration {
  modules: {
    dashboard: boolean;
    analytics: boolean;
    reporting: boolean;
    aiTraining: boolean;
    socialProof: boolean;
    roiCalculator: boolean;
    multiPlatform: boolean;
    predictiveAnalytics: boolean;
    whiteLabel: boolean;
  };
  limits: {
    users: number;
    storage: number; // MB
    apiCalls: number; // per month
    customDomains: number;
    themes: number;
  };
  integrations: {
    enabled: string[]; // Integration IDs
    apiKeys: Record<string, string>;
    webhooks: WebhookConfiguration[];
  };
  customization: {
    allowCustomCSS: boolean;
    allowCustomJS: boolean;
    allowComponentOverrides: boolean;
    allowLayoutChanges: boolean;
  };
}

export interface WebhookConfiguration {
  id: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
  headers?: Record<string, string>;
}

export interface ComponentCustomization {
  overrides: Record<string, ComponentOverride>;
  customComponents: CustomComponent[];
  hiddenComponents: string[];
  componentOrder: Record<string, number>;
}

export interface ComponentOverride {
  componentId: string;
  props?: Record<string, any>;
  styles?: Record<string, string>;
  content?: {
    text?: Record<string, string>; // Localization
    images?: Record<string, string>;
    links?: Record<string, string>;
  };
  behavior?: {
    onClick?: string; // Custom action
    onHover?: string;
    validation?: Record<string, any>;
  };
}

export interface CustomComponent {
  id: string;
  name: string;
  type: 'react' | 'html' | 'markdown';
  code: string;
  props?: ComponentPropDefinition[];
  dependencies?: string[];
  position: {
    page: string;
    section: string;
    order: number;
  };
  isActive: boolean;
}

export interface ComponentPropDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  defaultValue?: any;
  description?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: any[];
  };
}

export interface PreviewSettings {
  mode: 'live' | 'staging' | 'development';
  devices: PreviewDevice[];
  viewports: PreviewViewport[];
  features: {
    responsivePreview: boolean;
    deviceFrames: boolean;
    performanceMetrics: boolean;
    accessibilityCheck: boolean;
    seoPreview: boolean;
  };
  sharing: {
    enabled: boolean;
    password?: string;
    expiresAt?: Date;
    allowComments: boolean;
  };
}

export interface PreviewDevice {
  id: string;
  name: string;
  type: 'desktop' | 'tablet' | 'mobile';
  width: number;
  height: number;
  pixelRatio: number;
  userAgent: string;
  isDefault: boolean;
}

export interface PreviewViewport {
  id: string;
  name: string;
  width: number;
  height: number;
  isDefault: boolean;
}

// Service interfaces
export interface WhiteLabelService {
  // Brand management
  createBrand(config: Partial<BrandConfiguration>): Promise<BrandConfiguration>;
  updateBrand(id: string, updates: Partial<BrandConfiguration>): Promise<BrandConfiguration>;
  deleteBrand(id: string): Promise<boolean>;
  getBrand(id: string): Promise<BrandConfiguration | null>;
  listBrands(userId: string): Promise<BrandConfiguration[]>;
  
  // Theme management
  createTheme(brandId: string, theme: Partial<ThemeConfiguration>): Promise<ThemeConfiguration>;
  updateTheme(brandId: string, themeId: string, updates: Partial<ThemeConfiguration>): Promise<ThemeConfiguration>;
  deleteTheme(brandId: string, themeId: string): Promise<boolean>;
  getTheme(brandId: string, themeId: string): Promise<ThemeConfiguration | null>;
  listThemes(brandId: string): Promise<ThemeConfiguration[]>;
  
  // Domain management
  configureDomain(brandId: string, domain: Partial<DomainConfiguration>): Promise<DomainConfiguration>;
  validateDomain(domain: string): Promise<DomainValidationResult>;
  setupSSL(brandId: string): Promise<SSLSetupResult>;
  checkDNS(brandId: string): Promise<DNSCheckResult>;
  
  // Preview management
  generatePreview(brandId: string, options?: PreviewOptions): Promise<PreviewResult>;
  sharePreview(brandId: string, settings: PreviewSettings): Promise<ShareResult>;
  
  // Export/Import
  exportBrand(brandId: string): Promise<BrandExport>;
  importBrand(data: BrandImport): Promise<BrandConfiguration>;
}

export interface DomainValidationResult {
  isValid: boolean;
  isAvailable: boolean;
  errors: string[];
  suggestions: string[];
  estimatedSetupTime: number; // minutes
}

export interface SSLSetupResult {
  success: boolean;
  certificateId?: string;
  status: string;
  expiresAt?: Date;
  errors?: string[];
}

export interface DNSCheckResult {
  isConfigured: boolean;
  records: DNSRecord[];
  missingRecords: DNSRecord[];
  errors: string[];
  propagationTime?: number; // minutes
}

export interface PreviewOptions {
  device?: string;
  viewport?: string;
  theme?: string;
  features?: string[];
  includeMetrics?: boolean;
}

export interface PreviewResult {
  url: string;
  thumbnailUrl?: string;
  metrics?: {
    loadTime: number;
    performanceScore: number;
    accessibilityScore: number;
    seoScore: number;
  };
  expiresAt: Date;
}

export interface ShareResult {
  shareUrl: string;
  embedCode?: string;
  qrCode?: string;
  expiresAt?: Date;
}

export interface BrandExport {
  version: string;
  brand: BrandConfiguration;
  themes: ThemeConfiguration[];
  assets: AssetExport[];
  exportedAt: Date;
}

export interface BrandImport {
  version: string;
  brand: Partial<BrandConfiguration>;
  themes?: Partial<ThemeConfiguration>[];
  assets?: AssetImport[];
  options?: {
    overwriteExisting: boolean;
    preserveIds: boolean;
    validateAssets: boolean;
  };
}

export interface AssetExport {
  id: string;
  type: 'image' | 'font' | 'css' | 'js';
  url: string;
  data: string; // base64 or content
  metadata: {
    size: number;
    mimeType: string;
    dimensions?: { width: number; height: number; };
  };
}

export interface AssetImport {
  id: string;
  type: 'image' | 'font' | 'css' | 'js';
  data: string;
  metadata: {
    size: number;
    mimeType: string;
    dimensions?: { width: number; height: number; };
  };
}

// Analytics and reporting
export interface WhiteLabelAnalytics {
  brandId: string;
  usage: {
    activeUsers: number;
    pageViews: number;
    sessions: number;
    bounceRate: number;
    avgSessionDuration: number;
  };
  performance: {
    loadTime: number;
    coreWebVitals: {
      lcp: number;
      fid: number;
      cls: number;
    };
    uptime: number;
  };
  customization: {
    themesUsed: number;
    componentsCustomized: number;
    customCSSLines: number;
    assetsUploaded: number;
  };
  domain: {
    status: string;
    sslStatus: string;
    dnsStatus: string;
    lastChecked: Date;
  };
  trends: {
    period: string;
    userGrowth: number;
    performanceChange: number;
    customizationActivity: number;
  }[];
}

export default WhiteLabelService;
