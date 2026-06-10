export interface Vehicle {
  id: number;
  name: string;
  brand: string;
  model: string;
  color?: string;
  year: number;
  batteryKwh: number;
  rangeKm: number;
  chargeType: string;
  pricePerHour?: number;
  pricePerDay: number;
  pricePerWeek?: number;
  location?: string;
  licensePlate?: string;
  status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE';
  isVisible?: boolean;
  description?: string;
  imageUrl?: string;
}
