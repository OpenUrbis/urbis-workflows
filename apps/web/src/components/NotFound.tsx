import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { StyleContext } from "../reducers";

export const NotFound: React.FC = () => {
  const styleContext = useContext(StyleContext);

  // Determine if in high contrast mode
  const isHighContrast = styleContext.state.buttonHoverColorWeight === "800";

  // Determine colors based on the style context - using purple/violet palette
  const accentColor = isHighContrast
    ? "rgb(124, 58, 237)" // violet-600 for HC mode
    : "rgb(139, 92, 246)"; // violet-500 for normal mode

  // Use same color palette for all elements
  const textLargeColor = accentColor;
  const textColor = styleContext.state.textColor;
  const secondaryTextColor = isHighContrast
    ? "rgba(229, 231, 235, 0.9)" // gray-200 with high opacity for HC
    : "rgba(75, 85, 99, 0.8)"; // gray-600 for normal mode

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-6 py-12 text-center">
      <div className="w-full max-w-md mx-auto">
        {/* Visual element - stylized 404 */}
        <div className="relative mb-8">
          <h1
            className={`text-9xl font-extrabold tracking-tight ${isHighContrast ? "opacity-30" : "opacity-15"}`}
            style={{ color: textLargeColor }}
          >
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="w-24 h-24"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              style={{ color: accentColor }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={isHighContrast ? 2 : 1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        <h2 className="text-3xl font-bold mb-4" style={{ color: textColor }}>
          Página não encontrada
        </h2>

        <p className="text-lg mb-8" style={{ color: secondaryTextColor }}>
          A página que você está procurando não existe ou você não tem permissão
          para acessá-la.
        </p>

        <div className="flex justify-center space-x-4">
          <Link
            to="/"
            className={`px-6 py-3 rounded-lg text-white font-medium transition-all duration-200 hover:shadow-lg flex items-center ${isHighContrast ? "hover:brightness-110" : "hover:brightness-95"}`}
            style={{
              backgroundColor: accentColor,
            }}
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={isHighContrast ? 2.5 : 2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    </div>
  );
};
