import * as React from "react";
import { cn } from "@/lib/utils";

const InputGroup = React.forwardRef(({ 
  className, 
  type = "text",
  leftIcon,
  rightIcon,
  leftElement,
  rightElement,
  ...props 
}, ref) => {
  return (
    <div className={cn(
      "flex items-center w-full rounded-[8px] border-[1.5px] border-[#1976D2] bg-white shadow-sm transition-all duration-200",
      "focus-within:ring-4 focus-within:ring-[rgba(25,118,210,0.15)] focus-within:border-[#1565C0]",
      "disabled:opacity-50",
      className
    )}>
      {/* Left Icon/Element */}
      {(leftIcon || leftElement) && (
        <div className="flex items-center justify-center pl-3 pr-2 shrink-0">
          {leftIcon && <span className="text-slate-400">{leftIcon}</span>}
          {leftElement}
        </div>
      )}
      
      {/* Input */}
      <input
        type={type}
        className={cn(
          "flex-1 bg-transparent py-2.5 text-base outline-none",
          "placeholder:text-slate-400",
          "disabled:cursor-not-allowed",
          "md:text-sm",
          !leftIcon && !leftElement && "pl-3",
          !rightIcon && !rightElement && "pr-3"
        )}
        ref={ref}
        {...props}
      />
      
      {/* Right Icon/Element */}
      {(rightIcon || rightElement) && (
        <div className="flex items-center justify-center pl-2 pr-3 shrink-0">
          {rightIcon && <span className="text-slate-400">{rightIcon}</span>}
          {rightElement}
        </div>
      )}
    </div>
  );
});
InputGroup.displayName = "InputGroup";

export { InputGroup };
