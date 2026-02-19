import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type SettingRowProps = {
  label: string;
  description: string;
  htmlFor?: string;
  control: React.ReactNode;
  className?: string;
};

export function SettingRow({ label, description, htmlFor, control, className }: SettingRowProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-border/80 bg-background/70 p-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="space-y-1 sm:max-w-[65%]">
        {htmlFor ? (
          <Label htmlFor={htmlFor} className="text-sm font-medium">
            {label}
          </Label>
        ) : (
          <p className="text-sm font-medium">{label}</p>
        )}

        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="w-full sm:w-auto sm:min-w-[220px]">{control}</div>
    </div>
  );
}
