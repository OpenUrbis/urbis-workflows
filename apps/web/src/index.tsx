import "reflect-metadata";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import 'leaflet/dist/leaflet.css'

const root: ReactDOM.Root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
