import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef } from "react";

interface SelectablePillProps extends ComponentPropsWithoutRef<"div"> {
  selected: boolean;
  disabled?: boolean;
}

export function SelectablePill({
  selected,
  disabled,
  className,
  onClick,
  ...props
}: SelectablePillProps) {
  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={cn(
        "rounded-md border-2 cursor-pointer text-sm transition-all",
        selected
          ? "border-primary bg-primary/10"
          : disabled
            ? "border-muted bg-muted/50 opacity-50 cursor-not-allowed"
            : "border-muted bg-popover hover:bg-accent hover:text-accent-foreground",
        className
      )}
      {...props}
    />
  );
}
