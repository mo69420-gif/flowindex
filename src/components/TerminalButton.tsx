import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import React from 'react';

const terminalButtonVariants = cva(
  "block w-full bg-transparent font-display text-left cursor-pointer transition-colors duration-100 tracking-wide disabled:opacity-25 disabled:cursor-not-allowed disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "border border-border text-foreground text-[13px] px-3.5 py-2.5 hover:border-primary hover:text-primary hover:bg-primary/[0.04] active:bg-primary/10",
        back: "border border-muted-foreground text-muted-foreground text-xs px-3.5 py-2.5 mt-1 hover:border-foreground hover:text-foreground",
        danger: "border border-destructive/20 text-destructive/40 text-xs px-3.5 py-2.5 hover:border-destructive hover:text-destructive hover:bg-destructive/[0.05]",
        deploy: "border border-primary text-primary text-sm px-3.5 py-3.5 text-center tracking-[2px] mt-3 hover:bg-primary/[0.08]",
        confirm: "border border-primary text-primary text-[13px] px-3.5 py-2.5 text-center tracking-widest mt-2 hover:bg-primary/[0.08]",
        eliminate: "border border-destructive/20 text-destructive/50 text-xs px-3.5 py-2 mb-1 hover:border-destructive hover:text-destructive hover:bg-destructive/[0.05]",
        salvage: "border border-accent/20 text-accent/50 text-xs px-3.5 py-2 mb-1 hover:border-accent hover:text-accent hover:bg-accent/[0.05]",
        relocate: "border border-secondary/20 text-secondary/50 text-xs px-3.5 py-2 hover:border-secondary hover:text-secondary hover:bg-secondary/[0.05]",
        cleared: "border border-primary/20 text-primary/60 text-xs px-3.5 py-2.5 cursor-default pointer-events-none",
        locked: "border border-border/30 text-muted-foreground/30 text-xs px-3.5 py-2.5 cursor-not-allowed pointer-events-none",
        scan: "border border-primary text-primary text-[13px] px-3.5 py-3.5 text-center tracking-widest mt-3 hover:bg-primary/[0.08]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface TerminalButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof terminalButtonVariants> {}

const TerminalButton = React.forwardRef<HTMLButtonElement, TerminalButtonProps>(
  ({ className, variant, ...props }, ref) => (
    <button ref={ref} className={cn(terminalButtonVariants({ variant, className }))} {...props} />
  )
);
TerminalButton.displayName = 'TerminalButton';

export { TerminalButton, terminalButtonVariants };
