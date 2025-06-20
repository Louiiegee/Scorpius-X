/**
 * Mock Service Worker browser setup
 * Enables API mocking in development and testing
 */

import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

// This configures a Service Worker with the given request handlers.
export const worker = setupWorker(...handlers);

// Start the worker conditionally
export const enableMocking = async () => {
  if (typeof window === "undefined") {
    return;
  }

  const { worker } = await import("./browser");

  // Start the worker with custom options
  await worker.start({
    onUnhandledRequest: "warn",
    serviceWorker: {
      // Use a custom service worker script location if needed
      url: "/mockServiceWorker.js",
    },
  });

  console.log("🎭 Mock Service Worker enabled");
};
