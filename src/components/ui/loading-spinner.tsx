
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps extends React.HTMLAttributes<divElement> {
  size?: number;
}

export function LoadingSpinner({ className, size = 32, ...props }: LoadingSpinnerProps) {
  return (
    <div className={cn("flex h-full w-full items-center justify-center p-4", className)} {...props}>
      <Loader2 className="animate-spin text-primary" size={size} />
    </div>
  );
}
