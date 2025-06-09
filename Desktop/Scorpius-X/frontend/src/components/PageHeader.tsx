import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  videoBackground?: boolean;
  actions?: ReactNode;
}

export const PageHeader = ({
  title,
  subtitle,
  videoBackground,
  actions,
}: PageHeaderProps) => {
  return (
    <header className="clean-card border-b border-clean-border">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2 cyber-title">
              {title}
            </h1>
            {subtitle && <p className="text-muted-text">{subtitle}</p>}
          </div>

          {actions && <div className="flex items-center gap-4">{actions}</div>}
        </div>
      </div>
    </header>
  );
};
