import { useContext, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import MapCallback from "./MapCallback";
import {
  ContestUser,
  Datasets,
  DocumentValidate,
  Environments,
  FormsPreset,
  IAM,
  MyProtocols,
  AllWorkflows,
  Profile,
  Workflows,
  Secrets,
  SignUpEditor,
  WorkflowSchemaEditor,
  WorkflowsSchema,
} from "./modules";
import { ProtocolPrint } from "./modules/workflows-schema/printers/ProtocolPrint";
import { TaxPrint } from "./modules/workflows-schema/printers/TaxPrint";
import { Apostille } from "./modules/workflows/Apostille";
import { ApostilleOfficial } from "./modules/workflows/ApostilleOfficial";
import { MyAcceptances } from "./modules/workflows/MyAcceptances";
import { ProtocolValidate } from "./modules/workflows/ProtocolValidate";
import {
  AuthContext,
  DefaultRouteContext,
  PrivateWrapper,
  PublicWrapper,
  PublicOrPrivateWrapper,
} from "./reducers/auth.reducer";
import { PlatePrint } from "./modules/workflows-schema/printers/PlatePrint";
import { DocumentPrint } from "./modules/workflows-schema/printers/DocumentPrint";
import { DocumentCustomPrint } from "./modules/workflows-schema/printers/DocumentCustomPrint";
import { Modules } from "./modules/workflows-schema/Modules";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { NotFound } from "./components/NotFound";
import { IamError } from "./components/IamError";
import DocumentCertificateEditor from "./modules/workflows-schema/activities/documents/DocumentCertificateEditor";


const DefaultRoute = () => {
  const defaultRoute = useContext(DefaultRouteContext);
  return <Navigate to={defaultRoute} />;
};

const OidcCallbackRoute = () => {
  const { isLoading } = useContext(AuthContext);

  if (isLoading) return null;

  return <Navigate to="/workflows-schema" replace />;
};

const ACCOUNTS_URL = import.meta.env.VITE_ACCOUNTS_URL || "http://localhost:4200";

const AccountsProfileRedirect = () => {
  useEffect(() => {
    window.location.href = `${ACCOUNTS_URL}/profile`;
  }, []);

  return null;
};

const RouteDefinitions = () => (
  <Routes>
    {/* Public routes */}
    <Route
      path="/contest-user"
      element={
        <PublicWrapper>
          <ContestUser />
        </PublicWrapper>
      }
    />
    <Route
      path="/workflows/:id/validate"
      element={
        <PublicWrapper>
          <ProtocolValidate></ProtocolValidate>
        </PublicWrapper>
      }
    />
    <Route
      path="/workflows/:id/print"
      element={
        <PublicWrapper>
          <ProtocolPrint />
        </PublicWrapper>
      }
    />
    <Route
      path="/workflows/:id/plate-print/:plateId"
      element={
        <PublicWrapper>
          <PlatePrint />
        </PublicWrapper>
      }
    />
    <Route
      path="/workflows/:id/document-print/:documentId"
      element={
        <PublicWrapper>
          <DocumentPrint />
        </PublicWrapper>
      }
    />
    <Route
      path="/workflows/:id/custom-print/:documentId"
      element={
        <PublicWrapper>
          <DocumentCustomPrint />
        </PublicWrapper>
      }
    />
    <Route
      path="/workflows/:id/tax-print/:taxId"
      element={
        <PublicWrapper>
          <TaxPrint />
        </PublicWrapper>
      }
    />
    <Route
      path="/document-validate"
      element={
        <PublicWrapper>
          <DocumentValidate />
        </PublicWrapper>
      }
    />
    <Route
        path="/debug/document-certificado"
        element={<DocumentCertificateEditor />}
      />
    <Route
      path="/map-callback"
      element={
        <PublicWrapper>
          <MapCallback />
        </PublicWrapper>
      }
    />
    <Route path="/callback" element={<OidcCallbackRoute />} />
    <Route path="/not-found" element={<NotFound />} />

    {/* IAM Error route */}
    <Route
      path="/iam-error"
      element={
        <PrivateWrapper>
          <IamError />
        </PrivateWrapper>
      }
    />

    {/* Protected routes with specific permissions */}
    {/* IAM routes */}
    <Route
      element={
        <ProtectedRoute requiredPermission="iam:permissions:read:findAll" />
      }
    >
      <Route
        path="/iam"
        element={
          <PrivateWrapper>
            <IAM />
          </PrivateWrapper>
        }
      />
    </Route>

    {/* Workflow Schema routes - public landing page */}
    <Route
      path="/workflows-schema"
      element={
        <PublicOrPrivateWrapper>
          <WorkflowsSchema />
        </PublicOrPrivateWrapper>
      }
    />

    <Route
      element={
        <ProtectedRoute requiredPermission="workflow-schema:read:findOne" />
      }
    >
      <Route
        path="/workflows-schema/:id"
        element={
          <PrivateWrapper>
            <WorkflowSchemaEditor />
          </PrivateWrapper>
        }
      />
    </Route>

    {/* Workflow routes */}
    <Route element={<ProtectedRoute />}>
      <Route
        path="/workflows"
        element={
          <PrivateWrapper>
            <MyProtocols />
          </PrivateWrapper>
        }
      />
    </Route>

    <Route
      element={<ProtectedRoute requiredPermission="workflow:read:findAll" />}
    >
      <Route
        path="/workflows/all"
        element={
          <PrivateWrapper>
            <AllWorkflows />
          </PrivateWrapper>
        }
      />
    </Route>

    <Route
      element={<ProtectedRoute requiredPermission="workflow:write:create" />}
    >
      <Route
        path="/workflows/:id/create"
        element={
          <PrivateWrapper>
            <Workflows />
          </PrivateWrapper>
        }
      />
    </Route>

    <Route
      element={<ProtectedRoute requiredPermission="workflow:read:findOne" />}
    >
      <Route
        path="/workflows/:id"
        element={
          <PrivateWrapper>
            <Workflows />
          </PrivateWrapper>
        }
      />
    </Route>

    {/* Apostille routes */}
    <Route
      element={<ProtectedRoute requiredPermission="workflow:write:apostille" />}
    >
      <Route
        path="/workflows/:id/apostille"
        element={
          <PrivateWrapper>
            <Apostille />
          </PrivateWrapper>
        }
      />
      <Route
        path="/workflows/:id/apostille-extra"
        element={
          <PrivateWrapper>
            <ApostilleOfficial />
          </PrivateWrapper>
        }
      />
    </Route>

    {/* Acceptances route */}
    <Route
      element={
        // tmp action
        <ProtectedRoute requiredPermission="workflow:read:findAll" />
      }
    >
      <Route
        path="/acceptances"
        element={
          <PrivateWrapper>
            <MyAcceptances />
          </PrivateWrapper>
        }
      />
    </Route>

    {/* Datasets route */}
    <Route
      element={<ProtectedRoute requiredPermission="datasets:read:findAll" />}
    >
      <Route
        path="/datasets"
        element={
          <PrivateWrapper>
            <Datasets />
          </PrivateWrapper>
        }
      />
    </Route>

    {/* Form presets route */}
    <Route element={<ProtectedRoute requiredPermission="form:read:findAll" />}>
      <Route
        path="/presets"
        element={
          <PrivateWrapper>
            <FormsPreset />
          </PrivateWrapper>
        }
      />
    </Route>

    {/* Environments route */}
    <Route
      element={
        <ProtectedRoute requiredPermission="constant-variable:read:findAll" />
      }
    >
      <Route
        path="/environments"
        element={
          <PrivateWrapper>
            <Environments />
          </PrivateWrapper>
        }
      />
      <Route
        path="/variables"
        element={
          <PrivateWrapper>
            <Environments />
          </PrivateWrapper>
        }
      />
    </Route>

    {/* Modules route */}
    <Route
      element={<ProtectedRoute requiredPermission="code-module:read:findAll" />}
    >
      <Route
        path="/modules"
        element={
          <PrivateWrapper>
            <Modules />
          </PrivateWrapper>
        }
      />
    </Route>

    {/* Secrets route */}
    <Route
      element={
        <ProtectedRoute requiredPermission="integration:secrets:findAll" />
      }
    >
      <Route
        path="/secrets"
        element={
          <PrivateWrapper>
            <Secrets />
          </PrivateWrapper>
        }
      />
    </Route>

    {/* Representations route - local workflow context */}
    <Route element={<ProtectedRoute />}>
      <Route
        path="/representations"
        element={
          <PrivateWrapper>
            <Profile />
          </PrivateWrapper>
        }
      />

      {/* Profile route now points to Accounts (source of truth for profile data) */}
      <Route path="/profile" element={<AccountsProfileRedirect />} />
    </Route>

    {/* SignUpEditor route */}
    <Route
      element={
        <ProtectedRoute requiredPermission="user:write:set-custom-user-fields" />
      }
    >
      <Route
        path="/sign-up-editor"
        element={
          <PrivateWrapper>
            <SignUpEditor />
          </PrivateWrapper>
        }
      />
    </Route>

    {/* Default route */}
    <Route path="/" element={<DefaultRoute />} />

    {/* Catch all route */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default RouteDefinitions;
