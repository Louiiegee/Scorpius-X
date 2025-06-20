import { ReactNode } from "react";
import { PageHeader } from "./PageHeader";

interface PageLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  videoBackground?: boolean;
  actions?: ReactNode;
}

export const PageLayout = ({
  children,
  title,
  subtitle,
  videoBackground = false,
  actions,
}: PageLayoutProps) => {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <PageHeader
        title={title}
        subtitle={subtitle}
        videoBackground={videoBackground}
        actions={actions}
      />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
};
