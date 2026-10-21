import { createRoot } from "react-dom/client";
import PortalApp from "@civicalert/ui/PortalApp";
import "@civicalert/ui/styles.css";

createRoot(document.getElementById("root")!).render(<PortalApp initialPortal="resident" />);

