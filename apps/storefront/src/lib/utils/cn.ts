import { twMerge } from "tailwind-merge";

type ClassValue = string | number | null | false | undefined;

/** Join class names and merge Tailwind conflicts (last wins). */
export function cn(...values: ClassValue[]): string {
  return twMerge(values.filter(Boolean).join(" "));
}
