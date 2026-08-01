import { useMutation, useQueryClient } from '@tanstack/react-query';
import { groupService } from '@/lib/services/group.service';

export const useCreateGroupMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => groupService.create(name),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
};

export const useRenameGroupMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => groupService.rename(id, name),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['groups', 'list'] });
      void queryClient.invalidateQueries({ queryKey: ['groups', 'detail', id] });
    },
  });
};

export const useDeleteGroupMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => groupService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
};

export const useAddGroupMembersMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userIds }: { id: number; userIds: number[] }) => groupService.addMembers(id, userIds),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['groups', 'list'] });
      void queryClient.invalidateQueries({ queryKey: ['groups', 'detail', id] });
    },
  });
};

export const useRemoveGroupMemberMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userId }: { id: number; userId: number }) => groupService.removeMember(id, userId),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['groups', 'list'] });
      void queryClient.invalidateQueries({ queryKey: ['groups', 'detail', id] });
    },
  });
};
