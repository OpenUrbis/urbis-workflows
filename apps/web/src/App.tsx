import React from "react";
import { BrowserRouter as Router, useNavigate } from "react-router-dom";
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

// Botão flutuante componente separado, para reutilizar se quiser
function FloatingHelpButton() {
  return (
    <a
      href="https://urbis.sampa.br/pt/ajuda"
      target="_blank"
      rel="noopener noreferrer"
      style={{
        position: "fixed",
        bottom: 50,        
        left: 20,
        width: 50,
        height: 50,
        borderRadius: "50%",
        backgroundColor: "#007bff",
        color: "white",
        fontSize: 24,
        border: "none",
        cursor: "pointer",
        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textDecoration: "none",
        userSelect: "none",
      }}
      aria-label="Ajuda"
      title="Ajuda"
    >
      ?
    </a>
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
      <FloatingHelpButton />
    </div>
  );
}