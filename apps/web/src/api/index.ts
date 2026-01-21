import { CodeModulesApiClient } from "./clients/code-modules.client";
import { ConstantVariablesApiClient } from "./clients/constant-variables.client";
import { DatasetsApiClient } from "./clients/datasets.client";
import { FormsApiClient } from "./clients/forms.client";
import { IntegrationsApiClient } from "./clients/integrations.client";
import { UsersApiClient } from "./clients/users.client";
import { WorkflowsApiClient } from "./clients/workflows.client";
import { WorkflowsSchemaApiClient } from "./clients/workflows-schema.client";
import { IamApiClient } from "./clients/iam.client";
import { BaseApiClient } from "./clients/base-api.client";

export interface ApiConfig {
  baseURL: string;
  headers?: Record<string, string>;
}

export class ApiClient {
  public codeModules: CodeModulesApiClient;
  public constantVariables: ConstantVariablesApiClient;
  public datasets: DatasetsApiClient;
  public forms: FormsApiClient;
  public integrations: IntegrationsApiClient;
  public users: UsersApiClient;
  public workflowsSchema: WorkflowsSchemaApiClient;
  public workflows: WorkflowsApiClient;
  public iam: IamApiClient;

  private clients: BaseApiClient[] = [];

  constructor(config: ApiConfig) {
    this.codeModules = new CodeModulesApiClient(config);
    this.constantVariables = new ConstantVariablesApiClient(config);
    this.datasets = new DatasetsApiClient(config);
    this.forms = new FormsApiClient(config);
    this.integrations = new IntegrationsApiClient(config);
    this.users = new UsersApiClient(config);
    this.workflowsSchema = new WorkflowsSchemaApiClient(config);
    this.workflows = new WorkflowsApiClient(config);
    this.iam = new IamApiClient(config);

    // Add all clients that extend BaseApiClient to the clients array for cleanup
    this.registerClient(this.workflows);
    // Add other clients that extend BaseApiClient as they are implemented
  }

  /**
   * Register a client that extends BaseApiClient for cleanup
   * @param client The client to register
   */
  private registerClient(client: BaseApiClient): void {
    this.clients.push(client);
  }

  /**
   * Disconnect all API clients, cleaning up any listeners
   * This should be called when the app unmounts or when clients are no longer needed
   */
  public disconnect(): void {
    // Call disconnect on all registered clients
    this.clients.forEach((client) => {
      if (typeof client.disconnect === "function") {
        client.disconnect();
      }
    });

    // Clear the clients array
    this.clients = [];
  }
}

export * from "./clients/code-modules.client";
export * from "./clients/constant-variables.client";
export * from "./clients/datasets.client";
export * from "./clients/forms.client";
export * from "./clients/integrations.client";
export * from "./clients/users.client";
export * from "./clients/workflows-schema.client";
export * from "./clients/workflows.client";
export * from "./clients/base-api.client";
