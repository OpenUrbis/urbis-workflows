import { ApiClient } from "../api";
import {
  CodeModule,
  ConstantVariable,
  ActivityTemplate,
  ActivityTypeEnum,
  SignatureConfig,
} from "../api/types/schema";

type ToastOptions = {
  status?: "success" | "error" | "info" | "warning";
  title?: string;
  description?: string;
  duration?: number;
  position?: string;
};

type SnackbarInstance = {
  success: (description: string) => void;
  error: (description: string) => void;
  info: (description: string) => void;
  warning: (description: string) => void;
  invalidForm: () => void;
  unexpectedError: () => void;
  onlyToast: (params: ToastOptions) => void;
};

export const loadCodeModules = async (
  codeModules: CodeModule[],
  apiClient: ApiClient,
  snackbar?: SnackbarInstance
): Promise<{ [key: string]: any }> => {
  try {
    const modulesByNamespace: { [key: string]: any } = {};

    for (const module of codeModules) {
      const namespace = module.namespace || "global";
      const paths = namespace.split("/");

      let currentLevel = modulesByNamespace;

      // Create nested objects for each path segment
      for (let i = 0; i < paths.length - 1; i++) {
        const path = paths[i];
        if (!currentLevel[path]) {
          currentLevel[path] = {};
        }
        currentLevel = currentLevel[path];
      }

      // Use the last path segment to store the functions
      const lastPath = paths[paths.length - 1];
      if (!currentLevel[lastPath]) {
        currentLevel[lastPath] = {};
      }

      if (module.sourceEntityId) {
        // For imported modules, fetch the full data
        try {
          let response;

          if (typeof module.sourceEntityId === "string") {
            response = await apiClient.codeModules.findOne(
              module.sourceEntityId
            );
          } else {
            response = await apiClient.codeModules.findOneVersion(
              module.sourceEntityId.id,
              module.sourceEntityId.version
            );
          }
          if (response) {
            // Compile the code and extract functions
            const functions = await compileModuleCode(response.code);
            Object.assign(currentLevel[lastPath], functions);
          }
        } catch (error) {
          console.error(`Error fetching module ${module.label}:`, error);
        }
      } else {
        // For local modules, use the code directly
        const functions = await compileModuleCode(module.code || "");
        Object.assign(currentLevel[lastPath], functions);
      }
    }

    return modulesByNamespace;
  } catch (error) {
    console.error("Error loading code modules:", error);
    snackbar?.error("Failed to load code modules");
    return {};
  }
};

export const loadConstantVariables = async (
  constants: ConstantVariable[],
  apiClient: ApiClient,
  snackbar?: SnackbarInstance
): Promise<{ [key: string]: any }> => {
  try {
    const variablesByNamespace: { [key: string]: any } = {};

    for (const constant of constants) {
      const namespace = constant.namespace || "global";
      const paths = namespace.split("/");

      let currentLevel = variablesByNamespace;

      // Create nested objects for each path segment
      for (let i = 0; i < paths.length - 1; i++) {
        const path = paths[i];
        if (!currentLevel[path]) {
          currentLevel[path] = {};
        }
        currentLevel = currentLevel[path];
      }

      // Use the last path segment to store the value
      const lastPath = paths[paths.length - 1];
      if (!currentLevel[lastPath]) {
        currentLevel[lastPath] = {};
      }

      if (constant.sourceEntityId) {
        // For imported constants, fetch the full data
        try {
          let response;

          if (typeof constant.sourceEntityId === "string") {
            response = await apiClient.constantVariables.findOne(
              constant.sourceEntityId
            );
          } else {
            response = await apiClient.constantVariables.findOneVersion(
              constant.sourceEntityId.id,
              constant.sourceEntityId.version
            );
          }

          if (response) {
            currentLevel[lastPath] = response.value;
          }
        } catch (error) {
          console.error(`Error fetching constant ${constant.label}:`, error);
        }
      } else {
        // For local constants, use the value directly
        currentLevel[lastPath] = constant.value;
      }
    }

    return variablesByNamespace;
  } catch (error) {
    console.error("Error loading constant variables:", error);
    snackbar?.error("Failed to load constant variables");
    return {};
  }
};

const compileModuleCode = async (
  code: string
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
): Promise<{ [key: string]: Function }> => {
  try {
    // Create a temporary scope to evaluate the code
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    const scope: { [key: string]: Function } = {};

    // Use Babel to parse and transform the code
    // First, wrap the code in a module pattern to isolate it
    const wrappedCode = `
      (function() {
        ${code}
        return {
          ${extractFunctionNames(code).join(",")}
        };
      })()
    `;

    try {
      // Use Babel to transform the code (similar to expressions.ts)
      const transformedCode = (window as any).Babel.transform(wrappedCode, {
        presets: ["env"],
      }).code;

      // Remove 'use strict' and evaluate the transformed code
      const cleanCode = transformedCode.replace('"use strict";', "").trim();

      // eslint-disable-next-line no-new-func
      const moduleExports = new Function(`return ${cleanCode}`)();

      // Add all exported functions to our scope
      for (const [funcName, funcImpl] of Object.entries(moduleExports)) {
        if (typeof funcImpl === "function") {
          scope[funcName] = funcImpl;
        }
      }
    } catch (babelError) {
      console.warn("Babel transformation error:", wrappedCode, babelError);
    }

    return scope;
  } catch (error) {
    console.error("Error compiling module code:", error);
    return {};
  }
};

// Helper function to extract function names from code
function extractFunctionNames(code: string): string[] {
  const functionNames: string[] = [];
  const regex = /function\s+(\w+)\s*\(/g;
  let match;

  while ((match = regex.exec(code)) !== null) {
    functionNames.push(match[1]);
  }

  return functionNames;
}

export const loadSignatureMetadata = (
  activities: ActivityTemplate[]
): { [key: string]: Omit<SignatureConfig, "form" | "sourceEntityId"> } => {
  try {
    const signatureMetadata: {
      [key: string]: Omit<SignatureConfig, "form" | "sourceEntityId">;
    } = {};

    // Filter activities to get only signature type activities
    const signatureActivities = activities.filter(
      (activity) => activity.type === ActivityTypeEnum.SIGNATURE
    );

    for (const activity of signatureActivities) {
      // Cast template to SignatureConfig since we know it's a signature activity
      const template = activity.template as { signatures: SignatureConfig[] };

      // Process each signature config in the activity
      if (template && template.signatures) {
        for (const signature of template.signatures) {
          // Create metadata object excluding form and sourceEntityId
          const { form, sourceEntityId, ...metadata } = signature;
          signatureMetadata[signature.id] = metadata;
        }
      }
    }

    return signatureMetadata;
  } catch (error) {
    console.log("Error fetching signature metadata:", error);
    return {};
  }
};
