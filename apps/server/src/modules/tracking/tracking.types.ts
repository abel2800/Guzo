export interface TimelineEntry {
  type: string;
  status: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: Date;
}
