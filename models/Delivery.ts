// types/delivery.ts
export type Status = "pending" | "accepted" | "completed";

export interface Delivery {
  id: string;
  customer_id: string;
  driver_id?: string;
  pickup_lat: number;
  pickup_lng: number;
  status: Status;
  created_at: string;
  updated_at: string;
}

// For creating a new delivery (omit auto-generated fields)
export type CreateDelivery = Omit<Delivery, 'id' | 'created_at' | 'updated_at'>;

// For updating a delivery
export type UpdateDelivery = Partial<Pick<Delivery, 'driver_id' | 'status'>>;

// For API responses with customer/driver names
export interface DeliveryWithNames extends Delivery {
  customer_name?: string;
  customer_email?: string;
  driver_name?: string;
}