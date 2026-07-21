import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

class MissingRootError extends Error {
  constructor() {
    super("Doon renderer root element is missing.");
    this.name = "MissingRootError";
  }
}

const rootElement = document.getElementById("root");

if (!(rootElement instanceof HTMLElement)) {
  throw new MissingRootError();
}

createRoot(rootElement).render(<App />);
