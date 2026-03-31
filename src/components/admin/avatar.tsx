import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  firstName?: string;
  lastName?: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
};

export function Avatar({
  src,
  firstName,
  lastName,
  size = "md",
  className,
}: AvatarProps) {
  const initials = getInitials(firstName, lastName);

  if (src) {
    return (
      <img
        src={src}
        alt={`${firstName || ""} ${lastName || ""}`}
        className={cn(
          "rounded-full object-cover flex-shrink-0",
          sizeClasses[size],
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold flex-shrink-0",
        sizeClasses[size],
        className,
      )}
    >
      {initials}
    </div>
  );
}
