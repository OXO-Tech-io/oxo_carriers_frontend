// frontend/components/forms/LeaveRequestForm.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const leaveRequestSchema = z.object({
  leave_type_id: z.string().min(1, 'Leave type is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  attachment: z.instanceof(File).optional()
});

type LeaveRequestFormData = z.infer<typeof leaveRequestSchema>;

export default function LeaveRequestForm() {
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<LeaveRequestFormData>({
    resolver: zodResolver(leaveRequestSchema)
  });
  
  // Fetch leave types
  const { data: leaveTypes } = useQuery({
    queryKey: ['leaveTypes'],
    queryFn: async () => {
      const response = await api.get('/leaves/types');
      return response.data.data;
    }
  });
  
  // Fetch leave balance
  const { data: leaveBalance } = useQuery({
    queryKey: ['leaveBalance'],
    queryFn: async () => {
      const response = await api.get('/leaves/balance');
      return response.data.data;
    }
  });
  
  const leaveRequestMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await api.post('/leaves/request', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveBalance'] });
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
      reset();
      alert('Leave request submitted successfully!');
    }
  });
  
  const onSubmit = async (data: LeaveRequestFormData) => {
    const formData = new FormData();
    formData.append('leave_type_id', data.leave_type_id);
    formData.append('start_date', data.start_date);
    formData.append('end_date', data.end_date);
    formData.append('reason', data.reason);
    
    if (data.attachment) {
      formData.append('attachment', data.attachment);
    }
    
    leaveRequestMutation.mutate(formData);
  };
  
  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentPreview(URL.createObjectURL(file));
    }
  };
  
  const startDate = watch('start_date');
  const endDate = watch('end_date');
  
  const calculateDays = () => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
    return 0;
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Leave Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Leave Type *
          </label>
          <select
            {...register('leave_type_id')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          >
            <option value="">Select leave type</option>
            {leaveTypes?.map((type: any) => {
              const balance = leaveBalance?.find((b: any) => b.leave_type_id === type.id);
              return (
                <option key={type.id} value={type.id}>
                  {type.name} ({balance?.remaining_days || 0} days remaining)
                </option>
              );
            })}
          </select>
          {errors.leave_type_id && (
            <p className="mt-1 text-sm text-red-600">{errors.leave_type_id.message}</p>
          )}
        </div>
        
        {/* Dates */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Total Days
          </label>
          <div className="mt-1 text-lg font-semibold text-blue-600">
            {calculateDays()} day(s)
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Start Date *
          </label>
          <input
            type="date"
            {...register('start_date')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
          {errors.start_date && (
            <p className="mt-1 text-sm text-red-600">{errors.start_date.message}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">
            End Date *
          </label>
          <input
            type="date"
            {...register('end_date')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
          {errors.end_date && (
            <p className="mt-1 text-sm text-red-600">{errors.end_date.message}</p>
          )}
        </div>
      </div>
      
      {/* Reason */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Reason *
        </label>
        <textarea
          {...register('reason')}
          rows={4}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          placeholder="Please provide details for your leave request..."
        />
        {errors.reason && (
          <p className="mt-1 text-sm text-red-600">{errors.reason.message}</p>
        )}
      </div>
      
      {/* Attachment */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Attachment (Optional)
        </label>
        <input
          type="file"
          {...register('attachment')}
          onChange={handleAttachmentChange}
          accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {attachmentPreview && (
          <div className="mt-2">
            <p className="text-sm text-gray-600">Preview:</p>
            {attachmentPreview.match(/\.(jpg|jpeg|png)$/i) ? (
              <img src={attachmentPreview} alt="Preview" className="mt-1 max-w-xs rounded" />
            ) : (
              <p className="mt-1 text-sm text-gray-500">Document uploaded</p>
            )}
          </div>
        )}
      </div>
      
      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={leaveRequestMutation.isPending}
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {leaveRequestMutation.isPending ? 'Submitting...' : 'Submit Request'}
        </button>
      </div>
    </form>
  );
}