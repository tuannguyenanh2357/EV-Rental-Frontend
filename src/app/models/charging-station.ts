export interface ChargingStation {
  id: string;
  uuid: string;
  title: string;
  addressLine1: string;
  latitude: number;
  longitude: number;
  isOperational: boolean;
  usageCost: string;
}
