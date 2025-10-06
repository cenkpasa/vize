
export const CENTERS_TR = {
  cities: ["Ankara","İstanbul","İzmir","Antalya","Bursa","Gaziantep","Adana","Trabzon"],
  centers: { 
    "Ankara": ["VFS Ankara","iDATA Ankara"],
    "İstanbul": ["VFS İstanbul","iDATA İstanbul Avrupa","iDATA İstanbul Anadolu"],
    "İzmir": ["VFS İzmir","iDATA İzmir"],
    "Antalya": ["VFS Antalya","iDATA Antalya"],
    "Bursa": ["VFS Bursa","iDATA Bursa"],
    "Gaziantep": ["VFS Gaziantep"],
    "Adana": ["VFS Adana"],
    "Trabzon": ["VFS Trabzon"] 
  }
};

export const COUNTRY_PORTAL_MAP: { [key: string]: 'idata' | 'vfs' } = { 
  DE:"idata", 
  IT:"idata", 
  CZ:"idata", 
  NL:"idata", 
  FR:"vfs", 
  ES:"vfs", 
  BE:"vfs" 
};

export const PORTAL_URLS = {
    idata: "https://www.idata.com.tr/tr",
    vfs: "https://www.vfsglobal.com/"
};

export const DB_CONFIG = {
  NAME: 'schengen_agent_v7',
  VERSION: 1, // Reset version for new schema
  PERSONS_STORE: 'persons',
  ACCOUNTS_STORE: 'accounts',
  SETTINGS_STORE: 'settings',
  HISTORY_STORE: 'history',
};
