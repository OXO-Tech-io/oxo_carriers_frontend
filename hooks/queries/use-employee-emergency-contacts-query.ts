import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/lib/services/profile.service';

export const employeeEmergencyContactsQueryKey = (employeeId: string | undefined) =>
  ['employee-emergency-contacts', employeeId] as const;

export const useEmployeeEmergencyContactsQuery = (employeeId: string | undefined, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: employeeEmergencyContactsQueryKey(employeeId),
    queryFn: () => profileService.getEmergencyContacts(employeeId as string),
    enabled: (options?.enabled ?? true) && !!employeeId,
  });
