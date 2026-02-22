export interface BiryaniSpot {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  addedBy: string;
  createdAt: Date;
  isActive: boolean;
  rating?: number;
  description?: string;
  likes: number;
  dislikes: number;
}
