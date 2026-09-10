import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { CalendarApp } from "./components/calendar/CalendarApp";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CalendarApp />
  </StrictMode>,
);
