import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "./input";

export interface InputWithAdornmentProps extends React.InputHTMLAttributes<HTMLInputElement> {
  adornment: React.ReactNode;
  adornmentPosition?: "left" | "right";
}

const InputWithAdornment = React.forwardRef<HTMLInputElement, InputWithAdornmentProps>(
  ({ className, adornment, adornmentPosition = "right", ...props }, ref) => {
    return (
      <div className="relative">
        <Input
          className={cn(
            adornmentPosition === "right" ? "pr-12" : "pl-12",
            className
          )}
          ref={ref}
          {...props}
        />
        <div className={cn(
          "absolute inset-y-0 flex items-center text-muted-foreground font-medium text-sm",
          adornmentPosition === "right" ? "right-0 pr-3" : "left-0 pl-3"
        )}>
          {adornment}
        </div>
      </div>
    );
  }
);
InputWithAdornment.displayName = "InputWithAdornment";

export { InputWithAdornment }; 