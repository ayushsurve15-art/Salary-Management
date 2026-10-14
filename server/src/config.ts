import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_PATH: z.string().trim().min(1).default('data/salary.db'),
});

export type Config = {
  env: z.infer<typeof envSchema>['NODE_ENV'];
  port: number;
  databasePath: string;
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    const problems = result.error.issues.map(
      (issue) => `${issue.path.join('.')}: ${issue.message}`,
    );
    throw new Error(`Invalid environment configuration: ${problems.join('; ')}`);
  }
  return {
    env: result.data.NODE_ENV,
    port: result.data.PORT,
    databasePath: result.data.DATABASE_PATH,
  };
}
