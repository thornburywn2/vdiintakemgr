// =============================================================================
// Application Categories
// =============================================================================

export const APPLICATION_CATEGORIES = [
  { value: 'productivity', label: 'Productivity', icon: 'FileText' },
  { value: 'communication', label: 'Communication', icon: 'MessageSquare' },
  { value: 'development', label: 'Development', icon: 'Code' },
  { value: 'design', label: 'Design & Creative', icon: 'Palette' },
  { value: 'finance', label: 'Finance & Accounting', icon: 'DollarSign' },
  { value: 'analytics', label: 'Analytics & BI', icon: 'BarChart3' },
  { value: 'security', label: 'Security', icon: 'Shield' },
  { value: 'utilities', label: 'Utilities', icon: 'Wrench' },
  { value: 'browser', label: 'Web Browser', icon: 'Globe' },
  { value: 'media', label: 'Media & Entertainment', icon: 'Play' },
  { value: 'database', label: 'Database', icon: 'Database' },
  { value: 'networking', label: 'Networking', icon: 'Network' },
  { value: 'virtualization', label: 'Virtualization', icon: 'Monitor' },
  { value: 'other', label: 'Other', icon: 'Package' },
] as const;

export type ApplicationCategory = typeof APPLICATION_CATEGORIES[number]['value'];

// Common enterprise applications
export const COMMON_APPLICATIONS = [
  // Microsoft 365
  { name: 'microsoft-office', displayName: 'Microsoft 365 Apps', category: 'productivity', publisher: 'Microsoft', licenseType: 'Microsoft 365' },
  { name: 'microsoft-teams', displayName: 'Microsoft Teams', category: 'communication', publisher: 'Microsoft', licenseType: 'Microsoft 365' },
  { name: 'microsoft-outlook', displayName: 'Microsoft Outlook', category: 'communication', publisher: 'Microsoft', licenseType: 'Microsoft 365' },
  { name: 'onedrive', displayName: 'OneDrive for Business', category: 'productivity', publisher: 'Microsoft', licenseType: 'Microsoft 365' },

  // Browsers
  { name: 'microsoft-edge', displayName: 'Microsoft Edge', category: 'browser', publisher: 'Microsoft', licenseType: 'Freeware' },
  { name: 'google-chrome', displayName: 'Google Chrome', category: 'browser', publisher: 'Google', licenseType: 'Freeware' },
  { name: 'mozilla-firefox', displayName: 'Mozilla Firefox', category: 'browser', publisher: 'Mozilla', licenseType: 'Open Source' },

  // Development
  { name: 'vscode', displayName: 'Visual Studio Code', category: 'development', publisher: 'Microsoft', licenseType: 'Freeware' },
  { name: 'visual-studio', displayName: 'Visual Studio', category: 'development', publisher: 'Microsoft', licenseType: 'Subscription' },
  { name: 'git', displayName: 'Git', category: 'development', publisher: 'Git', licenseType: 'Open Source' },
  { name: 'nodejs', displayName: 'Node.js', category: 'development', publisher: 'OpenJS Foundation', licenseType: 'Open Source' },
  { name: 'python', displayName: 'Python', category: 'development', publisher: 'Python Software Foundation', licenseType: 'Open Source' },

  // Security
  { name: 'defender', displayName: 'Microsoft Defender', category: 'security', publisher: 'Microsoft', licenseType: 'Enterprise Agreement' },
  { name: 'crowdstrike', displayName: 'CrowdStrike Falcon', category: 'security', publisher: 'CrowdStrike', licenseType: 'Subscription' },

  // Analytics
  { name: 'power-bi', displayName: 'Power BI Desktop', category: 'analytics', publisher: 'Microsoft', licenseType: 'Microsoft 365' },
  { name: 'tableau', displayName: 'Tableau Desktop', category: 'analytics', publisher: 'Salesforce', licenseType: 'Subscription' },

  // Adobe
  { name: 'adobe-acrobat', displayName: 'Adobe Acrobat', category: 'productivity', publisher: 'Adobe', licenseType: 'Subscription' },
  { name: 'adobe-creative-cloud', displayName: 'Adobe Creative Cloud', category: 'design', publisher: 'Adobe', licenseType: 'Subscription' },

  // Utilities
  { name: '7zip', displayName: '7-Zip', category: 'utilities', publisher: 'Igor Pavlov', licenseType: 'Open Source' },
  { name: 'notepad-plus', displayName: 'Notepad++', category: 'utilities', publisher: 'Don Ho', licenseType: 'Open Source' },
  { name: 'vlc', displayName: 'VLC Media Player', category: 'media', publisher: 'VideoLAN', licenseType: 'Open Source' },

  // Remote Tools
  { name: 'remote-desktop', displayName: 'Remote Desktop Connection', category: 'utilities', publisher: 'Microsoft', licenseType: 'Enterprise Agreement' },
  { name: 'azure-cli', displayName: 'Azure CLI', category: 'development', publisher: 'Microsoft', licenseType: 'Open Source' },
] as const;

// Base OS options for golden images
export const BASE_OS_OPTIONS = [
  { value: 'win11-23h2-ent-ms', label: 'Windows 11 Enterprise 23H2 Multi-session' },
  { value: 'win11-23h2-ent', label: 'Windows 11 Enterprise 23H2' },
  { value: 'win11-22h2-ent-ms', label: 'Windows 11 Enterprise 22H2 Multi-session' },
  { value: 'win11-22h2-ent', label: 'Windows 11 Enterprise 22H2' },
  { value: 'win10-22h2-ent-ms', label: 'Windows 10 Enterprise 22H2 Multi-session' },
  { value: 'win10-22h2-ent', label: 'Windows 10 Enterprise 22H2' },
  { value: 'win-server-2022', label: 'Windows Server 2022' },
  { value: 'win-server-2019', label: 'Windows Server 2019' },
] as const;
