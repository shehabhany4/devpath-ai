import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export type LoginValues = z.infer<typeof loginSchema>

export const signupSchema = z
  .object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type SignupValues = z.infer<typeof signupSchema>

export const onboardingSchema = z.object({
  goal: z.string().min(1, 'Please choose a goal'),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  daily_minutes: z.coerce.number().min(15, 'At least 15 minutes').max(480, 'Max 8 hours'),
})

export type OnboardingValues = z.infer<typeof onboardingSchema>