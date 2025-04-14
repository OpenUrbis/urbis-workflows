import { useToast, UseToastOptions } from "@chakra-ui/react";

export const DEFAULT_SNACKBAR_PARAMS: UseToastOptions = {
  duration: 3000,
  position: "bottom",
};

export const useSnackbar = (
  configs: UseToastOptions = DEFAULT_SNACKBAR_PARAMS
) => {
  const toast = useToast();

  const onlyToast = (params: UseToastOptions) =>
    toast({ ...configs, ...params });

  return {
    success: (description: string) =>
      toast({ ...configs, title: "Sucesso!", description, status: "success" }),
    error: (description: string) =>
      onlyToast({
        status: "error",
        title: "Parece que algo esta errado",
        description,
      }),
    info: (description: string) =>
      onlyToast({
        status: "info",
        title: "Informativo",
        description,
      }),
    warning: (description: string) =>
      onlyToast({
        status: "warning",
        title: "Alerta!",
        description,
      }),
    invalidForm: () =>
      onlyToast({
        status: "error",
        title: "Parece que algo não esta certo",
        description: "Verifique o formulário",
      }),
    unexpectedError: () =>
      onlyToast({
        status: "error",
        title: "Algo deu errado",
        description: "Um erro inesperado aconteceu, contate o suporte",
      }),
    onlyToast,
  };
};
