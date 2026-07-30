import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/lib/services/profile.service';

export const employeeEmergencyContactsQueryKey = (employeeUserId: number | undefined) =>
  ['employee-emergency-contacts', employeeUserId] as const;

export const useEmployeeEmergencyContactsQuery = (employeeUserId: number | undefined, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: employeeEmergencyContactsQueryKey(employeeUserId),
    queryFn: () => profileService.getEmergencyContacts(employeeUserId as number),
    enabled: (options?.enabled ?? true) && !!employeeUserId,
  });
