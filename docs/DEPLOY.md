## Documentation: Deployment Setup

![Capa do Repositório](cover.svg)

This document outlines the steps to configure the deployment of this application using CI/CD pipelines. The remaining details are available in the infrastructure code repository at github.com/OpenUrbis/urbis-infra. Note that the deployment process described in this pipeline is designed to work in conjunction with the infrastructure code, and it only makes sense when used together with that repository.

### 1. Adding Secrets to the GitHub Repository

To enable the pipeline, you must configure secrets in your GitHub repository. These secrets store sensitive information, such as credentials, that the pipeline uses to interact with external services.

- Navigate to your repository on GitHub.
- Go to **Settings** > **Secrets and Variables** > **Actions**.
- Add the following secrets:

| Secret Name                   | Description                               |
| ----------------------------- | ----------------------------------------- |
| `DOCKER_USERNAME`             | Your Docker Hub username                  |
| `DOCKER_PASSWORD`             | Your Docker Hub password or access token  |
| `AZURE_CLIENT_ID`             | Azure service principal client ID         |
| `AZURE_TENANT_ID`             | Azure tenant ID                           |
| `AZURE_SUBSCRIPTION_ID`       | Azure subscription ID                     |
| `AZURE_RESOURCE_GROUP`        | Name of the Azure AKS resource group      |
| `AZURE_CLUSTER_NAME`          | Name of the AKS cluster                   |
| `K8S_DEPLOYMENT_NAME_PROD`    | Kubernetes deployment name for production |
| `K8S_DEPLOYMENT_NAME_STAGING` | Kubernetes deployment name for staging    |

These secrets are used to authenticate with Docker Hub and Azure AKS during pipeline execution.

---

### 2. Configuring Environment Variables

The pipeline relies on environment variables to pass non-sensitive information. For example:

- `APP_VERSION`: Automatically set based on the branch or tag name (e.g., the last part of `cicd/feature-x` becomes `feature-x`, or the tag name for releases).
- `ENVIRONMENT`: Automatically set to `staging` for pushes to `cicd/*` branches or when `staging` is in the reference name; otherwise, set to `production` for release tags without `staging`.

If your application requires additional variables:

- Add them as repository variables under **Settings** > **Secrets and Variables** > **Actions** > **Variables**.

Review your project’s requirements and configure any necessary variables accordingly.

---

### 3. Setting Up Docker Hub

The pipeline pushes Docker images to Docker Hub. To set this up:

- Create a Docker Hub account if you don’t already have one.
- Create a repository named `codatasp/app` (or modify the pipeline configuration if you prefer a different repository name).
- Ensure the repository exists before running the pipeline.

The `DOCKER_USERNAME` and `DOCKER_PASSWORD` secrets will be used for authentication.

---

### 4. Configuring Azure AKS

The pipeline deploys to an Azure Kubernetes Service (AKS) cluster. To prepare:

- Ensure you have an operational AKS cluster set up in Azure.
- Verify that the service principal (defined by `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, and `AZURE_SUBSCRIPTION_ID`) has the necessary permissions to access the cluster.
- Confirm that the resource group (`AZURE_RESOURCE_GROUP`) and cluster name (`AZURE_CLUSTER_NAME`) match your Azure configuration.

The pipeline uses actions like `azure/login` and `azure/aks-set-context` to authenticate and set the `kubectl` context.

---

### 5. Customizing the Pipeline

You may need to tweak the pipeline based on your project’s specifics:

- **Docker Image Build**:
  - Ensure the `Dockerfile` at the repository’s root accepts the `APP_VERSION` argument and builds your application correctly.
  - The Docker image will be tagged as `codatasp/app:staging` for staging environments or `codatasp/app:latest` for production, based on the `ENVIRONMENT` variable.
- **Kubernetes Deployment**:
  - Update the deployment names (`K8S_DEPLOYMENT_NAME_PROD` and `K8S_DEPLOYMENT_NAME_STAGING`) if they differ from the defaults.
  - The pipeline restarts the appropriate deployment (`$K8S_DEPLOYMENT_NAME_STAGING` for staging, `$K8S_DEPLOYMENT_NAME_PROD` for production) based on the `ENVIRONMENT` variable.

A `Dockerfile` must be present at the repository root for the pipeline to function.

---

### 6. Triggering the Pipeline

The pipeline runs automatically in two scenarios:

- **Push to branches matching `cicd/*`**: Triggered when code is pushed to branches like `cicd/feature-x`, deploying to the staging environment by default.
- **Release publication**: Triggered when a release is created on GitHub. Deploys to production if the tag doesn’t contain `staging`; otherwise, deploys to staging.

Ensure your branches and tags align with these triggers. For example:

- Push to `cicd/my-feature` → Staging deployment
- Release with tag `v1.0.0` → Production deployment
- Release with tag `staging/v1.0.0` → Staging deployment
