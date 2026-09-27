import "@fontsource/ibm-plex-sans/latin-400.css";
import "@fontsource/ibm-plex-sans/latin-500.css";
import "@fontsource/ibm-plex-sans/latin-600.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "./styles/base.css";
import "./styles/sky.css";
import "./styles/sky-mobile.css";
import "./styles/detail.css";
import "./styles/forms.css";
import "./styles/responsive.css";
import "./styles/account.css";
import { copy } from "@ground-control/copy";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";

document.title = copy.brand;
const root = document.getElementById("root");
if (root) createRoot(root).render(<App />);
