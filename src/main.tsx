import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { setupGlobalErrorHandlers } from "./lib/globalErrorHandler";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Set up global error handlers before app renders
setupGlobalErrorHandlers();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
