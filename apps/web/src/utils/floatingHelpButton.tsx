import React from "react";
import { useNavigate } from "react-router-dom";

function FloatingHelpButton() {
  const handleClick = () => {
    window.open("https://urbis.sampa.br/pt/ajuda", "_blank");
  };

  return (
    <button
      onClick={handleClick}
      style={{
        position: "fixed",
        bottom: 20,
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
      }}
      aria-label="Ajuda"
      title="Ajuda"
    >
      ?
    </button>
  );
}