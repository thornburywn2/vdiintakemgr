// =============================================================================
// Azure Regions - Comprehensive list for AVD deployment
// =============================================================================

export interface AzureRegion {
  code: string;
  name: string;
  displayName: string;
  shortCode: string;
  geography: string;
  pairedRegion?: string;
}

export const AZURE_REGIONS: AzureRegion[] = [
  // United States
  { code: 'eastus', name: 'East US', displayName: 'East US (Virginia)', shortCode: 'eus', geography: 'US', pairedRegion: 'westus' },
  { code: 'eastus2', name: 'East US 2', displayName: 'East US 2 (Virginia)', shortCode: 'eus2', geography: 'US', pairedRegion: 'centralus' },
  { code: 'westus', name: 'West US', displayName: 'West US (California)', shortCode: 'wus', geography: 'US', pairedRegion: 'eastus' },
  { code: 'westus2', name: 'West US 2', displayName: 'West US 2 (Washington)', shortCode: 'wus2', geography: 'US', pairedRegion: 'westcentralus' },
  { code: 'westus3', name: 'West US 3', displayName: 'West US 3 (Arizona)', shortCode: 'wus3', geography: 'US', pairedRegion: 'eastus' },
  { code: 'centralus', name: 'Central US', displayName: 'Central US (Iowa)', shortCode: 'cus', geography: 'US', pairedRegion: 'eastus2' },
  { code: 'northcentralus', name: 'North Central US', displayName: 'North Central US (Illinois)', shortCode: 'ncus', geography: 'US', pairedRegion: 'southcentralus' },
  { code: 'southcentralus', name: 'South Central US', displayName: 'South Central US (Texas)', shortCode: 'scus', geography: 'US', pairedRegion: 'northcentralus' },
  { code: 'westcentralus', name: 'West Central US', displayName: 'West Central US (Wyoming)', shortCode: 'wcus', geography: 'US', pairedRegion: 'westus2' },

  // Canada
  { code: 'canadacentral', name: 'Canada Central', displayName: 'Canada Central (Toronto)', shortCode: 'cac', geography: 'Canada', pairedRegion: 'canadaeast' },
  { code: 'canadaeast', name: 'Canada East', displayName: 'Canada East (Quebec)', shortCode: 'cae', geography: 'Canada', pairedRegion: 'canadacentral' },

  // Europe
  { code: 'northeurope', name: 'North Europe', displayName: 'North Europe (Ireland)', shortCode: 'neu', geography: 'Europe', pairedRegion: 'westeurope' },
  { code: 'westeurope', name: 'West Europe', displayName: 'West Europe (Netherlands)', shortCode: 'weu', geography: 'Europe', pairedRegion: 'northeurope' },
  { code: 'uksouth', name: 'UK South', displayName: 'UK South (London)', shortCode: 'uks', geography: 'UK', pairedRegion: 'ukwest' },
  { code: 'ukwest', name: 'UK West', displayName: 'UK West (Cardiff)', shortCode: 'ukw', geography: 'UK', pairedRegion: 'uksouth' },
  { code: 'francecentral', name: 'France Central', displayName: 'France Central (Paris)', shortCode: 'frc', geography: 'France', pairedRegion: 'francesouth' },
  { code: 'francesouth', name: 'France South', displayName: 'France South (Marseille)', shortCode: 'frs', geography: 'France', pairedRegion: 'francecentral' },
  { code: 'germanywestcentral', name: 'Germany West Central', displayName: 'Germany West Central (Frankfurt)', shortCode: 'gwc', geography: 'Germany' },
  { code: 'switzerlandnorth', name: 'Switzerland North', displayName: 'Switzerland North (Zurich)', shortCode: 'szn', geography: 'Switzerland' },
  { code: 'norwayeast', name: 'Norway East', displayName: 'Norway East (Oslo)', shortCode: 'noe', geography: 'Norway' },
  { code: 'swedencentral', name: 'Sweden Central', displayName: 'Sweden Central (Gävle)', shortCode: 'sec', geography: 'Sweden' },

  // Asia Pacific
  { code: 'eastasia', name: 'East Asia', displayName: 'East Asia (Hong Kong)', shortCode: 'eas', geography: 'Asia', pairedRegion: 'southeastasia' },
  { code: 'southeastasia', name: 'Southeast Asia', displayName: 'Southeast Asia (Singapore)', shortCode: 'sea', geography: 'Asia', pairedRegion: 'eastasia' },
  { code: 'japaneast', name: 'Japan East', displayName: 'Japan East (Tokyo)', shortCode: 'jpe', geography: 'Japan', pairedRegion: 'japanwest' },
  { code: 'japanwest', name: 'Japan West', displayName: 'Japan West (Osaka)', shortCode: 'jpw', geography: 'Japan', pairedRegion: 'japaneast' },
  { code: 'australiaeast', name: 'Australia East', displayName: 'Australia East (Sydney)', shortCode: 'aue', geography: 'Australia', pairedRegion: 'australiasoutheast' },
  { code: 'australiasoutheast', name: 'Australia Southeast', displayName: 'Australia Southeast (Melbourne)', shortCode: 'aus', geography: 'Australia', pairedRegion: 'australiaeast' },
  { code: 'koreacentral', name: 'Korea Central', displayName: 'Korea Central (Seoul)', shortCode: 'krc', geography: 'Korea', pairedRegion: 'koreasouth' },
  { code: 'koreasouth', name: 'Korea South', displayName: 'Korea South (Busan)', shortCode: 'krs', geography: 'Korea', pairedRegion: 'koreacentral' },
  { code: 'centralindia', name: 'Central India', displayName: 'Central India (Pune)', shortCode: 'cin', geography: 'India', pairedRegion: 'southindia' },
  { code: 'southindia', name: 'South India', displayName: 'South India (Chennai)', shortCode: 'sin', geography: 'India', pairedRegion: 'centralindia' },

  // South America
  { code: 'brazilsouth', name: 'Brazil South', displayName: 'Brazil South (São Paulo)', shortCode: 'brs', geography: 'Brazil', pairedRegion: 'southcentralus' },

  // Middle East & Africa
  { code: 'uaenorth', name: 'UAE North', displayName: 'UAE North (Dubai)', shortCode: 'uan', geography: 'UAE' },
  { code: 'southafricanorth', name: 'South Africa North', displayName: 'South Africa North (Johannesburg)', shortCode: 'san', geography: 'Africa' },
];

// Get region by code
export const getRegionByCode = (code: string): AzureRegion | undefined => {
  return AZURE_REGIONS.find(r => r.code === code);
};

// Get short code for region
export const getRegionShortCode = (code: string): string => {
  const region = getRegionByCode(code);
  return region?.shortCode || code.substring(0, 4);
};

// Group regions by geography
export const getRegionsByGeography = (): Record<string, AzureRegion[]> => {
  return AZURE_REGIONS.reduce((acc, region) => {
    if (!acc[region.geography]) {
      acc[region.geography] = [];
    }
    acc[region.geography].push(region);
    return acc;
  }, {} as Record<string, AzureRegion[]>);
};
