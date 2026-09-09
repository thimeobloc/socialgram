import { z } from "zod";

export const registerResponseSchema = z.object({
    success: z.boolean().optional(),
    token: z.string().optional(),
    user: z
        .object({
            id: z.string(),
            email: z.string(),
            username: z.string(),
        })
        .optional(),
    error: z.string().optional(),
});