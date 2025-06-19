import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { config, logger } from "@/config/env";

// Initialize application
async function initializeApp() {
  try {
    logger.info("🚀 Initializing Scorpius Cybersecurity Dashboard");
    logger.info(`Environment: ${config.app.environment}`);
    logger.info(`Version: ${config.app.version}`);

    // Enable mocking in development if configured
    if (config.features.mockMode) {
      logger.info("🎭 Mock mode enabled, starting MSW...");
      const { enableMocking } = await import("./mocks/browser");
      await enableMocking();
    }

    // Mount React application
    ReactDOM.createRoot(document.getElementById("root")!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );

    logger.info("✅ Application initialized successfully");
  } catch (error) {
    logger.error("❌ Failed to initialize application:", error);

    // Show error to user
    document.body.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background: #000;
        color: #fff;
        font-family: monospace;
        text-align: center;
        padding: 20px;
      ">
        <div>
          <h1 style="color: #ff4444; margin-bottom: 20px;">
            🚨 Application Failed to Start
          </h1>
          <p style="color: #ccc; margin-bottom: 20px;">
            ${error instanceof Error ? error.message : "Unknown error occurred"}
          </p>
          <button 
            onclick="window.location.reload()"
            style="
              background: #00ffff;
              color: #000;
              border: none;
              padding: 10px 20px;
              border-radius: 5px;
              cursor: pointer;
              font-family: monospace;
            "
          >
            Reload Application
          </button>
        </div>
      </div>
    `;
  }
}

// Start the application
initializeApp();
