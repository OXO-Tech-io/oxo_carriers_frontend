import api from "@/lib/api";
import { extractData } from "@/lib/services/http";
import type { ApiResponse } from "@/types/api";
import type { Facility, FacilityBooking } from "@/types";

export interface FacilityInput {
  name: string;
  type: string;
  description?: string;
  facilities?: string;
  capacity?: number;
  is_active?: boolean;
}

export interface FacilityAvailabilityParams {
  start_time: string;
  end_time: string;
  type?: string;
}

export interface FacilityBookingInput {
  facility_id: number;
  start_time: string;
  end_time: string;
  purpose?: string;
}

export interface AllBookingsParams {
  start_date: string;
  end_date: string;
  facility_id?: number;
}

export const facilityService = {
  listFacilities: async (): Promise<Facility[]> => {
    const res = await api.get<ApiResponse<Facility[]> | Facility[]>(
      "/facilities",
    );
    return extractData<Facility[]>(res as never);
  },

  createFacility: async (payload: FacilityInput): Promise<Facility> => {
    const res = await api.post<ApiResponse<Facility> | Facility>(
      "/facilities",
      payload,
    );
    return extractData<Facility>(res as never);
  },

  updateFacility: async (
    id: number,
    payload: FacilityInput,
  ): Promise<Facility> => {
    const res = await api.put<ApiResponse<Facility> | Facility>(
      `/facilities/${id}`,
      payload,
    );
    return extractData<Facility>(res as never);
  },

  deleteFacility: async (id: number): Promise<void> => {
    await api.delete(`/facilities/${id}`);
  },

  getAvailableFacilities: async (
    params: FacilityAvailabilityParams,
  ): Promise<Facility[]> => {
    const res = await api.get<ApiResponse<Facility[]> | Facility[]>(
      "/facilities/available",
      { params },
    );
    return extractData<Facility[]>(res as never);
  },

  createBooking: async (
    payload: FacilityBookingInput,
  ): Promise<FacilityBooking> => {
    const res = await api.post<ApiResponse<FacilityBooking> | FacilityBooking>(
      "/facilities/book",
      payload,
    );
    return extractData<FacilityBooking>(res as never);
  },

  getMyBookings: async (): Promise<FacilityBooking[]> => {
    const res = await api.get<
      ApiResponse<FacilityBooking[]> | FacilityBooking[]
    >("/facilities/my-bookings");
    return extractData<FacilityBooking[]>(res as never);
  },

  cancelBooking: async (id: number): Promise<void> => {
    await api.put(`/facilities/bookings/${id}/cancel`);
  },

  getAllBookings: async (
    params: AllBookingsParams,
  ): Promise<FacilityBooking[]> => {
    const res = await api.get<
      ApiResponse<FacilityBooking[]> | FacilityBooking[]
    >("/facilities/all-bookings", { params });
    return extractData<FacilityBooking[]>(res as never);
  },
};
