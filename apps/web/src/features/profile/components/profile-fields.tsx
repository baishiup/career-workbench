import { CalendarDays } from "lucide-react";

import type { ProfileIcon } from "@/features/profile/types";
import { cn } from "@/lib/utils";

const fieldClassName =
  "h-9 w-full rounded-lg border border-transparent bg-muted/60 px-3 text-sm font-medium outline-none transition placeholder:text-muted-foreground/70 focus:border-ring focus:bg-card focus:ring-3 focus:ring-ring/20";

const textareaClassName =
  "min-h-20 w-full rounded-lg border border-transparent bg-muted/60 px-3 py-2 text-sm font-medium leading-5 outline-none transition placeholder:text-muted-foreground/70 focus:border-ring focus:bg-card focus:ring-3 focus:ring-ring/20";

function TextField({
  className,
  icon: Icon,
  label,
  onChange,
  required = false,
  value,
}: {
  className?: string;
  icon?: ProfileIcon;
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  value: string;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-sm font-semibold">
        {required ? <span className="text-destructive">*</span> : null} {label}
      </span>
      <div className="relative">
        {Icon ? (
          <Icon
            aria-hidden="true"
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
        ) : null}
        <input
          className={cn(fieldClassName, Icon ? "pl-9" : "")}
          onChange={(event) => onChange(event.target.value)}
          value={value}
        />
      </div>
    </label>
  );
}

function DateField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <TextField
      icon={CalendarDays}
      label={label}
      onChange={onChange}
      value={value}
    />
  );
}

function TextAreaField({
  className,
  label,
  onChange,
  value,
}: {
  className?: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-sm font-semibold">{label}</span>
      <textarea
        className={textareaClassName}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

export { DateField, fieldClassName, TextAreaField, textareaClassName, TextField };
