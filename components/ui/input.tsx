import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium"
            style={{ color: "#3D2030" }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "block w-full rounded-xl border px-3.5 py-2.5 text-sm transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent",
            "placeholder:text-[#B8A4AC]",
            error
              ? "border-red-300 bg-red-50 text-red-900"
              : "border-[#EDD5DF] bg-white text-[#1A0D12] hover:border-primary-300",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
