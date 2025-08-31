import * as React from "react";

export const FormErrorMessage = React.forwardRef<
  React.ComponentRef<"p">,
  React.ComponentPropsWithoutRef<"p">
>(({ className, ...props }, ref) => (
  <p ref={ref} className={`text-sm text-destructive ${className}`} {...props} />
));
FormErrorMessage.displayName = "FormErrorMessage";
