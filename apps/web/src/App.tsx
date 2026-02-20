import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import "./App.css";
import Footer from "./Footer";
import Header from "./Header";
import RouteDefinitions from "./RouteDefinitions";
import PromptModal from "./components/Prompt";
import ConfirmModal from "./components/Confirm";
import { AuthProvider } from "./reducers/auth.reducer";
import { HotkeyProvider } from "./reducers/hotkeys.reducer";
import { StyleProvider } from "./reducers/style.reducer";
import { PermissionProvider } from "./reducers/permission.context";
import UserIamSyncProvider from "./components/UserIamSyncProvider";

export default function App() {
  const shouldDisplayHeaderFooter =
    !window.location.href.includes("-print") &&
    !window.location.href.includes("-validate");

  return (
    <AuthProvider>
      <Router>
        <StyleProvider>
          <PermissionProvider>
            <UserIamSyncProvider />
            <PromptModal />
            <ConfirmModal />
            <HotkeyProvider>
              <Layout shouldDisplayHeaderFooter={shouldDisplayHeaderFooter}>
                <RouteDefinitions />
              </Layout>
            </HotkeyProvider>
          </PermissionProvider>
        </StyleProvider>
      </Router>
    </AuthProvider>
  );
}

function Layout({
  shouldDisplayHeaderFooter,
  children,
}: {
  shouldDisplayHeaderFooter: boolean;
  children: React.ReactNode;
}) {
  return (
    <div id="application">
      {shouldDisplayHeaderFooter && <Header />}
      {children}
      {shouldDisplayHeaderFooter && <Footer />}
    </div>
  );
}