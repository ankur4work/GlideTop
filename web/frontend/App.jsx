import { BrowserRouter } from "react-router-dom";
import { NavigationMenu } from "@shopify/app-bridge-react";

import Routes from "./Routes";
import { AppBridgeProvider, PolarisProvider, QueryProvider } from "./components";

import "./assets/glidetop.css";

export default function App() {
  // Any .jsx file in /pages becomes a route. See Routes.jsx.
  const pages = import.meta.globEager("./pages/**/!(*.test.[jt]sx)*.([jt]sx)");

  return (
    <PolarisProvider>
      <BrowserRouter>
        <AppBridgeProvider>
          <QueryProvider>
            <NavigationMenu
              navigationLinks={[
                { label: "Plans", destination: "/pricing" },
                { label: "Setup guide", destination: "/setup" },
                { label: "Support", destination: "/support" },
              ]}
            />
            <Routes pages={pages} />
          </QueryProvider>
        </AppBridgeProvider>
      </BrowserRouter>
    </PolarisProvider>
  );
}
