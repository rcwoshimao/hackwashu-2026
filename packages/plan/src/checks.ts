import { relativePathSchema } from "@ground-control/sources";
import { z } from "zod";

const identifierSchema = z.string().min(1);
const portSchema = z.int().min(1).max(65535);
const commandTimeoutSchema = z.int().positive().max(120000);
const portTimeoutSchema = z.int().positive().max(30000);
const commandSchema = z
  .string()
  .min(1)
  .refine(
    (command) =>
      command === command.trim() &&
      /^(?:npm|pnpm|yarn|bun|node|npx|cp|mkdir|touch)(?:\s|$)/.test(command) &&
      !/[;&|<>`$()\r\n]/u.test(command),
  );

export const checkKindSchema = z.enum([
  "file_exists",
  "script_exists",
  "code_reference",
  "env_var",
  "version",
  "cli_flag",
  "command_succeeds",
  "port_listens",
  "http_example",
]);

export const checkSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("file_exists"),
    params: z.strictObject({ path: relativePathSchema }),
  }),
  z.object({
    kind: z.literal("script_exists"),
    params: z.strictObject({ script: identifierSchema }),
  }),
  z.object({
    kind: z.literal("code_reference"),
    params: z.strictObject({ name: identifierSchema }),
  }),
  z.object({
    kind: z.literal("env_var"),
    params: z.strictObject({
      name: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/),
    }),
  }),
  z.object({
    kind: z.literal("version"),
    params: z.strictObject({ range: identifierSchema }),
  }),
  z.object({
    kind: z.literal("cli_flag"),
    params: z.strictObject({
      flag: z.string().regex(/^--?[A-Za-z][A-Za-z0-9-]*$/),
    }),
  }),
  z.object({
    kind: z.literal("command_succeeds"),
    params: z.strictObject({
      command: commandSchema,
      timeoutMs: commandTimeoutSchema.optional(),
    }),
  }),
  z.object({
    kind: z.literal("port_listens"),
    params: z.strictObject({
      port: portSchema,
      startScript: identifierSchema,
      timeoutMs: portTimeoutSchema.optional(),
    }),
  }),
  z.object({
    kind: z.literal("http_example"),
    params: z.strictObject({
      method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"]),
      path: z.string().startsWith("/"),
      expectedStatus: z.int().min(100).max(599),
      expectedKeys: z.array(identifierSchema),
    }),
  }),
]);

export type CheckKind = z.infer<typeof checkKindSchema>;
export type Check = z.infer<typeof checkSchema>;
