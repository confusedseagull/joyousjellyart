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
        "rounded-2xl border cursor-pointer text-sm transition-colors",
        selected
          ? "border-primary bg-primary/5"
          : disabled
            ? "border-[#e5e5e5] bg-muted/50 opacity-50 cursor-not-allowed"
            : "border-[#e5e5e5] bg-white hover:border-primary/40",
        className
      )}
      {...props}
    />
  );
}
