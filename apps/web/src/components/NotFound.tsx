import React from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, CardContent } from "@open-urbis/map-ui";
import { FaExclamationTriangle, FaHome } from "react-icons/fa";

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <Card className="w-full max-w-xl border-muted/80">
        <CardContent className="p-8 sm:p-10 text-center">
          <div className="relative mb-6">
            <p className="text-7xl sm:text-8xl font-black tracking-tight text-muted/40">
              404
            </p>
            <div className="absolute inset-0 flex items-center justify-center">
              <FaExclamationTriangle className="h-12 w-12 text-muted-foreground" />
            </div>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-3">
            Página não encontrada
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground mb-8">
            A página que você está procurando não existe ou você não tem
            permissão para acessá-la.
          </p>

          <div className="flex justify-center">
            <Button
              type="button"
              size="sm"
              className="h-10 px-5 rounded-lg"
              onClick={() => navigate("/")}
            >
              <FaHome className="h-4 w-4 mr-2" />
              Voltar para a página inicial
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
