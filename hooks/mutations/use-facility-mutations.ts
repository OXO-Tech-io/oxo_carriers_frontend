import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  facilityService,
  type FacilityInput,
  type FacilityBookingInput,
} from "@/lib/services/facility.service";

export const useCreateFacilityMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: FacilityInput) =>
      facilityService.createFacility(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["facilities"] });
    },
  });
};

export const useUpdateFacilityMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: FacilityInput }) =>
      facilityService.updateFacility(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["facilities"] });
    },
  });
};

export const useDeleteFacilityMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => facilityService.deleteFacility(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["facilities"] });
    },
  });
};

export const useCreateFacilityBookingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: FacilityBookingInput) =>
      facilityService.createBooking(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["facilities", "bookings"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["facilities", "my-bookings"],
      });
    },
  });
};

export const useCancelFacilityBookingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => facilityService.cancelBooking(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["facilities", "bookings"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["facilities", "my-bookings"],
      });
    },
  });
};
