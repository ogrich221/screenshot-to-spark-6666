import { z } from 'zod';

export const accountStatusSchema = z.enum(['Active', 'Verified', 'Review needed', 'Temporarily restricted', 'Closed']);