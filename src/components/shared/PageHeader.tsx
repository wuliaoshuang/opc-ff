import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-5 flex flex-col gap-3 md:mb-6 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-balance md:text-2xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted-foreground md:text-sm">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="shrink-0 [&>button]:min-h-11 [&>button]:w-full md:[&>button]:min-h-0 md:[&>button]:w-auto">
          {action}
        </div>
      )}
    </div>
  );
}
