import type { MaterialSymbolName } from "@/shared/config/material-symbols";

export function MaterialSymbol({
  name,
  className,
}: {
  name: MaterialSymbolName;
  className?: string;
}) {
  return (
    <span
      className={
        className
          ? `material-symbols-rounded ${className}`
          : "material-symbols-rounded"
      }
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
