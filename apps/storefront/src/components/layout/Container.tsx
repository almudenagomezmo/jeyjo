import { cn } from "@/lib/utils/cn";
import type { ElementType, ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}

export function Container({ children, className, as: Tag = "div" }: ContainerProps) {
  return <Tag className={cn("mx-auto w-full max-w-[1360px] px-4 sm:px-6", className)}>{children}</Tag>;
}
