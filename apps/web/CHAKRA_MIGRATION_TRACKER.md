# Chakra -> Design System Migration Tracker (apps/web)

## Prompt for a new LLM agent (copy/paste)

You are continuing a **UI migration** in `urbis-workflows/apps/web`.

### Goal
Migrate all remaining files that still use **Chakra UI** (`@chakra-ui/react`) to the Design System (`@open-urbis/map-ui`) and existing Tailwind patterns.

### Current status/context
- Many admin pages were already migrated to DS.
- `NotFound` and `IamError` now share the same DS visual pattern.
- `form-engine/fields` had a large migration pass already, but always run type/build checks after each batch.
- Latest full build command (`apps/web`): `yarn build` -> **PASS**.
- Build warnings currently observed:
  - `eval` warning in `src/modules/workflows-schema/form-engine/utils/parsers.ts`
  - chunk size warnings (>500kB)

### Migration rules
1. Preserve behavior and business logic; only change UI layer unless needed.
2. Prefer DS components from `@open-urbis/map-ui`.
3. Keep styling consistent with recently migrated pages (compact, cleaner typography, DS buttons).
4. Avoid regressions in hotkeys, modal flows, form validation, permission flows.
5. After each batch, run:
   - `yarn build` (required)
   - optional targeted lint/type checks when needed.
6. Update this tracker file by marking completed items.

---

## Remaining files importing Chakra (`@chakra-ui/react`)

Total currently mapped: **74 files**

### A) Root/src infra
- [ ] `src/AccessibilityMenu.tsx`
- [ ] `src/index.tsx`
- [ ] `src/workflow-context.ts`

### B) Hooks
- [ ] `src/hooks/snackbar.ts`

### C) Shared components
- [ ] `src/components/AdvancedJsonEditor/index.tsx`
- [ ] `src/components/Confirm.tsx`
- [ ] `src/components/HelpTooltipCliclable.tsx`
- [ ] `src/components/InfoTooltip.tsx`
- [ ] `src/components/Input.tsx`
- [ ] `src/components/JsonViewer/JsonViewerItem.tsx`
- [ ] `src/components/JsonViewer/JsonViewerNewKey.tsx`
- [ ] `src/components/JsonViewer/index.tsx`
- [ ] `src/components/MaskedInput.tsx`
- [ ] `src/components/Prompt.tsx`
- [ ] `src/components/ProtectedRoute.tsx`
- [ ] `src/components/Select.tsx`
- [ ] `src/components/ShortcutLabel.tsx`
- [ ] `src/components/SideDrawer.tsx`
- [ ] `src/components/Textarea.tsx`

### D) Auth module
- [ ] `src/modules/auth/ConfirmForgetPassword.tsx`
- [ ] `src/modules/auth/ConfirmSignUp.tsx`
- [ ] `src/modules/auth/ContestUser.tsx`
- [ ] `src/modules/auth/ForgetPassword.tsx`
- [ ] `src/modules/auth/MyData.tsx`
- [ ] `src/modules/auth/SignIn.tsx`
- [ ] `src/modules/auth/SignUp.tsx`

### E) IAM module
- [ ] `src/modules/iam/Groups.tsx`
- [ ] `src/modules/iam/Permissions.tsx`
- [ ] `src/modules/iam/Roles.tsx`
- [ ] `src/modules/iam/UserAccess.tsx`

### F) Workflows module
- [ ] `src/modules/workflows/Apostille.tsx`
- [ ] `src/modules/workflows/ApostilleOfficial.tsx`
- [ ] `src/modules/workflows/Document.tsx`
- [ ] `src/modules/workflows/Workflows.tsx`
- [ ] `src/modules/workflows/activities/ActivitiesList.tsx`
- [ ] `src/modules/workflows/activities/DocumentActivity.tsx`
- [ ] `src/modules/workflows/activities/IncomingActivity.tsx`
- [ ] `src/modules/workflows/activities/IncomingList.tsx`
- [ ] `src/modules/workflows/activities/OutgoingList.tsx`
- [ ] `src/modules/workflows/activities/SignatureActivity.tsx`
- [ ] `src/modules/workflows/activities/TaxActivity.tsx`
- [ ] `src/modules/workflows/components/StatusBadge.tsx`

### G) Workflows Schema module
- [ ] `src/modules/workflows-schema/Datasets.tsx`
- [ ] `src/modules/workflows-schema/WorkflowSchemaEditor.tsx`
- [ ] `src/modules/workflows-schema/activities/ActivityDocumentEditor.tsx`
- [ ] `src/modules/workflows-schema/activities/ActivitySignatureEditor.tsx`
- [ ] `src/modules/workflows-schema/activities/ActivityTaxEditor.tsx`
- [ ] `src/modules/workflows-schema/activities/documents/DocumentEditor.tsx`
- [ ] `src/modules/workflows-schema/activities/documents/DocumentPlateEditor.tsx`
- [ ] `src/modules/workflows-schema/activities/taxes/TaxCalculationEditor.tsx`
- [ ] `src/modules/workflows-schema/components/ActivityDependenciesSelector.tsx`
- [ ] `src/modules/workflows-schema/components/AddDataset.tsx`
- [ ] `src/modules/workflows-schema/components/AddEnvironment.tsx`
- [ ] `src/modules/workflows-schema/components/AddFieldMenu.tsx`
- [ ] `src/modules/workflows-schema/components/AddFormsPreset.tsx`
- [ ] `src/modules/workflows-schema/components/AddModule.tsx`
- [ ] `src/modules/workflows-schema/components/CodeViewerModal.tsx`
- [ ] `src/modules/workflows-schema/components/DependencyGraphVisualization.tsx`
- [ ] `src/modules/workflows-schema/components/DynamicTable.tsx`
- [ ] `src/modules/workflows-schema/components/FieldOptionEditor.tsx`
- [ ] `src/modules/workflows-schema/components/FormEditor.tsx`
- [ ] `src/modules/workflows-schema/components/ImageGallery.tsx`
- [ ] `src/modules/workflows-schema/components/Integrations.tsx`
- [ ] `src/modules/workflows-schema/components/MapLayersEditor.tsx`
- [ ] `src/modules/workflows-schema/components/PermissionsSelector.tsx`
- [ ] `src/modules/workflows-schema/configs/WorkflowConstants.tsx`
- [ ] `src/modules/workflows-schema/configs/WorkflowDependencies.tsx`
- [ ] `src/modules/workflows-schema/configs/WorkflowLibrary.tsx`
- [ ] `src/modules/workflows-schema/configs/WorkflowOutgoingDependencies.tsx`
- [ ] `src/modules/workflows-schema/configs/constants/ConstantEditor.tsx`
- [ ] `src/modules/workflows-schema/configs/library/CodeModuleEditor.tsx`
- [ ] `src/modules/workflows-schema/form-engine/Field.tsx`
- [ ] `src/modules/workflows-schema/form-engine/FieldBlockEditable.tsx`
- [ ] `src/modules/workflows-schema/form-engine/FieldEditable.tsx`

---

## Suggested migration order
1. Shared infra/components (tooltips, modal, inputs/selects wrappers)
2. `workflows-schema/form-engine` core (`Field.tsx`, `FieldEditable.tsx`, `FieldBlockEditable.tsx`)
3. `workflows-schema/components/*`
4. `iam/*`
5. `workflows/*`
6. legacy auth screens

---

## Progress log
- 2026-02-20: tracker created with full file inventory and migration prompt.
