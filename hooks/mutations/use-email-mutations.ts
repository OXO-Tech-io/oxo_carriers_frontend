import { useMutation } from "@tanstack/react-query";
import {
  emailService,
  type TestEmailInput,
} from "@/lib/services/email.service";

export const useSendTestEmailMutation = () =>
  useMutation({
    mutationFn: (payload: TestEmailInput) =>
      emailService.sendTestEmail(payload),
  });
