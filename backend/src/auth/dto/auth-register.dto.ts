import {z} from "zod";

export class AuthRegisterDto {
  name: string;
  username: string;
  password: string;
}

export const createAuthSchema = z.object({
  name: z.string().min(2, {message: 'Must be 2 or more...'}),
  username: z.string().min(2, {message: 'Must be 2 or more...'}),
  password: z.string().min(8, {message: 'Password must be at least 8 or more character'})
})

export type CreateAuthDto = z.infer<typeof createAuthSchema>;
