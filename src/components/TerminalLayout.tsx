import StatusMatrix from './StatusMatrix';

interface TerminalLayoutProps {
  title: string;
  syslog: string;
  showMatrix?: boolean;
  children: React.ReactNode;
}

export default function TerminalLayout({ title, syslog, showMatrix = true, children }: TerminalLayoutProps) {
  return (
    <div className="max-w-[600px] mx-auto px-3 pt-4 pb-20 font-display">
      {/* OS Title Bar */}
      <div className="text-primary text-[13px] tracking-[2px] border-b border-border pb-2 mb-3 flex items-center gap-2">
        <span className="flex-1"><span className="flex-1">FLOWINDEX OS v4.7 // {title}</span></span>
      </div>

      {showMatrix && <StatusMatrix />}

      {children}

      {/* Syslog footer */}
      <div className="border-t border-border pt-2.5 mt-2 text-xs text-destructive whitespace-pre-wrap">
        <span className="text-muted-foreground">[SYS_LOG]</span> {syslog}
      </div>
    </div>
  );
}
