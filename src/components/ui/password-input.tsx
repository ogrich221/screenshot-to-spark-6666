import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Password/PIN field with a show/hide eye toggle. */
export const PasswordInput = React.forwardRef<HTMLInputElement, Omit<React.ComponentProps<"input">, "type">>(
  ({ className = "", ...props }, ref) => {
    const [show, setShow] = React.useState(false);
    const margin = className.match(/\bm[tby]-\S+/g)?.join(" ") ?? "";
    return (
      <div className={cn("relative", margin)}>
        <Input ref={ref} type={show ? "text" : "password"} className={cn(className.replace(/\bm[tby]-\S+/g, ""), "pr-12")} {...props} />
        <button type="button" onClick={() => setShow(s => !s)} aria-label={show ? "Hide" : "Show"} aria-pressed={show}
          className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted-foreground transition hover:text-primary">
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";
