/**
 * Seed data: full AZ-104 curriculum content.
 *
 * Each unit ships with a teaching-grade lesson body, exam tips, common
 * mistakes, real-world use cases, and key terminology — enough to study
 * from on day one before the Microsoft Learn scraper has run.
 *
 * Sourced from the official AZ-104 skills measured outline (current as of
 * the Apr 2024 revision). Content is original / paraphrased for educational
 * use; the live scraper layers in the canonical Microsoft Learn material.
 */
import { ExamObjective, UnitKind, ContentLevel } from "@prisma/client";

export interface UnitSeed {
  slug: string;
  title: string;
  kind: UnitKind;
  estimatedMin: number;
  bodyMarkdown: string;
  examTips?: string;
  commonMistakes?: string;
  realWorldUseCases?: string;
  keyTerms?: { term: string; definition: string }[];
  likelyOnExam?: boolean;
  likelyExamScore?: number;
  knowledgeChecks?: {
    prompt: string;
    options: { id: string; text: string; isCorrect: boolean; rationale?: string }[];
    explanation: string;
    difficulty?: number;
  }[];
}

export interface ModuleSeed {
  slug: string;
  title: string;
  summary: string;
  objective: ExamObjective;
  level: ContentLevel;
  examWeight: number;
  sourceUrl: string;
  units: UnitSeed[];
}

export const CURRICULUM: ModuleSeed[] = [
  // ────────────────────────────────────────────────────────────────────────
  // Identities & Governance (22.5%)
  // ────────────────────────────────────────────────────────────────────────
  {
    slug: "manage-azure-identities-governance",
    title: "Manage Azure identities and governance",
    summary:
      "Microsoft Entra ID, users, groups, licenses, external identities, RBAC, subscriptions, and Azure Policy.",
    objective: ExamObjective.IDENTITIES_GOVERNANCE,
    level: ContentLevel.INTERMEDIATE,
    examWeight: 0.225,
    sourceUrl: "https://learn.microsoft.com/training/paths/az-104-manage-identities-governance/",
    units: [
      {
        slug: "microsoft-entra-id",
        title: "Microsoft Entra ID fundamentals",
        kind: UnitKind.LESSON,
        estimatedMin: 25,
        likelyOnExam: true,
        likelyExamScore: 0.85,
        bodyMarkdown: `
## What Microsoft Entra ID is

Microsoft Entra ID (formerly Azure Active Directory) is Microsoft's cloud-based
**identity and access management** service. It is **not** a drop-in replacement
for on-premises Active Directory Domain Services (AD DS): it does not serve
LDAP, Kerberos, or Group Policy. Instead it provides modern identity protocols
— **OAuth 2.0**, **OpenID Connect**, **SAML 2.0**, and **WS-Federation** — for
SaaS, mobile, and cloud workloads.

Every Azure subscription is associated with exactly one Entra ID tenant. The
tenant is the **security boundary** for identities; resources, on the other
hand, live in subscriptions and resource groups.

## Tenants, directories, and subscriptions

- A **tenant** is a dedicated instance of Entra ID. Each tenant has a unique
  initial domain (\`<name>.onmicrosoft.com\`) and may have custom domains.
- A **subscription** is a billing container for Azure resources. A subscription
  is *trusted* by exactly one tenant at a time, but a tenant can have many
  subscriptions.
- You can *transfer* a subscription between tenants (the directory of trust
  changes); this requires Owner role and updates RBAC role assignments.

## Editions and what you get with each

| Edition | Key features | Typical use |
|---|---|---|
| Free | User/group management, SSO to 10 apps per user, B2B | Smallest tenants |
| P1 | Group-based access management, self-service password reset with writeback, Conditional Access, app proxy | Most enterprises |
| P2 | Identity Protection (risk-based CA), Privileged Identity Management (PIM), access reviews | Regulated industries |

P1 vs P2 is a frequent exam target. Memorise: **PIM and Identity Protection are P2 only**.

## Identity object types

- **User** — interactive principal (member or guest)
- **Group** — security or Microsoft 365; assigned or dynamic membership
- **Service principal** — local representation of an application in a tenant
- **Managed identity** — special service principal whose credential is managed by Azure
- **Device** — registered, joined, or hybrid-joined

## How it integrates with on-prem AD

Most enterprises run a hybrid model with **Microsoft Entra Connect Sync**
(formerly Azure AD Connect). It synchronises users, groups, and password hashes
from on-prem AD DS to Entra ID. Three authentication options:

1. **Password hash sync (PHS)** — hash-of-hash sent to cloud; simplest, most resilient.
2. **Pass-through authentication (PTA)** — authentication request relayed to on-prem; no hash leaves your DC.
3. **Federation (AD FS)** — on-prem AD FS issues the token; most complex, least common in new deployments.

PHS is the default and the AZ-104 favourite answer when "simplest" or "most resilient" appears in the stem.
`,
        examTips: `• PIM, Conditional Access risk policies, and access reviews are Entra ID P2 features.
• Self-service password reset with writeback to on-prem AD requires P1.
• Tenants are identity boundaries; subscriptions are billing/resource boundaries.
• A user can be a guest in many tenants but is a member of one home tenant.`,
        commonMistakes: `• Confusing Entra ID with AD DS — Entra ID does not speak LDAP/Kerberos.
• Assuming you can move a subscription between tenants without re-doing RBAC role assignments (you can't — they break).
• Forgetting that PHS still works during an on-prem outage, but PTA and AD FS do not.`,
        realWorldUseCases: `• Single sign-on to SaaS apps via SAML/OIDC.
• Conditional Access enforcing MFA for finance team logins from outside corp network.
• B2B guest access to Teams/SharePoint for partner organisations.
• Managed identity letting an App Service pull secrets from Key Vault without storing credentials.`,
        keyTerms: [
          { term: "Tenant", definition: "Dedicated Entra ID directory instance; identity boundary." },
          { term: "Subscription", definition: "Billing container for Azure resources; trusts one tenant." },
          { term: "Managed identity", definition: "Azure-managed service principal credential, eliminating secrets in code." },
          { term: "Conditional Access", definition: "Policy engine that grants/blocks access based on signals (user, device, location, risk)." },
          { term: "PIM", definition: "Privileged Identity Management — just-in-time elevation and access reviews; P2 feature." },
          { term: "PHS / PTA / AD FS", definition: "Three hybrid auth methods. PHS = hash sync, PTA = relay, AD FS = federation." },
        ],
        knowledgeChecks: [
          {
            prompt: "Which Microsoft Entra ID edition is required to use Privileged Identity Management (PIM)?",
            difficulty: 2,
            options: [
              { id: "A", text: "Free", isCorrect: false, rationale: "Free has no PIM." },
              { id: "B", text: "Microsoft 365 Apps", isCorrect: false, rationale: "M365 Apps does not include Entra ID Premium." },
              { id: "C", text: "Entra ID P1", isCorrect: false, rationale: "P1 includes Conditional Access but not PIM." },
              { id: "D", text: "Entra ID P2", isCorrect: true },
            ],
            explanation: "PIM, Identity Protection, and access reviews are Entra ID P2-only features. Memorise the P1/P2 boundary — it appears on every AZ-104 exam.",
          },
        ],
      },
      {
        slug: "users-and-groups",
        title: "Manage users, groups, and licenses",
        kind: UnitKind.LESSON,
        estimatedMin: 30,
        likelyOnExam: true,
        likelyExamScore: 0.78,
        bodyMarkdown: `
## User types

Entra ID has two principal user types:

- **Member** — belongs to the home tenant. Default user type when created via the portal or sync.
- **Guest** — invited from another tenant or a Microsoft account. Limited default permissions; cannot enumerate other users by default.

Each user has:
- **UserPrincipalName (UPN)** — the sign-in identifier (\`alice@contoso.com\`)
- **objectId** — a tenant-scoped GUID; immutable, used in role assignments
- **mail** — display address, not necessarily the same as UPN

## Bulk operations

Use **CSV upload** in the portal, or:

\`\`\`bash
# Azure CLI
az ad user create --display-name "Alice Wong" \\
  --user-principal-name alice@contoso.onmicrosoft.com \\
  --password 'TempP@ss123!' --force-change-password-next-sign-in true
\`\`\`

\`\`\`powershell
# Microsoft Graph PowerShell
New-MgUser -DisplayName "Alice Wong" \`
  -UserPrincipalName "alice@contoso.onmicrosoft.com" \`
  -AccountEnabled \`
  -PasswordProfile @{ Password = "TempP@ss123!"; ForceChangePasswordNextSignIn = $true } \`
  -MailNickname "alice"
\`\`\`

The **MSOnline** and **AzureAD** PowerShell modules are deprecated. Microsoft
Graph PowerShell is the supported path on the exam.

## Group types and membership

| Group type | Membership types | Used for |
|---|---|---|
| Security | Assigned, Dynamic user, Dynamic device | RBAC, app access, MDM |
| Microsoft 365 | Assigned, Dynamic user | Mail, Teams, SharePoint |

**Dynamic groups** populate automatically from rules over user/device attributes,
e.g.:

\`\`\`
(user.department -eq "Engineering") and (user.country -eq "AU")
\`\`\`

Dynamic groups require **Entra ID P1 or higher**. Rule changes can take time
to propagate (minutes to hours for large tenants).

## License assignment

Licenses can be assigned to users **directly** or via **group-based licensing**
(P1 feature). Group-based licensing is preferred at scale because it:
- Reduces drift (membership = entitlement)
- Supports usage location enforcement
- Logs reassignment events centrally

Some service plans cannot be assigned without a **usagelocation** — set this
before licensing or assignment fails.

## External identities (B2B)

Inviting an external user creates a **guest** in your tenant. The guest authenticates
against their home tenant; your tenant evaluates Conditional Access. **Guests can
be added to security groups**, but by default they cannot enumerate other users.
You can tighten this further in *External collaboration settings*.
`,
        examTips: `• Group-based licensing requires Entra ID P1.
• Dynamic groups require P1; rule syntax uses property paths like user.department.
• Use the Microsoft Graph PowerShell SDK on the exam, NOT MSOnline/AzureAD modules.
• Guests authenticate against their home tenant — you don't store their password.`,
        commonMistakes: `• Forgetting to set 'usagelocation' before assigning a license that has region restrictions.
• Assigning licenses both directly and via group, then trying to remove from the group (the direct one persists).
• Adding a guest to a Microsoft 365 group and being surprised they can read all group conversations.`,
        keyTerms: [
          { term: "UPN", definition: "User Principal Name — the user's sign-in identifier." },
          { term: "Dynamic group", definition: "Group whose membership is computed from a rule over attributes; requires P1." },
          { term: "Group-based licensing", definition: "Assigning licenses to a group so members inherit them; P1 feature." },
          { term: "Guest user", definition: "User invited from another tenant; authenticates against their home tenant." },
        ],
      },
      {
        slug: "rbac",
        title: "Azure role-based access control (RBAC)",
        kind: UnitKind.LESSON,
        estimatedMin: 30,
        likelyOnExam: true,
        likelyExamScore: 0.95,
        bodyMarkdown: `
## How RBAC works

Azure RBAC is an **authorisation system built on Azure Resource Manager**. A
role assignment is the *combination of three things*:

1. **Security principal** — who (user, group, service principal, managed identity)
2. **Role definition** — what they can do (a set of permissions)
3. **Scope** — where the permissions apply

Scope is hierarchical: **Management group → Subscription → Resource group → Resource**.
Assignments are **inherited downward**. Permissions are **additive**: an explicit
deny on a child scope wins, but otherwise the union applies.

## Built-in roles you must memorise

| Role | What it grants |
|---|---|
| **Owner** | Full access including \`Microsoft.Authorization/*\` — can grant access to others |
| **Contributor** | Full management *except* granting access |
| **Reader** | View everything; modify nothing |
| **User Access Administrator** | Manage user access (assign roles); no resource management |

The exam frequently tests the **Owner vs Contributor** distinction — Contributor
cannot delegate access, Owner can.

## Resource-specific operator roles

| Role | Typical use |
|---|---|
| Virtual Machine Contributor | Manage VMs but not the VNets they sit in |
| Network Contributor | VNets, NSGs, public IPs |
| Storage Account Contributor | Manage storage accounts (not the data plane) |
| Storage Blob Data Contributor | Read/write blob data plane |
| Key Vault Administrator | Full management plane; Key Vault Secrets User for data plane |

Note the **management-plane vs data-plane** split for Storage and Key Vault —
this is *always* tested.

## Custom roles

You define them in JSON:

\`\`\`json
{
  "Name": "Reader-and-Restart",
  "Description": "Read all + restart VMs",
  "Actions": [
    "*/read",
    "Microsoft.Compute/virtualMachines/restart/action"
  ],
  "NotActions": [],
  "DataActions": [],
  "AssignableScopes": ["/subscriptions/<sub-id>"]
}
\`\`\`

Custom roles can be assigned at any scope at or below their \`AssignableScopes\`.
A tenant supports up to **5,000 custom roles**.

## Deny assignments

Created automatically by **Azure Blueprints** and **Managed Applications**.
You cannot author them yourself. A deny assignment **overrides** role assignments.

## Resource locks (orthogonal but related)

- **ReadOnly** — blocks all writes and deletes
- **CanNotDelete** — blocks deletes only

Locks apply *regardless of role*. Only **Owner** and **User Access Administrator**
can create/delete locks (specifically the \`Microsoft.Authorization/locks/*\` permission).
`,
        examTips: `• Contributor ≠ Owner: Contributor cannot grant access.
• Locks override RBAC. A Contributor with a CanNotDelete lock cannot delete the resource.
• Owner OR User Access Administrator are required to MANAGE LOCKS (not just any role).
• Role assignments inherit downward through the hierarchy.
• Use management-plane roles for ARM operations, data-plane roles for blob/key vault content.`,
        commonMistakes: `• Confusing Contributor with Owner — both have * Actions but Owner has Microsoft.Authorization/* as well.
• Assigning Owner at subscription scope when Resource Group scope would suffice (least privilege).
• Trying to delete a lock with Contributor permissions (won't work).
• Forgetting that data-plane access to blobs requires a Storage Blob Data role, not just Storage Account Contributor.`,
        realWorldUseCases: `• DevOps pipeline runs as a service principal with Contributor on the staging resource group only.
• Auditor gets Reader at subscription scope plus Reader role on Log Analytics.
• Database team gets SQL DB Contributor in production but only Reader on the VNet.`,
        keyTerms: [
          { term: "Scope", definition: "Where a role applies; one of management group, subscription, resource group, resource." },
          { term: "Role definition", definition: "Named bundle of allowed/denied operations (Actions, NotActions, DataActions)." },
          { term: "Role assignment", definition: "The binding of principal + role + scope." },
          { term: "Deny assignment", definition: "Auto-created override that blocks operations regardless of role." },
          { term: "Resource lock", definition: "ReadOnly or CanNotDelete lock that supersedes RBAC permissions." },
        ],
        knowledgeChecks: [
          {
            prompt: "You assign User1 the Contributor role at the subscription scope. You apply a CanNotDelete lock to a resource group called RG1. User1 attempts to delete a virtual machine in RG1. What happens?",
            difficulty: 3,
            options: [
              { id: "A", text: "The deletion succeeds because Contributor allows it.", isCorrect: false, rationale: "Locks override RBAC." },
              { id: "B", text: "The deletion fails because the lock blocks it.", isCorrect: true },
              { id: "C", text: "The deletion succeeds only after User1 deletes the lock.", isCorrect: false, rationale: "Contributor cannot delete locks — only Owner or User Access Administrator can." },
              { id: "D", text: "The deletion succeeds because locks apply only to the resource group, not its contents.", isCorrect: false, rationale: "Locks are inherited by child resources." },
            ],
            explanation: "Resource locks override RBAC. A CanNotDelete lock at the resource group scope is inherited by every resource within the group. Even an Owner cannot delete the VM without first removing the lock — and removing locks requires Microsoft.Authorization/locks/delete, granted only by Owner or User Access Administrator.",
          },
        ],
      },
      {
        slug: "azure-policy",
        title: "Azure Policy and governance",
        kind: UnitKind.LESSON,
        estimatedMin: 25,
        likelyOnExam: true,
        likelyExamScore: 0.7,
        bodyMarkdown: `
## What Azure Policy does

Azure Policy enforces **organisational standards** on Azure resources by
**evaluating** configurations against rules and either **auditing**,
**preventing**, or **remediating** non-compliance. It is *not* RBAC: RBAC says
*who can do what*, Policy says *what configurations are allowed*.

## Anatomy of a policy

\`\`\`json
{
  "if": {
    "field": "type",
    "equals": "Microsoft.Storage/storageAccounts"
  },
  "then": {
    "effect": "deny",
    "details": {
      "field": "Microsoft.Storage/storageAccounts/supportsHttpsTrafficOnly",
      "equals": "true"
    }
  }
}
\`\`\`

### Common effects

| Effect | Behaviour |
|---|---|
| **Deny** | Blocks the resource operation at request time |
| **Audit** | Allows operation; flags non-compliance in reports |
| **Append / Modify** | Adds or modifies properties on the resource |
| **DeployIfNotExists** | Deploys a remediation template when condition fires (needs managed identity) |
| **AuditIfNotExists** | Reports missing related resources (e.g. no diagnostic settings) |

DeployIfNotExists and Modify require a **system-assigned managed identity** with
appropriate role permissions to remediate existing resources.

## Initiatives (Policy Sets)

An **initiative** is a bundle of related policies assigned together — e.g.
"NIST SP 800-53 R5" or "ISO 27001". Assignments target a management group,
subscription, or resource group.

## Built-in vs custom

Hundreds of built-in policies cover the most common scenarios. Custom policies
use the same JSON schema. **Parameters** make policies reusable across scopes
(e.g. \`allowedLocations\` lets one definition serve multiple geographies).

## Evaluation triggers

Policies evaluate:
- On resource **create/update** (real-time, can deny)
- On **assignment** of a policy (existing resources flagged)
- Every **24 hours** on a standard compliance scan
- On demand via \`az policy state trigger-scan\`

## Exemptions

If a single resource legitimately violates a policy (e.g. legacy app), create
an **exemption** with a category of *waiver* or *mitigated*. Exemptions don't
silence the policy; they just exclude scoped resources.

## Management Groups + Policy

Place Policy assignments at the **management group** level for tenant-wide
enforcement. The default *root* management group covers all subscriptions.
`,
        examTips: `• Deny blocks at create/update; Audit only reports.
• DeployIfNotExists requires a managed identity with role assignments to remediate.
• Compliance evaluates every 24h or on resource change — not instantly for existing resources.
• Use Initiatives to bundle related policies for compliance frameworks.
• Apply policies at management group scope to cover all subscriptions.`,
        commonMistakes: `• Expecting policies to apply retroactively without a remediation task (DeployIfNotExists needs explicit remediation runs).
• Confusing Policy with RBAC — Policy doesn't control who CAN do, it controls WHAT can be configured.
• Forgetting that Audit doesn't prevent anything; people assume it blocks like Deny.`,
        keyTerms: [
          { term: "Effect", definition: "What the policy does when its condition matches: deny, audit, append, modify, deployIfNotExists, auditIfNotExists." },
          { term: "Initiative", definition: "Named set of related policies assigned together." },
          { term: "Exemption", definition: "Scoped exclusion of resources from a policy assignment, with required justification." },
          { term: "Remediation task", definition: "Bulk run of DeployIfNotExists/Modify against existing non-compliant resources." },
        ],
      },
      {
        slug: "lab-assign-roles",
        title: "Lab: Assign Azure roles with the portal and CLI",
        kind: UnitKind.LAB,
        estimatedMin: 25,
        bodyMarkdown: `
## Objective

Grant a developer the ability to **start and stop VMs** in a resource group
without giving them broader access. You will assign a built-in role, verify
permissions, then create a custom role for finer control.

## Prerequisites

- An Azure subscription where you have Owner or User Access Administrator
- One resource group with at least one VM (or follow the deploy step in the lab)

See the **Lab guide** tab on this unit for full portal/CLI/PowerShell/Bicep walkthroughs.
`,
        examTips: `• Use the most specific scope possible (RG > Subscription).
• 'Virtual Machine Contributor' allows start/stop AND delete — for start/stop only you need a custom role.`,
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────
  // Storage (17.5%)
  // ────────────────────────────────────────────────────────────────────────
  {
    slug: "implement-manage-storage",
    title: "Implement and manage storage",
    summary:
      "Storage accounts, blob/file/queue services, access tiers, lifecycle, AzCopy, Azure Files, Azure File Sync.",
    objective: ExamObjective.STORAGE,
    level: ContentLevel.INTERMEDIATE,
    examWeight: 0.175,
    sourceUrl: "https://learn.microsoft.com/training/paths/az-104-manage-storage/",
    units: [
      {
        slug: "storage-accounts",
        title: "Create and configure storage accounts",
        kind: UnitKind.LESSON,
        estimatedMin: 25,
        likelyOnExam: true,
        likelyExamScore: 0.85,
        bodyMarkdown: `
## Account kinds

| Kind | Services | Performance | Notes |
|---|---|---|---|
| **StorageV2 (general purpose v2)** | Blob, File, Queue, Table, Disk | Standard/Premium | The default. Pick this unless told otherwise. |
| BlockBlobStorage | Block blobs only | Premium SSD | Low-latency blob workloads |
| FileStorage | Azure Files only | Premium SSD | Latency-sensitive file shares |
| StorageV1 | Legacy | Standard | Avoid for new deployments |

## Performance tiers

- **Standard** — magnetic; pay per transaction; supports cool/archive tiers
- **Premium** — SSD-backed; flat capacity pricing; lower latency but no cool/archive

Premium account → premium service only. You cannot mix tiers in one account.

## Replication / redundancy

Six options, learn them cold:

| Code | Copies | Where |
|---|---|---|
| **LRS** | 3 | Single datacenter, one zone |
| **ZRS** | 3 | Three availability zones in one region |
| **GRS** | 6 | LRS + asynchronous copy to paired region |
| **GZRS** | 6 | ZRS + asynchronous copy to paired region |
| **RA-GRS** | 6 | GRS + read access to secondary endpoint |
| **RA-GZRS** | 6 | GZRS + read access to secondary endpoint |

**Decision tree for the exam:**

1. Need cross-region failure protection? → GRS / GZRS / RA-* variants
2. Need datacenter-level (zone) protection? → ZRS / GZRS / RA-GZRS
3. Need read access to the secondary copy? → RA-* variants

ZRS is *not* available in every region — check the regional support matrix
before answering an exam question that limits choices by region.

## Access tiers (blob only)

| Tier | Min storage duration | Use |
|---|---|---|
| Hot | None | Active data |
| Cool | 30 days | Backups, older content |
| Cold (preview/GA varies) | 90 days | Rarely accessed |
| Archive | 180 days | Compliance retention |

Archive is **offline**; rehydration takes hours (Standard) or ~1h (High priority).
Early deletion before the minimum duration incurs a prorated penalty.

## Endpoints, firewalls, and private endpoints

Each service has its own endpoint: \`<account>.blob.core.windows.net\`,
\`<account>.file.core.windows.net\`, etc.

Restriction options:
1. **Public** — default; reachable from internet
2. **Selected networks** — VNet service endpoints or IP rules
3. **Disabled** — only private endpoints work
4. **Private endpoint** — NIC inside your VNet with private IP, traffic stays on Microsoft backbone

When all public network access is disabled, **only private endpoints work**.
Make sure your VNet has DNS resolution to the privatelink zone or names won't resolve.
`,
        examTips: `• Default account kind for new deployments: StorageV2.
• ZRS and GRS protect against different failures: zone vs region. GZRS = both.
• Premium accounts pay flat capacity — Standard pays per operation.
• Archive tier rehydration is NOT instant — hours.
• Early deletion fees apply if you delete blobs before the minimum duration of their tier.`,
        commonMistakes: `• Choosing LRS when the workload requires zone or region durability.
• Forgetting that ZRS isn't in every region.
• Assuming Archive data is immediately readable.
• Disabling public access without creating private endpoints first → losing connectivity.`,
        realWorldUseCases: `• GZRS for production database backups requiring region failover.
• LRS for non-critical scratch storage to save cost.
• Lifecycle policy moving logs from Hot → Cool at 30 days, Cool → Archive at 180 days, delete at 7 years.`,
        keyTerms: [
          { term: "LRS", definition: "Locally redundant storage — 3 copies in one datacenter." },
          { term: "ZRS", definition: "Zone redundant — 3 copies across availability zones in a region." },
          { term: "GRS", definition: "Geo-redundant — 6 copies, with async replica to paired region." },
          { term: "RA-GRS", definition: "GRS with read access to the secondary endpoint." },
          { term: "Access tier", definition: "Hot, Cool, Cold, Archive — affects price + retrieval latency." },
        ],
      },
      {
        slug: "blob-storage",
        title: "Azure Blob Storage",
        kind: UnitKind.LESSON,
        estimatedMin: 30,
        likelyOnExam: true,
        likelyExamScore: 0.9,
        bodyMarkdown: `
## Blob types

| Type | Optimised for | Notes |
|---|---|---|
| **Block blob** | Streaming, file storage | Up to ~190 TiB per blob (4.75 TiB without large block support) |
| **Append blob** | Logs | Only append, no random write |
| **Page blob** | VHDs / OS disks | Random read/write; up to 8 TiB |

Most workloads use block blobs.

## Containers & paths

Blob names *look* hierarchical (\`logs/2026/05/app.log\`) but the namespace
is flat unless you enable **Hierarchical Namespace (HNS)** → that turns the
account into **Azure Data Lake Storage Gen2** with directory operations,
POSIX-like ACLs, and atomic directory rename. HNS is irreversible.

## Authentication options

1. **Shared Key** (account key) — full control, hard to rotate, avoid for apps
2. **SAS** (Shared Access Signature) — scoped, time-limited token
   - **User Delegation SAS** (signed with Entra ID credentials) — preferred, audited
   - **Service SAS** (signed with account key)
   - **Account SAS** (signed with account key, broader scope)
3. **Microsoft Entra ID** (RBAC) — managed identities + data-plane roles (Storage Blob Data Reader/Contributor/Owner)
4. **Anonymous** (container ACL set to Blob/Container) — disabled by default at the account level

**User Delegation SAS** + **managed identity** is the modern, exam-favoured pattern.

## Lifecycle management

Lifecycle policies move or delete blobs based on age + filters:

\`\`\`json
{
  "rules": [{
    "name": "logs-tiering",
    "type": "Lifecycle",
    "definition": {
      "filters": { "blobTypes": ["blockBlob"], "prefixMatch": ["logs/"] },
      "actions": {
        "baseBlob": {
          "tierToCool":    { "daysAfterModificationGreaterThan": 30 },
          "tierToArchive": { "daysAfterModificationGreaterThan": 180 },
          "delete":        { "daysAfterModificationGreaterThan": 2555 }
        }
      }
    }
  }]
}
\`\`\`

Policies evaluate **once per day**.

## Soft delete + versioning

- **Blob soft delete** — retains deleted blobs for 1–365 days
- **Container soft delete** — same for whole containers
- **Versioning** — every write creates a new version (automatic snapshots)
- **Change feed** — append log of changes for auditing

Combine versioning + soft delete + immutable storage (legal hold or
time-based) for **WORM compliance** (SEC 17a-4, FINRA).

## AzCopy

Microsoft's first-class data movement CLI. Authenticates with Entra ID
(\`azcopy login\`) or SAS. Resumable, throttled, concurrent.

\`\`\`bash
# Copy a directory of files into a container
azcopy copy "/local/data/*" \\
  "https://contosobackup.blob.core.windows.net/archive?<SAS>" \\
  --recursive=true --block-size-mb=128
\`\`\`
`,
        examTips: `• HNS / Data Lake Gen2 is irreversible — you cannot turn it off.
• Lifecycle policies run once per day, not in real time.
• User Delegation SAS is signed with Entra credentials — auditable, no account key in transit.
• AzCopy is the supported bulk tool; use for migrations, scheduled copies.
• Soft delete + versioning + immutable storage = WORM compliance.`,
        commonMistakes: `• Trying to use a Service SAS where User Delegation SAS is the more secure option.
• Enabling HNS to "experiment" and being unable to roll back.
• Counting on lifecycle rules to fire instantly.`,
      },
      {
        slug: "azure-files",
        title: "Azure Files and Azure File Sync",
        kind: UnitKind.LESSON,
        estimatedMin: 25,
        bodyMarkdown: `
## Azure Files

SMB 3.0 and NFS 4.1 file shares as a managed service. Mountable from Windows,
Linux, macOS over the internet (SMB 3 only) or VNet (any protocol).

### Tiers

| Tier | Account kind | Notes |
|---|---|---|
| Transaction-optimised (Standard) | StorageV2 | Backed by HDD; pay per transaction |
| Hot (Standard) | StorageV2 | Standard HDD; cheaper transactions |
| Cool (Standard) | StorageV2 | HDD; even cheaper transactions; storage cheaper still |
| Premium | FileStorage account kind | SSD; flat capacity pricing; lowest latency |

### Identity-based authentication

Azure Files supports two identity sources for SMB shares:
- **AD DS** (on-prem AD joined VMs) — typical for hybrid file servers
- **Microsoft Entra Domain Services** — fully cloud, no on-prem AD

Enable identity-based auth, assign **Storage File Data SMB Share Reader/Contributor/Elevated Contributor**
to users, then mount with their domain credentials.

## Azure File Sync

Tiered hybrid file share. You install an **Azure File Sync agent** on a
Windows Server, register the server, and create a **server endpoint** pointing
at a **cloud endpoint** (an Azure Files share).

Key behaviours:
- Cloud share becomes the *source of truth*
- **Cloud tiering** keeps frequently used files local and ages others out to Azure
- Multi-server sync supports branch-office topology
- Granular conflict resolution

Use cases:
- Replace DFS-R-only topologies
- Centralise file shares across regions
- Disaster recovery (re-attach a fresh VM, sync down)

## SMB Multichannel

Premium Azure Files supports **SMB Multichannel** for higher throughput
through parallel TCP connections. Standard tier does not.

## Mounting

Windows: \`net use Z: \\\\<account>.file.core.windows.net\\<share> /user:Azure\\<account> <key>\`
Linux: \`mount -t cifs //<account>.file.core.windows.net/<share> /mnt/azfiles -o vers=3.0,credentials=/etc/...\`

Port 445 must be open. ISPs frequently block 445 outbound — that's why VNet
private connectivity or VPN is recommended.
`,
        examTips: `• Premium Azure Files = FileStorage account kind, flat capacity pricing.
• File Sync makes the cloud share the source of truth, not the on-prem server.
• SMB Multichannel is Premium-only.
• Port 445 is often blocked outbound by ISPs — assume private connectivity for the exam.`,
        commonMistakes: `• Using a StorageV2 account for Premium Files — needs FileStorage kind.
• Expecting Standard tier to handle latency-sensitive workloads.`,
      },
      {
        slug: "lab-azcopy",
        title: "Lab: Move data with AzCopy",
        kind: UnitKind.LAB,
        estimatedMin: 25,
        bodyMarkdown: `
## Objective

Use AzCopy to migrate a local folder of test files into Azure Blob Storage,
then copy between two containers with server-to-server transfer.

See the **Lab guide** tab for full step-by-step.
`,
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────
  // Compute (22.5%)
  // ────────────────────────────────────────────────────────────────────────
  {
    slug: "deploy-manage-compute",
    title: "Deploy and manage Azure compute resources",
    summary:
      "Virtual machines, scale sets, availability, App Service, container instances, AKS.",
    objective: ExamObjective.COMPUTE,
    level: ContentLevel.INTERMEDIATE,
    examWeight: 0.225,
    sourceUrl: "https://learn.microsoft.com/training/paths/az-104-manage-compute-resources/",
    units: [
      {
        slug: "vms",
        title: "Provision and manage virtual machines",
        kind: UnitKind.LESSON,
        estimatedMin: 35,
        likelyOnExam: true,
        likelyExamScore: 0.95,
        bodyMarkdown: `
## VM anatomy

Creating a VM provisions multiple resources:
- A **Virtual Machine** (compute)
- One or more **Network Interfaces (NICs)**
- A **Public IP** (optional)
- An **NSG** (optional, can attach to NIC or subnet)
- One **OS disk** + **data disks** (each a managed disk)
- A **VM extension** profile (optional, for agent installation)

Each lives in your resource group as a separate ARM resource. Deleting the VM
**does not** delete the disks, NIC, or PIP by default. *Microsoft has improved
the portal to offer cascade-delete, but the CLI/PowerShell default still leaves
them behind.*

## VM sizes

Size families you should recognise:
| Family | Use |
|---|---|
| **B** | Burstable — dev/test, bursty workloads |
| **D** | General purpose |
| **E** | Memory-optimised |
| **F** | Compute-optimised |
| **L** | Storage-optimised (high local SSD) |
| **N** | GPU |
| **M** | Largest memory (up to 12 TB) |

Resizing is supported, but some families require deallocation first.
You cannot resize between regions or across non-compatible families on the same hardware cluster.

## Managed disks

| SKU | Notes |
|---|---|
| Standard HDD | Cheapest, dev/test |
| Standard SSD | Light prod workloads |
| Premium SSD | Most prod workloads; required for single-instance SLA |
| Premium SSD v2 | More flexible IOPS/throughput, newer |
| Ultra Disk | Most demanding (databases) |

**Bursting**: Premium SSD on supported sizes can burst above provisioned IOPS for short periods.

## Availability options (single-region)

- **Single instance** — 99.9% SLA only if **all disks are Premium SSD or higher**
- **Availability Set** (AS) — fault domains + update domains; ~99.95% SLA; one datacenter
- **Availability Zone** (AZ) — distinct datacenter within a region; 99.99% SLA across zones
- **VM Scale Set (VMSS)** with FlexibleOrchestration + AZ — modern recommended approach

You **cannot** add an existing VM to an Availability Set or change its zone
without redeploying.

## Boot diagnostics

Enable boot diagnostics on every prod VM. It captures screenshots + serial
console logs to a managed (or user) storage account — essential for debugging
"VM won't start" tickets.

## VM extensions

| Extension | Purpose |
|---|---|
| Custom Script Extension | Run arbitrary scripts at provision time |
| DSC | PowerShell DSC configuration |
| Microsoft Antimalware | AV agent |
| Azure Monitor Agent | Telemetry |
| Network Watcher Agent | Connection monitor, packet capture |

## Generalised vs specialised images

- **Specialised** — captured as-is, retains hostname/SID; restore individual VM
- **Generalised** — sysprep'd (Windows) or waagent -deprovision (Linux); use as template

Use the **Azure Compute Gallery** to share images across subscriptions, regions, replicas.
`,
        examTips: `• Single-instance SLA requires Premium SSD (or better) for ALL disks.
• Availability Sets and Zones can't be added after creation.
• Deleting a VM via CLI does NOT delete disks/NIC/PIP — use --force-deletion or cascade flags.
• Use Azure Compute Gallery (not the deprecated Shared Image Gallery name) for image distribution.`,
        commonMistakes: `• Choosing Standard HDD for production then failing to meet SLA.
• Building an Availability Set after the fact (you can't — you redeploy).
• Forgetting to delete leftover disks → bill creep.`,
        keyTerms: [
          { term: "Managed disk", definition: "Disk resource where Azure handles storage account management." },
          { term: "Availability Set", definition: "Group of VMs spread across fault/update domains in one datacenter." },
          { term: "Availability Zone", definition: "Physically distinct datacenter within a region with its own power, cooling, network." },
          { term: "VMSS", definition: "Virtual Machine Scale Set — group of identical VMs with autoscale." },
          { term: "Image gallery", definition: "Azure Compute Gallery — distributes managed images across subs/regions." },
        ],
      },
      {
        slug: "vmss",
        title: "Virtual Machine Scale Sets",
        kind: UnitKind.LESSON,
        estimatedMin: 25,
        likelyOnExam: true,
        likelyExamScore: 0.75,
        bodyMarkdown: `
## What VMSS is

A scale set is a managed group of identical VMs deployed from a single
configuration. You define instance count and Azure handles provisioning,
load balancing integration, and (optionally) autoscale.

## Orchestration modes

| Mode | Notes |
|---|---|
| **Uniform** | Legacy. All instances identical, scale set is the management unit. Faster scale-out but limited flexibility. |
| **Flexible** | Current recommendation. Each VM is a standard ARM VM resource. Supports mixed SKUs, AZ spreading, fault-domain placement. |

For new deployments choose **Flexible** unless you need a Uniform-only feature
(e.g. very-fast autoscale below 60 seconds).

## Autoscale rules

Defined as profiles on the scale set. Rules use metrics + thresholds:

\`\`\`
WHEN avg CPU > 75% across 5 minutes
THEN increase instance count by 2
COOLDOWN 5 minutes
\`\`\`

Common metrics: CPU %, memory %, custom Application Insights metrics,
inbound traffic. **Cooldown** prevents rapid oscillation.

You also need **scale-in** rules. The default scale-in policy removes the
*highest-numbered* instance first; you can change it.

## Upgrade policy

Three modes:
- **Manual** — admin triggers updates
- **Automatic** — VMSS rolls out new versions of the model
- **Rolling** — controlled batch size + pause between batches

For prod with state, **Rolling** is the safe choice.

## Integration

- **Load balancer** in front for stateless workloads
- **Application Gateway** for L7
- **Health probes** keep unhealthy instances out of rotation

## Comparison with Azure Batch / AKS

VMSS is the building block for stateless web tier and queue worker scaling.
Use **AKS** for container orchestration, **Batch** for HPC-style job queues.
`,
        examTips: `• Choose Flexible orchestration for new scale sets.
• Pair with Availability Zones (zoneBalance: true) for region durability.
• Autoscale needs both scale-out AND scale-in rules.`,
      },
      {
        slug: "app-service",
        title: "Azure App Service",
        kind: UnitKind.LESSON,
        estimatedMin: 25,
        likelyOnExam: true,
        likelyExamScore: 0.7,
        bodyMarkdown: `
## App Service plan vs app

The **App Service Plan** is the compute (VM-equivalent). The **Web App** is the
code/container hosted on it. Multiple apps can share one plan.

### Tiers

| Tier | Notes |
|---|---|
| Free / Shared | Sandbox, no SLA |
| Basic | Dev/test, single instance |
| **Standard** | Prod, autoscale, custom domains, SSL |
| **Premium v3** | Faster, isolated CPU, zone redundant |
| **Isolated v2** (App Service Environment) | VNet integrated, single-tenant |

Tier choice drives scale limits (max instances) and features (slots, autoscale, VNet integration).

## Deployment slots

Standard+ supports **slots** — additional staging environments per app.
Swap routes traffic from staging → production atomically and warms instances first.

**Slot-specific settings** (sticky settings) stay with the slot during swap.
Useful for DB connection strings that differ per environment.

## Scaling

- **Scale up** = bigger SKU (more CPU/memory)
- **Scale out** = more instances. Triggered manually or via autoscale.

## Networking

- **Default**: public endpoint
- **VNet Integration** (outbound) — app's outbound traffic uses VNet
- **Private Endpoint** (inbound) — app reachable only from VNet
- **Access restrictions** — IP/Service Tag allow/deny

## Identity and secrets

Enable **system-assigned managed identity** → app gets a service principal →
assign RBAC to Key Vault / Storage / SQL etc. Never put secrets in app settings
when you can use Key Vault references.
`,
        examTips: `• Slots = Standard tier or higher. Free/Basic do NOT have slots.
• Autoscale = Standard or higher.
• VNet Integration is OUTBOUND only; Private Endpoints provide inbound private connectivity.
• Use Key Vault references in app settings, not raw secrets.`,
      },
      {
        slug: "aks",
        title: "Azure Kubernetes Service overview",
        kind: UnitKind.LESSON,
        estimatedMin: 20,
        bodyMarkdown: `
## What AKS gives you

Managed Kubernetes control plane (Microsoft runs etcd + API server). You manage
node pools and workloads. **Control plane is free**; you pay for nodes.

## Node pools

- **System node pool** — runs system workloads (CoreDNS, metrics-server). At least one, Linux required.
- **User node pools** — additional pools for app workloads, can be different VM sizes / OS / spot.

Spot node pools cut cost for interruptible workloads but can be evicted.

## Cluster autoscaler vs HPA

- **Cluster autoscaler** — adds/removes nodes from a pool based on unschedulable pods.
- **Horizontal Pod Autoscaler (HPA)** — adds/removes pod replicas based on CPU/metric thresholds.
- **KEDA** — event-driven scaling (queues, events).

## Networking

Two CNI modes:
- **kubenet** — minimal IP usage, NAT through node; deprecated for new clusters
- **Azure CNI** — each pod gets a VNet IP; required for many features
- **Azure CNI Overlay** — pods get IPs from overlay, nodes only consume VNet IPs

## Identity integration

AKS clusters can use:
- **Workload Identity** (recommended) — pods assume Entra identity via OIDC federation
- **Pod-managed identity** (deprecated)
- **Managed identity** for the cluster itself (to pull images, access ACR)

## Upgrades

- Cluster upgrade = control plane + node pools (sequentially)
- Node image upgrade = OS patching
- Both can be automatic with channel selection
`,
      },
      {
        slug: "lab-deploy-vm",
        title: "Lab: Deploy a VM with availability zones",
        kind: UnitKind.LAB,
        estimatedMin: 25,
        bodyMarkdown: `
## Objective

Deploy three VMs across three availability zones, place them behind a Standard
Load Balancer, and validate that taking one VM offline does not disrupt traffic.

See the **Lab guide** tab for the full walkthrough.
`,
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────
  // Virtual Networking (17.5%)
  // ────────────────────────────────────────────────────────────────────────
  {
    slug: "implement-manage-virtual-networking",
    title: "Implement and manage virtual networking",
    summary:
      "VNets, subnets, NSGs, routing, peering, VPN/ExpressRoute, public IPs, DNS, load balancers, Application Gateway.",
    objective: ExamObjective.VIRTUAL_NETWORKING,
    level: ContentLevel.INTERMEDIATE,
    examWeight: 0.175,
    sourceUrl: "https://learn.microsoft.com/training/paths/az-104-manage-virtual-networks/",
    units: [
      {
        slug: "vnets",
        title: "Virtual networks, subnets, and peering",
        kind: UnitKind.LESSON,
        estimatedMin: 30,
        likelyOnExam: true,
        likelyExamScore: 0.95,
        bodyMarkdown: `
## VNet basics

A VNet is your private network in Azure. You pick its **address space** (one
or more CIDR blocks) and carve it into **subnets**.

- VNets are **regional** — they live in one region.
- A VNet may have multiple non-overlapping address spaces (you can add more later).
- Azure reserves **5 IP addresses** per subnet: x.x.x.0 (network), x.x.x.1 (gateway), x.x.x.2/3 (DNS), x.x.x.255 (broadcast).
- Minimum subnet size is /29 (8 addresses, 3 usable).

## Peering

VNet peering connects two VNets at the network layer over Microsoft's backbone.
**Non-transitive**: A↔B and B↔C does *not* mean A↔C.

Peering options:
- **Allow virtual network access** — basic L3 connectivity
- **Allow forwarded traffic** — accept traffic from a peered VNet that didn't originate in it (required for hub-spoke NVA topologies)
- **Allow gateway transit** — let peered VNets use this VNet's VPN/ExpressRoute gateway
- **Use remote gateways** — the *opposite* side of gateway transit

**Global VNet peering** connects VNets across regions. Same as same-region peering otherwise.

## Hub-and-spoke topology

Classic enterprise pattern:
- Hub VNet contains shared services: firewall, VPN gateway, DNS, AD DC
- Spoke VNets per workload, peered with hub
- **UDRs on each spoke** force traffic through the hub firewall (spokes are NOT transitively connected via peering)

## System routes vs UDRs

Azure auto-creates **system routes** for:
- Intra-VNet traffic
- Peered VNet traffic
- Internet (0.0.0.0/0)
- On-prem (via gateway, when connected)

A **UDR (User Defined Route)** overrides system routes. Common UDR pattern:
\`0.0.0.0/0 → next hop: Virtual Appliance @ 10.0.1.4\` (forces internet egress through firewall).

## Service endpoints vs Private Endpoints

| | Service endpoint | Private endpoint |
|---|---|---|
| Where the resource lives | Public IP, no IP in your VNet | Private IP **in** your VNet |
| Granularity | Subnet-level | Resource-level |
| Cross-tenant / cross-region | Limited | Yes (with link approval) |
| Cost | Free | Paid per endpoint per hour |

Private Endpoints are the modern default. Service endpoints remain for cost-sensitive scenarios.

## DNS

Each VNet gets Azure-provided DNS (\`168.63.129.16\`). For custom domains:
- **Azure Private DNS Zones** — for VNet-only resolution; link multiple VNets
- **Conditional forwarders** — when integrating with on-prem DNS

Private endpoints auto-register their FQDN in a privatelink zone — you must
link the zone to consuming VNets or names won't resolve.
`,
        examTips: `• VNet peering is NON-TRANSITIVE — A↔B and B↔C does not bridge A↔C.
• Spoke-to-spoke through a hub firewall REQUIRES UDRs on both spokes.
• Subnets reserve 5 IPs; smallest usable subnet is /29.
• Private endpoints require their privatelink DNS zone linked to the consumer VNet.
• Service endpoints are subnet-scoped, private endpoints are resource-scoped.`,
        commonMistakes: `• Expecting spoke-to-spoke to work through a peered hub WITHOUT UDRs.
• Overlapping address spaces between VNets and breaking peering.
• Linking a private endpoint but skipping the DNS zone link.
• Subnet too small (/29) with no growth headroom.`,
        keyTerms: [
          { term: "VNet peering", definition: "Layer-3 connection between two VNets over Microsoft backbone; non-transitive." },
          { term: "UDR", definition: "User-Defined Route — overrides Azure system routes for a subnet." },
          { term: "Hub-spoke", definition: "Topology with shared services in a hub VNet, workloads in spokes." },
          { term: "Private endpoint", definition: "NIC inside your VNet that gives a resource a private IP." },
          { term: "Privatelink zone", definition: "Private DNS zone that maps the public FQDN to the private endpoint IP." },
        ],
      },
      {
        slug: "nsg",
        title: "Network Security Groups",
        kind: UnitKind.LESSON,
        estimatedMin: 25,
        likelyOnExam: true,
        likelyExamScore: 0.9,
        bodyMarkdown: `
## How NSGs work

An NSG is a stateful packet filter. Rules have:
- **Priority** (100–4096, lower = evaluated first)
- **Source** / **Destination** (IP/CIDR/ASG/Service Tag/VirtualNetwork/AzureLoadBalancer/Internet)
- **Source port** / **Destination port**
- **Protocol** (TCP/UDP/ICMP/Any)
- **Action** (Allow / Deny)
- **Direction** (Inbound / Outbound)

Stateful: a permitted outbound flow allows the return traffic without an inbound rule.

## Default rules

Always present, priority 65000+:

**Inbound**:
- AllowVnetInBound — any traffic from VirtualNetwork tag
- AllowAzureLoadBalancerInBound — health probes etc
- DenyAllInBound (65500)

**Outbound**:
- AllowVnetOutBound
- AllowInternetOutBound
- DenyAllOutBound (65500)

So a *brand-new* NSG with no custom rules: VMs can reach each other and the
internet outbound, but no internet inbound.

## NSG placement

NSGs attach to:
- **Subnet** (applies to all NICs in subnet)
- **NIC** (applies just to that VM's NIC)
- Both at once — *both* are evaluated; **deny anywhere wins**.

Inbound to a VM: subnet NSG → NIC NSG → VM.
Outbound: NIC NSG → subnet NSG → onward.

## Service Tags

Symbolic names for managed IP ranges. Examples:
- \`Internet\` — all public IPs
- \`VirtualNetwork\` — all CIDRs in this and peered VNets
- \`AzureLoadBalancer\` — the LB health probe source IP (168.63.129.16)
- \`Sql\`, \`Storage\`, \`KeyVault\` — service-specific; can be regional

Service tags are **maintained by Microsoft**; use them instead of hard-coding IPs.

## Application Security Groups (ASGs)

Group VMs by role (e.g. *web*, *db*). Reference the ASG in NSG rules instead
of IP addresses. The membership is updated as VMs are added/removed.

## Flow logs

NSG flow logs send traffic metadata to a storage account. Pair with **Traffic
Analytics** to visualise. *Flow logs require Network Watcher enabled in the
region.*
`,
        examTips: `• Default outbound to internet is ALLOWED on a new NSG. Default inbound from internet is DENIED.
• Subnet NSG + NIC NSG = both evaluated; a deny anywhere wins.
• Service Tags abstract IP ranges; prefer them over hardcoded IPs.
• ASGs group VMs by role; the membership is dynamic.
• A higher-priority Deny supersedes a lower-priority Allow.`,
        commonMistakes: `• Forgetting that NSGs are stateful — don't add reciprocal rules for return traffic.
• Thinking a rule with priority 200 wins over priority 100. (Lower number wins.)
• Mixing IP-based rules with ASG-based rules and creating shadowed rules.`,
        keyTerms: [
          { term: "Service Tag", definition: "Symbolic name for a Microsoft-maintained IP range used in NSG rules." },
          { term: "ASG", definition: "Application Security Group — labels VMs by role for use in NSG rules." },
          { term: "Priority", definition: "Lower number wins. Default rules are 65000+." },
        ],
      },
      {
        slug: "load-balancer",
        title: "Azure Load Balancer and Application Gateway",
        kind: UnitKind.LESSON,
        estimatedMin: 25,
        likelyOnExam: true,
        likelyExamScore: 0.85,
        bodyMarkdown: `
## Layer 4 vs Layer 7

| | Azure Load Balancer | Application Gateway | Front Door |
|---|---|---|---|
| Layer | L4 (TCP/UDP) | L7 (HTTP/HTTPS) | L7 (global) |
| Scope | Regional | Regional | Global |
| TLS termination | No (passthrough) | Yes | Yes |
| URL-based routing | No | Yes | Yes |
| WAF | No | Yes (WAF SKU) | Yes (Premium) |
| Health probes | TCP/HTTP/HTTPS | HTTP/HTTPS | HTTP/HTTPS |

Pick the lowest-layer option that meets requirements.

## Azure Load Balancer

- **Basic** (deprecated for new deployments) — single AZ, free, limited.
- **Standard** — zone-redundant, supports HA Ports, requires Standard PIP.

Components:
- **Frontend IP** (public or internal)
- **Backend pool** — VMs, VMSS, IPs
- **Health probes** — periodic checks; failed probe = drop from pool
- **Load balancing rules** — map frontend port → backend port
- **Outbound rules** — explicit SNAT (Standard LB defaults to *no* outbound; configure!)

### Outbound connectivity quirk

Standard Load Balancer doesn't grant outbound internet by default. Options:
1. Explicit outbound rules
2. Public IP directly on the VM
3. **NAT Gateway** — preferred for scale (provides SNAT ports per public IP)

## Application Gateway

L7 with URL/path/host-based routing. Components:
- **Listener** — frontend port + protocol + (cert)
- **Rule** — listener → backend pool + HTTP settings
- **Backend pool** — VMs / VMSS / FQDN / App Service
- **HTTP settings** — backend port, probe, affinity
- **WAF** (Standard_v2 SKU only)

Application Gateway v2 supports autoscaling and is zone-redundant.

## When to pick which

- Internal TCP services → Internal Standard LB
- Public HTTPS with URL routing + WAF → Application Gateway WAF_v2
- Multi-region global HTTPS with WAF → Front Door Premium
- HA Ports needed for NVAs → Standard LB (Application Gateway doesn't do HA ports)
`,
        examTips: `• Standard LB requires Standard SKU public IPs.
• Standard LB has NO default outbound — configure NAT Gateway or outbound rules.
• Application Gateway = regional; Front Door = global.
• WAF is on Application Gateway WAF_v2 or Front Door Premium, NOT on plain LB.
• HA Ports rule (load balance all ports) is LB-only.`,
        commonMistakes: `• Mixing Basic and Standard SKUs (PIP + LB must match).
• Forgetting to configure outbound SNAT for Standard LB.
• Choosing AG when only L4 is needed (overkill, cost).`,
      },
      {
        slug: "vpn-er",
        title: "VPN Gateway and ExpressRoute",
        kind: UnitKind.LESSON,
        estimatedMin: 25,
        bodyMarkdown: `
## VPN Gateway

Connects on-prem to Azure over IPSec/IKE. Components:
- **Gateway subnet** — required, named exactly *GatewaySubnet*, /27 recommended
- **Virtual network gateway** of type **Vpn**
- **Local network gateway** — represents the on-prem side (public IP + address space)
- **Connection** — IPSec config between VNG and LNG

SKUs (VpnGw1 → VpnGw5) define throughput and tunnel count.

### Topologies

- **Site-to-site (S2S)** — on-prem network ↔ Azure VNet
- **Point-to-site (P2S)** — individual client ↔ Azure VNet (use cert or Entra ID auth)
- **VNet-to-VNet** — two VNets connected via VPN (rare; peering is usually better)

Active-active VPN for redundancy uses two PIPs and dual tunnels.

## ExpressRoute

Dedicated private circuit via a partner (Equinix, Megaport, etc.). Doesn't
traverse the internet. Bandwidth 50 Mbps to 100 Gbps.

Components:
- **Circuit** — the carrier provisioned link
- **Peering** — Private (to VNets via ER Gateway) or Microsoft (to PaaS)
- **ExpressRoute Gateway** — terminates the circuit on Azure side

ER does NOT include encryption — add MACsec at the carrier or IPSec on top.

### Coexistence

You can run S2S VPN as backup for an ER circuit. Both terminate at the same
ER Gateway in Coexistence configurations.

## Choosing

| Need | Choose |
|---|---|
| Low cost, internet OK | VPN S2S |
| Predictable latency, private path, regulated industry | ExpressRoute |
| Both for redundancy | ER + VPN failover |
| Remote workers | P2S VPN or Azure Virtual Desktop |
`,
        examTips: `• GatewaySubnet must be EXACTLY that name; /27 recommended.
• ExpressRoute does NOT encrypt by default.
• Coexistence (ER + VPN) terminates on the same ER Gateway, not separate.
• P2S supports certificate auth, Entra ID auth (OpenVPN), or RADIUS.`,
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────
  // Monitoring & Backup (12.5%)
  // ────────────────────────────────────────────────────────────────────────
  {
    slug: "monitor-maintain-azure",
    title: "Monitor and maintain Azure resources",
    summary:
      "Azure Monitor, Log Analytics, alerts, Application Insights, Azure Backup, Site Recovery.",
    objective: ExamObjective.MONITORING_BACKUP,
    level: ContentLevel.INTERMEDIATE,
    examWeight: 0.125,
    sourceUrl: "https://learn.microsoft.com/training/paths/az-104-monitor-backup-resources/",
    units: [
      {
        slug: "azure-monitor",
        title: "Azure Monitor and Log Analytics",
        kind: UnitKind.LESSON,
        estimatedMin: 25,
        likelyOnExam: true,
        likelyExamScore: 0.8,
        bodyMarkdown: `
## What Azure Monitor is

The umbrella service for telemetry: **metrics** (numeric, low-latency, 93-day
retention by default) and **logs** (structured, queryable with KQL, longer
retention via Log Analytics).

Sources:
- Azure resources (platform metrics + activity log auto-collected)
- VM agents (Azure Monitor Agent — AMA, the current standard)
- Application Insights SDK
- Custom telemetry via REST or OpenTelemetry

## Log Analytics workspace

A workspace is the storage + query engine for log data. Decisions:
- **Region** — colocate with workloads (egress cost)
- **Retention** — 30 days default, 730+ days for compliance (Archive tier cheaper)
- **Pricing** — Pay-as-you-go or Commitment tier (100 GB/day+)
- **Access** — RBAC on the workspace (Log Analytics Reader, Contributor)

You'll be tested on the **resource-context vs workspace-context** access model.

## Kusto Query Language (KQL)

Sample:
\`\`\`kql
Heartbeat
| where TimeGenerated > ago(1h)
| summarize last_seen=max(TimeGenerated) by Computer
| where last_seen < ago(5m)
\`\`\`

Tabular pipeline, similar to SQL but pipe-based. The exam asks about basic
KQL: \`where\`, \`summarize\`, \`project\`, \`join\`, \`render\`.

## Diagnostic settings

Per resource, you choose:
- Which log categories + metrics to export
- Destination: Log Analytics workspace, Storage account, Event Hub, partner
- Multiple destinations allowed

**You must configure diagnostic settings for each resource that has them** —
they're opt-in.

## Activity Log vs Resource Logs

- **Activity Log** — subscription-level control-plane events (who created what)
- **Resource Logs** — data-plane events (e.g. blob operations, VM metrics)

Both go to Log Analytics if you configure diagnostic settings.

## Application Insights

App performance monitoring SDK. Now part of Log Analytics workspace (no longer
a separate resource type in workspace-based mode). Captures: requests, dependencies,
exceptions, custom events.
`,
        examTips: `• Azure Monitor Agent (AMA) is the current standard. The Log Analytics Agent (MMA) is deprecated.
• Diagnostic settings are per-resource and opt-in.
• Activity Log = control plane. Resource Logs = data plane.
• Log Analytics retention default is 30 days; Archive tier for longer cheaper retention.`,
      },
      {
        slug: "alerts",
        title: "Alerts and action groups",
        kind: UnitKind.LESSON,
        estimatedMin: 20,
        bodyMarkdown: `
## Alert types

| Type | Source | Latency |
|---|---|---|
| **Metric alerts** | Platform/custom metrics | 1 min |
| **Log alerts** | Log Analytics KQL query | 5 min minimum |
| **Activity Log alerts** | Subscription events | ~minutes |
| **Smart detection** | App Insights auto-detected anomalies | minutes |

## Alert rule components

- **Scope** — what's monitored
- **Condition** — signal + threshold/logic
- **Action group** — what to do (email, SMS, webhook, Logic App, ITSM, runbook)
- **Severity** — Sev 0 (critical) → Sev 4 (verbose)

## Action groups

Reusable bundles of notification + automation actions. One action group can be
referenced by many alert rules.

Actions:
- Email / SMS / push / voice
- ITSM connector (ServiceNow, etc.)
- Webhook (Slack, Teams via app)
- Azure Functions
- Logic Apps
- Automation Runbooks
- Event Hub

## Suppression and dynamic thresholds

- **Suppression rules** silence noisy alerts on a schedule (e.g. maintenance windows)
- **Dynamic thresholds** use ML to compute the band — no static threshold needed

## Alert processing rules

Newer than action groups. Override which alerts notify (or suppress whole
subscriptions on weekends).
`,
        examTips: `• Metric alerts: 1-minute granularity. Log alerts: 5-minute minimum.
• Action groups are reusable across many alert rules.
• Alert processing rules add suppression on top of action groups.`,
      },
      {
        slug: "backup",
        title: "Azure Backup",
        kind: UnitKind.LESSON,
        estimatedMin: 25,
        likelyOnExam: true,
        likelyExamScore: 0.85,
        bodyMarkdown: `
## Resources

**Recovery Services Vault** is the container for VM and on-prem backups.
**Backup Vault** is the newer container for blob, disk, AKS, PostgreSQL backups.
Different vaults, different SKUs of capability — you need both for full coverage.

## What can be backed up

- **Azure VMs** — application-consistent via VSS (Windows) / pre-post scripts (Linux)
- **Azure Files** — share-level snapshots in Recovery Services Vault
- **SQL in Azure VM** — SQL-aware backup with log frequency configurable
- **SAP HANA in Azure VM**
- **Azure Disks** — managed disk snapshots in Backup Vault
- **Azure Blobs** — operational + vaulted backups
- **On-prem** — MARS agent (file/folder), MABS (server-level), DPM

## Backup policies

Define:
- **Schedule** — daily, weekly, hourly (for SQL log backups)
- **Retention** — daily/weekly/monthly/yearly recovery points
- **Instant restore tier** — local snapshots cached for fast restore (1–5 days)

Use long-term retention (years) for compliance — Backup Vault Archive tier
reduces cost.

## Recovery types

- **Full VM** — restore as new VM
- **Disk** — restore disks, attach manually
- **File-level recovery** — mount the recovery point as iSCSI on a worker machine
- **Cross-region restore** — when the vault uses GRS, restore to the paired region

## Soft delete

By default, deleted backups are retained **14 days** (free). Enable
**enhanced soft delete** for configurable retention up to 180 days and
immutability against malicious deletion.

## Networking

Outbound HTTPS to Azure Backup service URLs. For locked-down VNets, use **Private
Endpoints for backup** (Recovery Services Vault supports PE).
`,
        examTips: `• Recovery Services Vault for VMs/Files. Backup Vault for blobs/disks/AKS.
• VM backup is application-consistent via VSS (Windows) / scripts (Linux).
• Soft delete retains deleted backups 14 days by default; enhanced soft delete extends to 180 days with immutability.
• Cross-region restore requires GRS vault.`,
        commonMistakes: `• Putting VM backups in a Backup Vault (wrong type — needs Recovery Services Vault).
• Forgetting that operational backups for blobs don't protect against account deletion.`,
      },
      {
        slug: "asr",
        title: "Azure Site Recovery",
        kind: UnitKind.LESSON,
        estimatedMin: 20,
        bodyMarkdown: `
## Purpose

Disaster recovery for VMs — replicates VMs from a source region/host to a
target region. RPO measured in minutes, RTO in tens of minutes.

## Topologies

- **Azure-to-Azure** (most common) — replicate VMs between Azure regions
- **VMware/Physical to Azure** — for on-prem DR
- **Hyper-V to Azure**

## Components

- **Recovery Services Vault** in the target region
- **Replication policy** — RPO/snapshot frequency, retention
- **Recovery plans** — orchestration of failover order, scripts, manual steps

## Failover flavours

- **Test failover** — runs the recovered VM in an isolated VNet; the source keeps replicating
- **Planned failover** — coordinated shutdown of source then failover (zero data loss when possible)
- **Unplanned failover** — disaster scenario; may lose data since the last RPO

After failover, **re-protect** the failed-over VM to replicate back to the
original region. Then **failback** when the original region is healthy.

## Capacity Reservations

ASR doesn't provision target compute until failover. For predictable capacity,
combine with **Capacity Reservations** in the target region.
`,
        examTips: `• ASR replicates VMs for DR; Azure Backup creates point-in-time recovery points. Don't confuse them.
• Test failover uses an isolated VNet so it doesn't disturb production.
• Re-protect after failover, then failback.`,
      },
    ],
  },
];
