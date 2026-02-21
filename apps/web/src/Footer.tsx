import React from "react";

const APP_MENU_ITEMS = [
  { label: "Mosaico", href: "https://urbis.prefeitura.sp.gov.br" },
  { label: "Mapa", href: "https://mapa.urbis.prefeitura.sp.gov.br" },
  { label: "Viabiliza", href: "https://viabiliza.urbis.prefeitura.sp.gov.br", active: true },
  { label: "Dados Abertos", href: "https://dadosabertos.urbis.prefeitura.sp.gov.br" },
  { label: "Doc. técnica", href: "https://docs.urbis.prefeitura.sp.gov.br/" },
  { label: "Legis", href: "https://docs.urbis.prefeitura.sp.gov.br/docs/legis" },
];

function Footer(): JSX.Element {
  return (
    <footer
      className="fixed bottom-0 mx-auto w-full text-center py-4 px-6 z-[1000] border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
    >
      {window.innerWidth > 768 && (
        <div className="flex flex-wrap items-center gap-2">
          {APP_MENU_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`inline-flex items-center rounded-full border border-input h-8 px-4 text-sm transition-colors ${
                item.active
                  ? "bg-accent text-accent-foreground"
                  : "bg-transparent hover:bg-accent"
              }`}
            >
              {item.label}
            </a>
          ))}
          <div className="flex-grow"></div>
          <div className="text-sm text-muted-foreground">
            Versão: {`${import.meta.env.VITE_VERSION}`}
          </div>
        </div>
      )}
    </footer>
  );
}

export default Footer;
