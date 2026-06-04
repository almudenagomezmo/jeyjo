import { Children, cloneElement, isValidElement } from "react";
import type { HTMLAttributes, ReactElement } from "react";

/**
 * Minimal `asChild` implementation (à la Radix Slot) without adding a
 * dependency: merges the parent's props/classNames onto its single child.
 */
export function Slot({ children, className, ...props }: HTMLAttributes<HTMLElement>) {
  const child = Children.only(children) as ReactElement<Record<string, unknown>>;
  if (!isValidElement(child)) return null;
  const childProps = child.props;
  return cloneElement(child, {
    ...props,
    ...childProps,
    className: [className, childProps.className as string | undefined].filter(Boolean).join(" "),
  });
}
