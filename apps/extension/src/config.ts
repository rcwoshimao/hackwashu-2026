import { defaultPublicUrl } from "./buildConfig.ts";

declare const __GC_PUBLIC_URL__: string;

export const publicUrl =
  typeof __GC_PUBLIC_URL__ === "string" ? __GC_PUBLIC_URL__ : defaultPublicUrl;

export const requestTimeoutMs = 8_000;
export const retryDelayMs = 250;
