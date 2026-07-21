import { z } from "zod";

export const onboardingStatusSchema = z.object({
  scopeConfirmed: z.boolean(),
  confirmedAt: z.string().datetime().optional(),
});

export type OnboardingStatus = z.infer<typeof onboardingStatusSchema>;

export const defaultOnboardingStatus: OnboardingStatus = {
  scopeConfirmed: false,
};

export const completeOnboardingStatus = (confirmedAt: string): OnboardingStatus =>
  onboardingStatusSchema.parse({
    scopeConfirmed: true,
    confirmedAt,
  });

export const resetOnboardingStatus = (): OnboardingStatus => defaultOnboardingStatus;
