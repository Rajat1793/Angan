// Zod schemas: shared validation for auth and visitor forms (RHF resolvers).
import { z } from 'zod';

// Login accepts email + password; OTP path validates a 6-digit code.
export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Minimum 6 characters'),
});

export const otpSchema = z.object({
  code: z.string().length(6, 'Enter the 6-digit code'),
});

export const onboardingSchema = z.object({
  full_name: z.string().min(2, 'Enter your name'),
  flat_id: z.string().min(1, 'Select your flat'),
});

// Visitor registration captured by guards at the gate.
export const visitorSchema = z.object({
  name: z.string().min(2, 'Enter visitor name'),
  phone: z.string().min(10, 'Enter a valid phone'),
  type: z.enum(['delivery', 'cab', 'guest', 'service']),
  purpose: z.string().min(2, 'Enter purpose'),
  vehicle: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type OtpInput = z.infer<typeof otpSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type VisitorInput = z.infer<typeof visitorSchema>;
