export type Package = {
  // API returns 'name', but we map it to 'package_name' for frontend compatibility
  name?: string; // From API
  package_name: string; // Frontend uses this
  description: string;
  sessions: number;
  durationDays: number;
  price: number;
  isActive: boolean;
  isGroup: boolean;
  isVisible: boolean;
  status?: string; // ACTIVE/INACTIVE from API
  createdAt: string;
  updatedAt: string;
  packageId: string;
  _id?: string; // MongoDB ID from API
};


