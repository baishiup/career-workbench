import { Input, TextArea } from "@heroui/react";

import { cn } from "@/lib/utils";

const fieldClassName =
  "h-9 w-full rounded-lg border border-transparent bg-muted/60 px-3 text-sm font-medium text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-ring focus:bg-card focus:ring-3 focus:ring-ring/20";

const textareaClassName =
  "min-h-20 w-full rounded-lg border border-transparent bg-muted/60 px-3 py-2 text-sm font-medium leading-5 text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-ring focus:bg-card focus:ring-3 focus:ring-ring/20";

function TextField({
  className,
  label,
  onChange,
  required = false,
  value,
}: {
  className?: string;
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  value: string;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-sm font-semibold text-muted-foreground">
        {required ? <span className="text-destructive">*</span> : null} {label}
      </span>
      <Input
        fullWidth
        onChange={(event) => onChange(event.target.value)}
        value={value}
        variant="secondary"
      />
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
  return <TextField label={label} onChange={onChange} value={value} />;
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
      <span className="text-sm font-semibold text-muted-foreground">
        {label}
      </span>
      <TextArea
        fullWidth
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        value={value}
        variant="secondary"
      />
    </label>
  );
}

export {
  DateField,
  fieldClassName,
  TextAreaField,
  textareaClassName,
  TextField,
};
