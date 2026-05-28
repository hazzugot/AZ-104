/**
 * Seed data: curated AZ-104 practice exam questions.
 *
 * These are hand-authored to mirror Microsoft exam tone (scenario-first,
 * named fictitious companies, plausible distractors, defensible correct
 * answers). They ship as `APPROVED` so they're immediately usable in
 * practice exams; AI-generated questions default to `NEEDS_REVIEW`.
 *
 * Distribution targets the AZ-104 official weights:
 *   Identities & Governance ~22.5%
 *   Storage                 ~17.5%
 *   Compute                 ~22.5%
 *   Virtual Networking      ~17.5%
 *   Monitoring & Backup     ~12.5%
 */
import { ExamObjective, QuestionType, Difficulty } from "@prisma/client";

export interface QuestionSeed {
  objective: ExamObjective;
  type: QuestionType;
  difficulty: Difficulty;
  stem: string;
  caseStudy?: string;
  options: { id: string; text: string }[];
  correctIds: string[];
  explanation: string;
  distractorRationale: Record<string, string>;
  references: { title: string; url: string }[];
  tags: string[];
}

export const QUESTIONS: QuestionSeed[] = [
  // ────────────── Identities & Governance ──────────────
  {
    objective: ExamObjective.IDENTITIES_GOVERNANCE,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.MEDIUM,
    stem: "Contoso has a Microsoft Entra ID tenant with the Free edition. The security team needs to require multi-factor authentication for users only when they sign in from outside the corporate network. You need to recommend a solution that minimizes cost. What should you recommend?",
    options: [
      { id: "A", text: "Enable security defaults on the existing tenant." },
      { id: "B", text: "Upgrade to Microsoft Entra ID P1 and create a Conditional Access policy that requires MFA based on location." },
      { id: "C", text: "Upgrade to Microsoft Entra ID P2 and enable Identity Protection." },
      { id: "D", text: "Configure per-user MFA on every account." },
    ],
    correctIds: ["B"],
    explanation: "Conditional Access policies that branch on location signals (named locations) require Entra ID P1. P2 is unnecessary for this requirement — Identity Protection adds risk-based policies, not location-aware ones. Security defaults enforce MFA universally, not based on location.",
    distractorRationale: {
      A: "Security defaults apply MFA universally — they cannot scope by network location.",
      C: "P2 is overkill; the requirement is location-based, not risk-based.",
      D: "Per-user MFA cannot scope by location and is harder to manage than CA.",
    },
    references: [
      { title: "Conditional Access overview", url: "https://learn.microsoft.com/entra/identity/conditional-access/overview" },
    ],
    tags: ["entra-id", "conditional-access", "mfa", "licensing"],
  },
  {
    objective: ExamObjective.IDENTITIES_GOVERNANCE,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.MEDIUM,
    stem: "You assign User1 the Contributor role at the subscription scope. You then apply a CanNotDelete resource lock to the resource group RG1. User1 tries to delete a storage account in RG1. What happens?",
    options: [
      { id: "A", text: "The deletion succeeds because Contributor includes delete permissions." },
      { id: "B", text: "The deletion fails because the lock blocks it." },
      { id: "C", text: "The deletion succeeds only after User1 removes the lock." },
      { id: "D", text: "User1 receives a deletion warning but the operation completes." },
    ],
    correctIds: ["B"],
    explanation: "Resource locks override RBAC. A CanNotDelete lock on a resource group blocks deletion of any resource within it. Contributor cannot remove the lock either — only Owner or User Access Administrator has Microsoft.Authorization/locks/delete.",
    distractorRationale: {
      A: "Locks supersede role-based permissions for both write and delete operations.",
      C: "Contributor lacks the permissions required to delete locks.",
      D: "Lock-blocked operations fail outright; there is no warning-only mode.",
    },
    references: [
      { title: "Resource locks", url: "https://learn.microsoft.com/azure/azure-resource-manager/management/lock-resources" },
    ],
    tags: ["rbac", "locks", "governance"],
  },
  {
    objective: ExamObjective.IDENTITIES_GOVERNANCE,
    type: QuestionType.MULTIPLE_RESPONSE,
    difficulty: Difficulty.MEDIUM,
    stem: "Fabrikam wants to use dynamic security groups to grant access to a project SharePoint site for all engineers in the Australian office. Which TWO requirements must Fabrikam meet? Each correct answer is part of the solution.",
    options: [
      { id: "A", text: "Acquire Microsoft Entra ID P1 or higher licenses for the affected users." },
      { id: "B", text: "Configure a dynamic membership rule using user attributes such as department and country." },
      { id: "C", text: "Enable Privileged Identity Management on the tenant." },
      { id: "D", text: "Use a Microsoft 365 group rather than a security group." },
    ],
    correctIds: ["A", "B"],
    explanation: "Dynamic membership requires Entra ID P1. The rule is expressed against user attributes (e.g. `user.department -eq \"Engineering\" -and user.country -eq \"AU\"`). PIM is unrelated; Microsoft 365 groups support dynamic membership too, but a security group is sufficient.",
    distractorRationale: {
      C: "PIM provides just-in-time elevation, not dynamic group membership.",
      D: "Security groups support dynamic rules — a Microsoft 365 group isn't required.",
    },
    references: [
      { title: "Dynamic group membership", url: "https://learn.microsoft.com/entra/identity/users/groups-dynamic-membership" },
    ],
    tags: ["groups", "dynamic-membership", "licensing"],
  },
  {
    objective: ExamObjective.IDENTITIES_GOVERNANCE,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.HARD,
    stem: "Tailwind Traders wants developers to be able to create and manage virtual machines in the resource group RG-DevTest but not grant access to other users. The principle of least privilege must be followed. Which role should you assign?",
    options: [
      { id: "A", text: "Owner at RG-DevTest scope." },
      { id: "B", text: "Contributor at RG-DevTest scope." },
      { id: "C", text: "Virtual Machine Contributor at RG-DevTest scope." },
      { id: "D", text: "Reader at RG-DevTest scope plus Contributor at subscription scope." },
    ],
    correctIds: ["C"],
    explanation: "Virtual Machine Contributor allows VM lifecycle management without granting permissions to delegate access or manage non-VM resources. Contributor exceeds the requirement (full resource management). Owner additionally allows access delegation, which violates the requirement. The mixed assignment in D escalates privileges to the whole subscription.",
    distractorRationale: {
      A: "Owner grants access-management permissions you specifically must not give.",
      B: "Contributor allows managing every resource type in the RG, beyond the requirement.",
      D: "Subscription-scoped Contributor is far broader than the requirement.",
    },
    references: [
      { title: "Azure built-in roles", url: "https://learn.microsoft.com/azure/role-based-access-control/built-in-roles" },
    ],
    tags: ["rbac", "least-privilege", "built-in-roles"],
  },
  {
    objective: ExamObjective.IDENTITIES_GOVERNANCE,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.MEDIUM,
    stem: "You have an Azure subscription that includes 50 virtual machines. Some VMs were deployed in non-approved regions. You need to prevent further VMs from being deployed outside the approved regions but allow existing VMs to continue running. What should you configure?",
    options: [
      { id: "A", text: "An Azure Policy with the deny effect that targets allowed locations." },
      { id: "B", text: "An Azure Policy with the audit effect that targets allowed locations." },
      { id: "C", text: "A management lock of type ReadOnly on the subscription." },
      { id: "D", text: "RBAC role assignments restricted by location." },
    ],
    correctIds: ["A"],
    explanation: "Azure Policy with the Deny effect blocks future deployments that violate the rule (here: a region outside the allowed list) but does not retroactively delete or stop existing non-compliant resources. Audit only reports. Locks block all writes/deletes regardless of location. RBAC cannot scope by location.",
    distractorRationale: {
      B: "Audit reports but does not prevent new deployments.",
      C: "ReadOnly lock blocks ALL changes, not just location-specific ones.",
      D: "RBAC has no notion of geographic restriction.",
    },
    references: [
      { title: "Azure Policy effects", url: "https://learn.microsoft.com/azure/governance/policy/concepts/effects" },
    ],
    tags: ["policy", "governance", "deny"],
  },
  {
    objective: ExamObjective.IDENTITIES_GOVERNANCE,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.MEDIUM,
    stem: "Contoso plans to use group-based licensing to assign Microsoft 365 E5 to all employees. License assignment fails for users in Brazil. You verify the licenses are not exhausted. What is the most likely cause?",
    options: [
      { id: "A", text: "The affected users are missing the usageLocation property." },
      { id: "B", text: "Group-based licensing is not supported for Microsoft 365 E5." },
      { id: "C", text: "The license assignment requires Entra ID P2." },
      { id: "D", text: "The users belong to a guest tenant and cannot consume licenses." },
    ],
    correctIds: ["A"],
    explanation: "Licenses with regional service availability constraints require the usageLocation property on each user. Group-based licensing fails for users whose usageLocation is unset. Group-based licensing requires P1, not P2, and supports M365 E5.",
    distractorRationale: {
      B: "Group-based licensing supports M365 E5 fully.",
      C: "P1 is sufficient.",
      D: "Guests would be excluded earlier; missing usageLocation is the specific failure described.",
    },
    references: [
      { title: "Group-based licensing prerequisites", url: "https://learn.microsoft.com/entra/identity/users/licensing-groups-assign" },
    ],
    tags: ["licensing", "usage-location", "groups"],
  },
  {
    objective: ExamObjective.IDENTITIES_GOVERNANCE,
    type: QuestionType.SCENARIO,
    difficulty: Difficulty.HARD,
    stem: "Adventure Works enforces a baseline tag policy: every resource must include CostCenter and Environment tags. New resources without these tags must be blocked, and existing untagged resources must be reported on but not modified. Which TWO Azure Policy effects accomplish this? Each correct answer is part of the solution.",
    options: [
      { id: "A", text: "Apply a policy with the Deny effect requiring both tags on resource creation." },
      { id: "B", text: "Apply a policy with the Audit effect to identify existing resources missing the tags." },
      { id: "C", text: "Apply a policy with the Append effect to add the tags to new resources automatically." },
      { id: "D", text: "Apply a policy with the Modify effect to remove the tags from non-compliant resources." },
    ],
    correctIds: ["A", "B"],
    explanation: "Deny blocks new non-compliant resources; Audit reports existing ones without changing them. Append would silently add tags (so the org wouldn't see compliance issues), which doesn't meet the 'block new' requirement on its own. Modify would change existing resources, violating the requirement to only report on them.",
    distractorRationale: {
      C: "Append doesn't block; it auto-fills. The requirement is to block.",
      D: "Modify changes existing resources, which the scenario forbids.",
    },
    references: [
      { title: "Tag governance with Azure Policy", url: "https://learn.microsoft.com/azure/governance/policy/tutorials/govern-tags" },
    ],
    tags: ["policy", "tags", "effects"],
  },
  {
    objective: ExamObjective.IDENTITIES_GOVERNANCE,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.EASY,
    stem: "You need to delegate administrative tasks in Microsoft Entra ID so that User1 can reset passwords for users in the Sales department but cannot modify other directory objects. The principle of least privilege must be followed. Which role should you assign User1?",
    options: [
      { id: "A", text: "Global Administrator." },
      { id: "B", text: "User Administrator." },
      { id: "C", text: "Password Administrator scoped to the Sales department administrative unit." },
      { id: "D", text: "Helpdesk Administrator at the directory level." },
    ],
    correctIds: ["C"],
    explanation: "Administrative units allow scoping role assignments to a subset of users. Password Administrator scoped to the Sales AU grants exactly the permission needed without affecting other users. Helpdesk Administrator at directory level allows password resets for all users, exceeding the requirement.",
    distractorRationale: {
      A: "Global Admin is the broadest role — opposite of least privilege.",
      B: "User Administrator can create/delete users, not just reset passwords.",
      D: "Helpdesk Administrator at directory level resets for everyone, not just Sales.",
    },
    references: [
      { title: "Administrative units", url: "https://learn.microsoft.com/entra/identity/role-based-access-control/administrative-units" },
    ],
    tags: ["rbac", "administrative-units", "delegation"],
  },

  // ────────────── Storage ──────────────
  {
    objective: ExamObjective.STORAGE,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.MEDIUM,
    stem: "Contoso runs a backup workload requiring six copies of data with read access to a copy in a paired region. Compliance also requires the data to survive a single-zone datacenter outage. Which replication option should you choose?",
    options: [
      { id: "A", text: "LRS" },
      { id: "B", text: "GRS" },
      { id: "C", text: "RA-GZRS" },
      { id: "D", text: "ZRS" },
    ],
    correctIds: ["C"],
    explanation: "RA-GZRS stores 3 copies in availability zones in the primary region (zone resilience) and asynchronously replicates 3 more to the paired region, with read access to that secondary endpoint. GRS uses LRS in the primary region (no zone resilience). ZRS lacks geo-redundancy. LRS satisfies neither.",
    distractorRationale: {
      A: "LRS is single-datacenter — no zone or region durability.",
      B: "GRS protects against region failure but not single-zone outage in the primary.",
      D: "ZRS provides zone resilience but no geo-redundancy.",
    },
    references: [
      { title: "Storage redundancy", url: "https://learn.microsoft.com/azure/storage/common/storage-redundancy" },
    ],
    tags: ["storage", "redundancy", "ra-gzrs"],
  },
  {
    objective: ExamObjective.STORAGE,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.MEDIUM,
    stem: "Fabrikam stores log files in a blob container. Files older than 30 days must move to Cool, files older than 180 days must move to Archive, and files older than 7 years must be deleted. The solution must be fully managed and cost-effective. What should you implement?",
    options: [
      { id: "A", text: "An Azure Function on a timer that scans blobs and changes tiers." },
      { id: "B", text: "An Azure Storage lifecycle management policy with three actions on the container." },
      { id: "C", text: "Soft delete with a 7-year retention period." },
      { id: "D", text: "Azure Backup with archive policy on the storage account." },
    ],
    correctIds: ["B"],
    explanation: "Lifecycle management is the first-class, no-code solution: define rules that move blobs to Cool/Archive after N days and delete after M days. It runs once per day at no cost beyond the resulting storage. Functions duplicate the built-in capability; soft delete is a retention feature, not a tiering mechanism; Azure Backup for blobs has different semantics (operational/vaulted backup).",
    distractorRationale: {
      A: "Reinventing lifecycle management adds operational cost.",
      C: "Soft delete retains deleted blobs; it doesn't move tiers.",
      D: "Azure Backup creates backup recovery points; it doesn't change source blob tiers.",
    },
    references: [
      { title: "Lifecycle management", url: "https://learn.microsoft.com/azure/storage/blobs/lifecycle-management-overview" },
    ],
    tags: ["lifecycle", "blob", "tiering"],
  },
  {
    objective: ExamObjective.STORAGE,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.HARD,
    stem: "An application uses managed identity to access a storage account. You need to grant the app the ability to read and write blob data only, with no management-plane permissions on the storage account itself. Which role should you assign?",
    options: [
      { id: "A", text: "Storage Account Contributor" },
      { id: "B", text: "Storage Blob Data Contributor" },
      { id: "C", text: "Contributor" },
      { id: "D", text: "Reader and Data Access" },
    ],
    correctIds: ["B"],
    explanation: "Storage Blob Data Contributor grants read/write/delete on the blob data plane via Microsoft Entra ID authentication. Storage Account Contributor manages the resource (settings, keys, networking) but does not grant data access. Contributor is broader than the requirement; Reader and Data Access grants access to keys, which violates least privilege.",
    distractorRationale: {
      A: "Manages the account resource, not blob data.",
      C: "Contributor is too broad — violates least privilege.",
      D: "Grants access to listKeys, which bypasses RBAC on the data plane.",
    },
    references: [
      { title: "Authorize access to blob data with Entra ID", url: "https://learn.microsoft.com/azure/storage/blobs/authorize-access-azure-active-directory" },
    ],
    tags: ["rbac", "blob", "managed-identity"],
  },
  {
    objective: ExamObjective.STORAGE,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.MEDIUM,
    stem: "You configure a private endpoint for the blob service of storage account contosoblob in the VNet vnet-app. Workloads in vnet-app continue to resolve contosoblob.blob.core.windows.net to a public IP. You need to ensure private resolution. What should you do?",
    options: [
      { id: "A", text: "Disable the public network access on the storage account." },
      { id: "B", text: "Create a Private DNS zone privatelink.blob.core.windows.net and link it to vnet-app." },
      { id: "C", text: "Add a DNS forwarder VM in vnet-app pointing to 168.63.129.16." },
      { id: "D", text: "Enable service endpoints for Microsoft.Storage on the subnet." },
    ],
    correctIds: ["B"],
    explanation: "Private endpoints create a NIC inside your VNet, but resolution requires a Private DNS zone linked to consuming VNets. The zone privatelink.blob.core.windows.net is auto-populated with A records pointing to the private endpoint IP. Without the zone link, workloads still resolve the public CNAME chain.",
    distractorRationale: {
      A: "Disabling public access prevents access but doesn't fix DNS.",
      C: "168.63.129.16 is the Azure DNS; forwarding to it doesn't add privatelink resolution.",
      D: "Service endpoints are a separate feature and don't change DNS resolution.",
    },
    references: [
      { title: "Private endpoints DNS", url: "https://learn.microsoft.com/azure/private-link/private-endpoint-dns" },
    ],
    tags: ["private-endpoint", "dns", "blob"],
  },
  {
    objective: ExamObjective.STORAGE,
    type: QuestionType.CLI_TROUBLESHOOT,
    difficulty: Difficulty.MEDIUM,
    stem: "You need to copy a 500 GB directory from a local server to an Azure Blob container using AzCopy. The destination should authenticate using your Microsoft Entra ID identity. Which command should you run first?",
    options: [
      { id: "A", text: "azcopy login" },
      { id: "B", text: "az login" },
      { id: "C", text: "azcopy sas generate" },
      { id: "D", text: "az storage account keys list" },
    ],
    correctIds: ["A"],
    explanation: "`azcopy login` performs an Entra ID device-code login, allowing subsequent AzCopy commands to authenticate against blob endpoints using the role assignment on your identity (Storage Blob Data Contributor or higher). `az login` authenticates the Azure CLI, not AzCopy. SAS generation and account keys are alternative auth paths, but the question specifies Entra ID identity.",
    distractorRationale: {
      B: "Authenticates Azure CLI, not AzCopy directly.",
      C: "SAS uses key-based auth, not Entra identity.",
      D: "Account keys bypass Entra ID entirely.",
    },
    references: [
      { title: "AzCopy authorization", url: "https://learn.microsoft.com/azure/storage/common/storage-use-azcopy-authorize-azure-active-directory" },
    ],
    tags: ["azcopy", "cli", "blob"],
  },
  {
    objective: ExamObjective.STORAGE,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.MEDIUM,
    stem: "You deploy an Azure Files share for a hybrid scenario. On-prem Windows servers need to act as caches, with the file share in Azure as the source of truth. Which technology should you deploy?",
    options: [
      { id: "A", text: "Distributed File System Replication (DFS-R)." },
      { id: "B", text: "Azure File Sync agent with cloud tiering enabled." },
      { id: "C", text: "AzCopy on a scheduled task." },
      { id: "D", text: "Azure Data Box Gateway." },
    ],
    correctIds: ["B"],
    explanation: "Azure File Sync installs an agent on Windows Server, registers it with a Storage Sync Service, and syncs files to/from a cloud endpoint (Azure Files share). With cloud tiering, frequently used files are kept on-prem and older files are stubbed out, with the cloud share as the source of truth.",
    distractorRationale: {
      A: "DFS-R replicates between on-prem servers; no native cloud integration.",
      C: "AzCopy is one-shot copy, not continuous sync.",
      D: "Data Box Gateway is for bulk ingestion, not ongoing sync.",
    },
    references: [
      { title: "Azure File Sync overview", url: "https://learn.microsoft.com/azure/storage/file-sync/file-sync-introduction" },
    ],
    tags: ["files", "file-sync", "hybrid"],
  },
  {
    objective: ExamObjective.STORAGE,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.HARD,
    stem: "You enable Hierarchical Namespace on a new storage account intending to use Azure Data Lake Gen2 features. Six months later, the team decides they no longer need ADLS Gen2. What is the consequence?",
    options: [
      { id: "A", text: "You can disable HNS from the portal at any time." },
      { id: "B", text: "HNS cannot be disabled — you must migrate data to a new storage account." },
      { id: "C", text: "Disabling HNS requires upgrading to Premium block blob." },
      { id: "D", text: "HNS is automatically disabled if no Data Lake operations occur for 90 days." },
    ],
    correctIds: ["B"],
    explanation: "Hierarchical Namespace is irreversible. To return to a flat namespace, you must create a new storage account without HNS and migrate data using AzCopy or similar. This is a classic exam trap — anticipate it.",
    distractorRationale: {
      A: "There is no portal/CLI command to disable HNS.",
      C: "Tier does not affect HNS reversibility.",
      D: "HNS never auto-disables.",
    },
    references: [
      { title: "ADLS Gen2 introduction", url: "https://learn.microsoft.com/azure/storage/blobs/data-lake-storage-introduction" },
    ],
    tags: ["hns", "adls-gen2", "irreversible"],
  },

  // ────────────── Compute ──────────────
  {
    objective: ExamObjective.COMPUTE,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.HARD,
    stem: "Contoso deploys a production VM with a Standard HDD OS disk and a Premium SSD data disk. Which SLA applies to the VM?",
    options: [
      { id: "A", text: "99.99% because at least one disk is Premium." },
      { id: "B", text: "99.95% because the VM is single instance." },
      { id: "C", text: "99.9% because the OS disk is Standard HDD." },
      { id: "D", text: "No SLA is offered because the disk types are mixed." },
    ],
    correctIds: ["D"],
    explanation: "Microsoft's single-instance VM SLA (99.9%) requires ALL OS and data disks to be Premium SSD or better. A mixed configuration with even one Standard disk forfeits the SLA. Higher SLAs (99.95%/99.99%) require Availability Sets or Zones.",
    distractorRationale: {
      A: "The rule requires ALL disks to be Premium, not any.",
      B: "99.95% requires Availability Set, not single instance.",
      C: "There is no 99.9% partial SLA for single VMs with mixed disks.",
    },
    references: [
      { title: "SLA for VMs", url: "https://www.microsoft.com/licensing/docs/view/Service-Level-Agreements" },
    ],
    tags: ["sla", "vm", "managed-disks"],
  },
  {
    objective: ExamObjective.COMPUTE,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.MEDIUM,
    stem: "Tailwind Traders runs a stateless web tier on three VMs in a single availability set. To improve resilience to datacenter-wide failures within the region, you need to redeploy across availability zones with minimal downtime. What should you do?",
    options: [
      { id: "A", text: "Modify the existing availability set to enable zones." },
      { id: "B", text: "Add the VMs to availability zones using the portal." },
      { id: "C", text: "Capture images of each VM and redeploy new VMs into separate availability zones, then update DNS." },
      { id: "D", text: "Migrate the availability set to a proximity placement group." },
    ],
    correctIds: ["C"],
    explanation: "You cannot add an existing VM to an availability zone or change its zone after deployment. The standard pattern is: capture an image of the VM, deploy new VMs from the image into different zones, and cut traffic over (DNS, load balancer reconfiguration). The availability set itself cannot be 'converted' to zone-aware.",
    distractorRationale: {
      A: "Availability sets and zones are different constructs; you can't convert.",
      B: "VMs cannot be added to a zone after creation.",
      D: "PPG groups resources for low latency, not for zone distribution.",
    },
    references: [
      { title: "Availability zones for VMs", url: "https://learn.microsoft.com/azure/reliability/availability-zones-overview" },
    ],
    tags: ["availability-zones", "availability-set", "vm"],
  },
  {
    objective: ExamObjective.COMPUTE,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.MEDIUM,
    stem: "You deploy a VM Scale Set with autoscale rules to scale out when CPU exceeds 75% for 5 minutes. After deployment, the scale set grows but never shrinks during low-traffic periods. What is the most likely cause?",
    options: [
      { id: "A", text: "The scale set is in Uniform orchestration mode." },
      { id: "B", text: "A scale-in rule was not configured." },
      { id: "C", text: "The default Standard load balancer prevents scale-in." },
      { id: "D", text: "Autoscale requires Premium SSD." },
    ],
    correctIds: ["B"],
    explanation: "Autoscale needs explicit scale-in (decrease) rules in addition to scale-out rules. Without one, the set only grows. Default behaviour is conservative — Azure will not infer a scale-in policy from a scale-out one.",
    distractorRationale: {
      A: "Both orchestration modes support full autoscale.",
      C: "LB doesn't block scale-in.",
      D: "Disk tier is unrelated to autoscale.",
    },
    references: [
      { title: "VMSS autoscale", url: "https://learn.microsoft.com/azure/azure-monitor/autoscale/autoscale-overview" },
    ],
    tags: ["vmss", "autoscale"],
  },
  {
    objective: ExamObjective.COMPUTE,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.MEDIUM,
    stem: "You delete a virtual machine from a resource group via Azure CLI using `az vm delete`. Afterwards, you notice the resource group still contains a public IP, a network interface, and a managed disk. What is the most likely cause?",
    options: [
      { id: "A", text: "Azure asynchronously removes associated resources within 24 hours." },
      { id: "B", text: "`az vm delete` does not cascade-delete associated resources by default." },
      { id: "C", text: "A resource lock prevented their deletion." },
      { id: "D", text: "Subscription quota issues blocked the cleanup." },
    ],
    correctIds: ["B"],
    explanation: "By default, deleting a VM via CLI or PowerShell does not delete the NIC, public IP, or managed disks. Use `--force-deletion` and explicit cleanup, or add the disks/NIC/PIP to the same delete operation. The portal offers a checkbox to cascade-delete during VM deletion, but the CLI does not by default.",
    distractorRationale: {
      A: "Azure does not async-delete associated resources.",
      C: "A lock would have blocked the VM deletion as well.",
      D: "Quota affects creates, not deletes.",
    },
    references: [
      { title: "Delete a VM and associated resources", url: "https://learn.microsoft.com/azure/virtual-machines/delete" },
    ],
    tags: ["vm", "cli", "lifecycle"],
  },
  {
    objective: ExamObjective.COMPUTE,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.MEDIUM,
    stem: "You need to host a Linux web application that uses URL-based routing, with deployment slots for blue-green releases and built-in custom domain SSL. The team wants to minimize infrastructure management. Which service should you choose?",
    options: [
      { id: "A", text: "Azure Container Instances." },
      { id: "B", text: "Azure App Service on Linux (Standard tier or higher)." },
      { id: "C", text: "Azure Kubernetes Service." },
      { id: "D", text: "Azure VM Scale Set with Application Gateway." },
    ],
    correctIds: ["B"],
    explanation: "App Service Standard or higher supports deployment slots and SSL with custom domains, with minimal management. ACI lacks slots. AKS requires significant operational overhead. VMSS + AG works but increases infrastructure footprint.",
    distractorRationale: {
      A: "ACI does not support deployment slots.",
      C: "AKS adds orchestration overhead the requirement explicitly avoids.",
      D: "VMSS is heavier-weight than App Service for this profile.",
    },
    references: [
      { title: "App Service deployment slots", url: "https://learn.microsoft.com/azure/app-service/deploy-staging-slots" },
    ],
    tags: ["app-service", "slots", "linux"],
  },
  {
    objective: ExamObjective.COMPUTE,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.HARD,
    stem: "An App Service plan in Standard S1 tier hosts a production web app and a staging slot. You attempt to enable an additional Premium-only diagnostic feature and it fails. Which action resolves the failure while keeping cost minimal?",
    options: [
      { id: "A", text: "Scale up the App Service plan to Premium v3." },
      { id: "B", text: "Scale out the App Service plan to three instances." },
      { id: "C", text: "Move the web app to a Free plan first, then upgrade." },
      { id: "D", text: "Add a deployment slot to the staging environment." },
    ],
    correctIds: ["A"],
    explanation: "Tier-restricted features require scaling UP (changing the SKU), not scaling OUT (adding instances at the same SKU). Premium v3 unlocks the feature. Free plans don't support slots and would break the existing setup. Adding slots is unrelated to enabling a tier-locked feature.",
    distractorRationale: {
      B: "Scale-out adds instances at the same SKU; doesn't unlock SKU-locked features.",
      C: "Moving to Free would drop slots and other Standard features.",
      D: "More slots don't unlock the gated feature.",
    },
    references: [
      { title: "App Service plan SKUs", url: "https://learn.microsoft.com/azure/app-service/overview-hosting-plans" },
    ],
    tags: ["app-service", "scale-up", "tiers"],
  },

  // ────────────── Virtual Networking ──────────────
  {
    objective: ExamObjective.VIRTUAL_NETWORKING,
    type: QuestionType.SCENARIO,
    difficulty: Difficulty.MEDIUM,
    caseStudy: "Contoso uses a hub-and-spoke topology. HubVNet (10.0.0.0/16) contains an Azure Firewall and is peered with Spoke1 (10.1.0.0/16) and Spoke2 (10.2.0.0/16). Spoke1 and Spoke2 are not peered to each other.",
    stem: "Resources in Spoke1 cannot reach resources in Spoke2 even though both spokes peer with HubVNet. NSG rules permit the traffic and Azure Firewall has an explicit allow rule. You need to identify the most likely cause. What should you check next?",
    options: [
      { id: "A", text: "Whether VNet peering on each spoke has 'Allow gateway transit' enabled." },
      { id: "B", text: "Whether each spoke has a User Defined Route forcing the 10.x.0.0/16 prefix to the Azure Firewall as next hop." },
      { id: "C", text: "Whether Azure DDoS Protection Standard is enabled on the hub VNet." },
      { id: "D", text: "Whether the spoke subnets use service endpoints for Microsoft.Storage." },
    ],
    correctIds: ["B"],
    explanation: "VNet peering is non-transitive: Spoke1 ↔ Hub and Spoke2 ↔ Hub does not establish Spoke1 ↔ Spoke2 directly. To route spoke-to-spoke traffic through the hub firewall, each spoke needs a UDR sending the other spoke's prefix to the firewall as the next hop. Without UDRs, system routes treat the other spoke as unreachable.",
    distractorRationale: {
      A: "Gateway transit is for VPN/ExpressRoute traffic, not spoke-to-spoke.",
      C: "DDoS does not block legitimate flows.",
      D: "Service endpoints are unrelated to spoke-to-spoke routing.",
    },
    references: [
      { title: "Hub-and-spoke topology", url: "https://learn.microsoft.com/azure/architecture/networking/architecture/hub-spoke" },
    ],
    tags: ["peering", "udr", "hub-spoke"],
  },
  {
    objective: ExamObjective.VIRTUAL_NETWORKING,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.MEDIUM,
    stem: "You apply NSG-Subnet to subnet Subnet1 and NSG-NIC to NIC1 attached to VM1 in Subnet1. NSG-Subnet allows TCP 443 inbound from the internet; NSG-NIC denies TCP 443 inbound from the internet. A request arrives from the internet on port 443. What happens?",
    options: [
      { id: "A", text: "The request is allowed because the subnet NSG permits it." },
      { id: "B", text: "The request is denied because a deny at any layer wins." },
      { id: "C", text: "The request is allowed because NIC-level NSGs cannot override subnet NSGs." },
      { id: "D", text: "The request is denied because subnet NSGs are evaluated only for outbound traffic." },
    ],
    correctIds: ["B"],
    explanation: "When both subnet and NIC NSGs are present, both are evaluated. For inbound traffic the subnet NSG is evaluated first, then the NIC NSG. A deny at either layer drops the packet. The same logic applies in reverse for outbound traffic.",
    distractorRationale: {
      A: "Both NSGs are evaluated; a deny anywhere wins.",
      C: "NIC NSGs are equally authoritative.",
      D: "Subnet NSGs apply both inbound and outbound.",
    },
    references: [
      { title: "How NSGs work", url: "https://learn.microsoft.com/azure/virtual-network/network-security-group-how-it-works" },
    ],
    tags: ["nsg", "evaluation"],
  },
  {
    objective: ExamObjective.VIRTUAL_NETWORKING,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.MEDIUM,
    stem: "Fabrikam needs an L7 load balancer with HTTPS termination, URL-path-based routing, and an integrated WAF. The deployment must be regional. Which service should you recommend?",
    options: [
      { id: "A", text: "Azure Load Balancer Standard." },
      { id: "B", text: "Azure Application Gateway with WAF_v2 SKU." },
      { id: "C", text: "Azure Front Door Premium." },
      { id: "D", text: "Azure Traffic Manager with Performance routing." },
    ],
    correctIds: ["B"],
    explanation: "Application Gateway is regional, supports L7 features (HTTPS termination, URL/path/host routing, cookie affinity), and includes WAF in its WAF_v2 SKU. Azure Load Balancer is L4. Front Door is global, not regional. Traffic Manager is DNS-based and does no traffic processing.",
    distractorRationale: {
      A: "L4 only — no URL routing or WAF.",
      C: "Global by design — wrong scope for this requirement.",
      D: "DNS-based; no L7 processing or TLS termination.",
    },
    references: [
      { title: "Application Gateway overview", url: "https://learn.microsoft.com/azure/application-gateway/overview" },
    ],
    tags: ["application-gateway", "waf", "l7"],
  },
  {
    objective: ExamObjective.VIRTUAL_NETWORKING,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.HARD,
    stem: "You deploy a Standard Load Balancer with public IP frontend, distributing TCP 443 to three backend VMs. The VMs cannot reach external APIs over HTTPS, even though they have private IPs. Which option resolves the outbound connectivity with the fewest changes?",
    options: [
      { id: "A", text: "Assign a public IP to each VM's NIC." },
      { id: "B", text: "Associate a NAT Gateway with the VM subnet." },
      { id: "C", text: "Recreate the load balancer using the Basic SKU." },
      { id: "D", text: "Disable the NSG on the subnet." },
    ],
    correctIds: ["B"],
    explanation: "Standard Load Balancer is secure by default and does not provide outbound internet connectivity from backend VMs. Best practice is to attach a NAT Gateway to the subnet — it provides SNAT capacity per public IP and scales cleanly. Per-VM public IPs work but increase attack surface. Basic LB is deprecated. NSG isn't the cause.",
    distractorRationale: {
      A: "Works but exposes each VM to inbound internet — broader surface than NAT GW.",
      C: "Basic SKU is deprecated for new deployments and contradicts the question premise.",
      D: "NSGs default to AllowInternetOutBound; disabling NSG doesn't fix the SNAT shortfall.",
    },
    references: [
      { title: "Outbound connectivity in Azure", url: "https://learn.microsoft.com/azure/load-balancer/load-balancer-outbound-connections" },
    ],
    tags: ["standard-lb", "nat-gateway", "outbound"],
  },
  {
    objective: ExamObjective.VIRTUAL_NETWORKING,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.MEDIUM,
    stem: "You configure a Site-to-Site VPN between an on-prem network (192.168.0.0/16) and an Azure VNet (10.0.0.0/16). The tunnel comes up but no traffic flows. Which configuration is the most likely cause?",
    options: [
      { id: "A", text: "The GatewaySubnet uses /24 instead of /27." },
      { id: "B", text: "The on-prem and Azure address spaces overlap in the Local Network Gateway configuration." },
      { id: "C", text: "The VPN Gateway SKU is VpnGw1." },
      { id: "D", text: "The Connection resource references the wrong Shared Key." },
    ],
    correctIds: ["D"],
    explanation: "If the tunnel is reported as 'Connected' (up) but traffic does not flow, the Shared Key mismatch typically causes a tunnel-not-up state, so this is the most common scenario when the question states the tunnel is up but no payload traffic flows — re-check: shared key, address space declarations on both sides, and on-prem routes pointing to the Azure CIDR via the VPN. Overlapping address spaces would block the connection entirely; subnet size has no traffic-flow implication; SKU affects throughput, not basic connectivity.",
    distractorRationale: {
      A: "Subnet sizing affects bandwidth ceiling for large gateways but not basic connectivity.",
      B: "Overlap typically prevents the tunnel from coming up at all.",
      C: "SKU affects throughput, not whether traffic flows.",
    },
    references: [
      { title: "VPN troubleshooting", url: "https://learn.microsoft.com/azure/vpn-gateway/vpn-gateway-troubleshoot" },
    ],
    tags: ["vpn", "site-to-site", "troubleshooting"],
  },
  {
    objective: ExamObjective.VIRTUAL_NETWORKING,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.MEDIUM,
    stem: "You need to ensure that VMs in subnet AppSubnet can reach an Azure SQL Database over the Microsoft backbone, without traversing the public internet, without provisioning a private endpoint, and without granting public network access to the database. Which feature should you enable?",
    options: [
      { id: "A", text: "A service endpoint for Microsoft.Sql on AppSubnet, combined with a VNet firewall rule on the SQL server." },
      { id: "B", text: "A NAT Gateway on AppSubnet with an outbound rule for Microsoft.Sql." },
      { id: "C", text: "An Application Security Group containing the VMs, referenced from the SQL firewall." },
      { id: "D", text: "A user-defined route from AppSubnet to the SQL public IP via Azure Firewall." },
    ],
    correctIds: ["A"],
    explanation: "Service endpoints route traffic for a specific Azure service over the Microsoft backbone and present the source subnet identity to the destination. Combined with a VNet rule on the SQL server, the database accepts only traffic from the configured subnet without enabling public access. Private endpoints achieve the same outcome with a private IP, but the question excluded them.",
    distractorRationale: {
      B: "NAT Gateway provides outbound SNAT for internet egress — no concept of routing-by-service.",
      C: "ASGs label VMs in NSG rules; they don't authenticate against SQL firewalls.",
      D: "A UDR to a public IP still traverses the public network from the SQL side.",
    },
    references: [
      { title: "Service endpoints", url: "https://learn.microsoft.com/azure/virtual-network/virtual-network-service-endpoints-overview" },
    ],
    tags: ["service-endpoint", "sql", "vnet"],
  },

  // ────────────── Monitoring & Backup ──────────────
  {
    objective: ExamObjective.MONITORING_BACKUP,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.MEDIUM,
    stem: "Contoso must back up an Azure VM with the lowest RPO possible and retain backups for 10 years. Which combination should you implement?",
    options: [
      { id: "A", text: "Azure Backup with a daily policy and 10-year retention in a Recovery Services Vault." },
      { id: "B", text: "Azure Backup with multiple-daily snapshots and 10-year long-term retention in a Recovery Services Vault." },
      { id: "C", text: "Managed disk snapshots scheduled hourly via Automation." },
      { id: "D", text: "Azure Site Recovery with replication frequency of 30 seconds." },
    ],
    correctIds: ["B"],
    explanation: "Azure Backup supports multiple-daily backup frequencies for VMs (4-hour minimum) and long-term retention configurable up to 99 years. A daily-only policy doesn't deliver the lowest RPO. Managed disk snapshots aren't application-consistent and lack policy/retention features. Site Recovery is DR (replication), not backup.",
    distractorRationale: {
      A: "Daily-only RPO is 24 hours — not the lowest available.",
      C: "Snapshots aren't application-consistent and lack lifecycle policy.",
      D: "Site Recovery is for DR, not point-in-time backup.",
    },
    references: [
      { title: "Azure Backup for VMs", url: "https://learn.microsoft.com/azure/backup/backup-azure-vms-introduction" },
    ],
    tags: ["azure-backup", "rpo", "retention"],
  },
  {
    objective: ExamObjective.MONITORING_BACKUP,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.HARD,
    stem: "You need to alert when the average CPU of a virtual machine exceeds 80% for 10 minutes. The alert must trigger as quickly as possible. Which alert type should you choose?",
    options: [
      { id: "A", text: "A metric alert with a static threshold on Percentage CPU." },
      { id: "B", text: "A log alert that queries the Heartbeat table." },
      { id: "C", text: "An activity log alert on the VM resource." },
      { id: "D", text: "A smart detection alert in Application Insights." },
    ],
    correctIds: ["A"],
    explanation: "Metric alerts evaluate at 1-minute granularity and are the fastest signal available. Log alerts have a 5-minute minimum evaluation frequency. Activity log alerts capture control-plane events, not metrics. Smart detection applies to App Insights data.",
    distractorRationale: {
      B: "Log alerts have a 5-minute minimum and are slower.",
      C: "Activity log is control-plane events; doesn't see CPU.",
      D: "Smart detection is for App Insights anomalies.",
    },
    references: [
      { title: "Azure Monitor metric alerts", url: "https://learn.microsoft.com/azure/azure-monitor/alerts/alerts-metric-overview" },
    ],
    tags: ["alerts", "metrics", "azure-monitor"],
  },
  {
    objective: ExamObjective.MONITORING_BACKUP,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.MEDIUM,
    stem: "You need to collect Windows Security event logs from on-prem and Azure VMs into a central Log Analytics workspace. Which agent should you deploy?",
    options: [
      { id: "A", text: "The deprecated Microsoft Monitoring Agent (MMA)." },
      { id: "B", text: "Azure Monitor Agent (AMA) with a data collection rule." },
      { id: "C", text: "The Operations Manager agent for SCOM 2019." },
      { id: "D", text: "The Azure Diagnostics extension." },
    ],
    correctIds: ["B"],
    explanation: "Azure Monitor Agent (AMA) is the current supported agent. Data Collection Rules (DCRs) specify which logs/metrics to collect. AMA replaces both MMA and the older diagnostics extension. Microsoft has set a retirement date for MMA.",
    distractorRationale: {
      A: "MMA is being retired.",
      C: "SCOM agent is for on-prem Operations Manager integration only.",
      D: "Diagnostics extension predates AMA and is being superseded.",
    },
    references: [
      { title: "Azure Monitor Agent overview", url: "https://learn.microsoft.com/azure/azure-monitor/agents/azure-monitor-agent-overview" },
    ],
    tags: ["monitoring", "ama", "log-analytics"],
  },
  {
    objective: ExamObjective.MONITORING_BACKUP,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.MEDIUM,
    stem: "You enable Azure Site Recovery to replicate VMs from East US to West US. After a successful test failover, the replicated VM should remain available, but production should continue running in East US until a planned cutover. What should you do next?",
    options: [
      { id: "A", text: "Run a Failover and select 'Latest processed' recovery point." },
      { id: "B", text: "Clean up the test failover and leave replication enabled." },
      { id: "C", text: "Commit the test failover to make it permanent." },
      { id: "D", text: "Disable replication and re-protect from West US to East US." },
    ],
    correctIds: ["B"],
    explanation: "Test failover creates an isolated copy in a separate VNet without affecting source replication. After validation you 'Clean up test failover' to delete the test resources; replication continues so you're ready for the planned production failover later.",
    distractorRationale: {
      A: "A full failover would cut over production prematurely.",
      C: "There's no 'commit test failover' operation in ASR.",
      D: "Disabling replication breaks the DR posture before cutover.",
    },
    references: [
      { title: "ASR test failover", url: "https://learn.microsoft.com/azure/site-recovery/site-recovery-test-failover-to-azure" },
    ],
    tags: ["asr", "test-failover"],
  },
  {
    objective: ExamObjective.MONITORING_BACKUP,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.MEDIUM,
    stem: "A compliance audit requires that any deletion of backups stored in a Recovery Services Vault cannot take effect for at least 14 days, and the protection must survive even a compromise of the vault's primary administrator account. Which feature should you enable?",
    options: [
      { id: "A", text: "Standard soft delete (default 14-day retention)." },
      { id: "B", text: "Enhanced soft delete with the 'Always-on' option to prevent disabling." },
      { id: "C", text: "Cross-region restore on the vault." },
      { id: "D", text: "Resource locks on the vault." },
    ],
    correctIds: ["B"],
    explanation: "Enhanced soft delete (now Immutable Vaults) supports extended retention and the 'always-on / make immutable' option, which prevents disabling the protection — even by an administrator. Standard soft delete provides 14 days but a malicious admin can simply disable it. Locks don't protect against authorized backup-management operations.",
    distractorRationale: {
      A: "Default soft delete can be disabled by anyone with vault management permissions.",
      C: "Cross-region restore is for availability, not for tamper protection.",
      D: "Locks don't apply to internal backup item operations.",
    },
    references: [
      { title: "Soft delete for Azure Backup", url: "https://learn.microsoft.com/azure/backup/backup-azure-security-feature-cloud" },
    ],
    tags: ["azure-backup", "soft-delete", "compliance"],
  },
];
