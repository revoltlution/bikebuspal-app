export interface BikeBusRoute {
  id: string;
  name: string;
  neighborhood: string;
  zipCode: string;
  schoolId: string;
  schoolName: string;
  
  // Spatial Data
  coordinates: [number, number][]; // The GPX path
  bounds: {
    sw: [number, number];
    ne: [number, number];
  };

  // Schedule
  meetingPoints: {
    name: string;
    time: string; // e.g., "08:10"
    lat: number;
    lng: number;
    notes?: string;
  }[];

  // Media & Social
  thumbnailUrl?: string;
  gallery?: string[];
  tags: string[]; // ['beginner', 'hills', 'high-viz']
  ownerId: string;
  groupIds: string[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'proposed' | 'archived';
}