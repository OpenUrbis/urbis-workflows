import { dispatchSnackbarEvent } from "../components/SnackbarHost";

type SnackbarStatus = "success" | "error" | "info" | "warning";

export type SnackbarConfigs = {
  duration?: number;
};

export const DEFAULT_SNACKBAR_PARAMS: SnackbarConfigs = {
  duration: 3000,
};

type OnlyToastParams = {
  status?: SnackbarStatus;
  title?: string;
  description?: string;
  duration?: number;
};

export const useSnackbar = (configs: SnackbarConfigs = DEFAULT_SNACKBAR_PARAMS) => {
  const onlyToast = (params: OnlyToastParams) => {
    const status = params.status ?? "info";
    dispatchSnackbarEvent({
      status,
      title: params.title,
      description: params.description,
      duration: params.duration ?? configs.duration,
    });
  };

  return {
    success: (description: string) =>
      onlyToast({
        status: "success",
        title: "Sucesso!",
        description,
      }),
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
