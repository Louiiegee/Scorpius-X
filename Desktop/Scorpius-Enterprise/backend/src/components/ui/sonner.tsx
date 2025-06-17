import { Toaster as SonnerPrimitive } from "sonner";

const Toaster = ({ ...props }: React.ComponentProps<typeof SonnerPrimitive>) => {
  // Theme is usually picked up by sonner from the html class (light/dark)
  // or can be explicitly passed if needed, but our ThemeProvider handles the root class.
  return (
    <SonnerPrimitive
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-card-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          // Ensure proper styling for different toast types
          success: 'group-[.toaster]:bg-green-500 group-[.toaster]:text-white',
          error: 'group-[.toaster]:bg-red-500 group-[.toaster]:text-white',
          info: 'group-[.toaster]:bg-blue-500 group-[.toaster]:text-white',
          warning: 'group-[.toaster]:bg-yellow-500 group-[.toaster]:text-black',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
