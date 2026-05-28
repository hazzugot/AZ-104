/**
 * Additional curated AZ-104 questions (batch 2).
 * Merged into the main pool by prisma/seed.ts.
 */
import { ExamObjective, QuestionType, Difficulty } from "@prisma/client";
import type { QuestionSeed } from "./questions";

export const QUESTIONS_BATCH_2: QuestionSeed[] = [
  // ────────────── Identities & Governance ──────────────
  {
    objective: ExamObjective.IDENTITIES_GOVERNANCE,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.MEDIUM,
    stem: "Contoso recently transferred a subscription from one Microsoft Entra ID tenant to another. After the transfer, administrators report that some users have lost access to resources. What is the most likely cause?",
    options: [
      { id: "A", text: "Resource locks are tied to the previous tenant and were removed during the transfer." },
      { id: "B", text: "RBAC role assignments do not move with the subscription during a tenant transfer." },
      { id: "C", text: "Azure Policy initiatives must be reassigned at the new tenant." },
      { id: "D", text: "Managed identities are deleted when a subscription is transferred." },
    ],
    correctIds: ["B"],
    explanation: "When a subscription is transferred to a different Entra ID tenant, all RBAC role assignments are removed because the principals (users/groups) live in the original tenant. Administrators must reassign roles to principals in the new tenant. Locks and policy initiatives persist on the resources themselves.",
    distractorRationale: {
      A: "Resource locks are properties of the resource, not the tenant.",
      C: "Policy assignments persist; they apply to the resource regardless of tenant.",
      D: "Managed identities persist (though their principals may need re-association).",
    },
    references: [
      { title: "Transfer a subscription to a different directory", url: "https://learn.microsoft.com/azure/cost-management-billing/manage/billing-subscription-transfer" },
    ],
    tags: ["entra-id", "subscription", "tenant-transfer"],
  },
  {
    objective: ExamObjective.IDENTITIES_GOVERNANCE,
    type: QuestionType.MULTIPLE_RESPONSE,
    difficulty: Difficulty.HARD,
    stem: "You are designing a Conditional Access policy for Contoso that requires MFA when users access SharePoint Online from outside the corporate network. The policy must NOT trigger for service accounts running unattended scripts. Which TWO settings should you configure? Each correct answer is part of the solution.",
    options: [
      { id: "A", text: "Set Conditions → Locations → exclude 'Trusted IPs' and include 'Any location'." },
      { id: "B", text: "Set Assignments → Users → exclude a group that contains the service accounts." },
      { id: "C", text: "Set Conditions → Client apps → include 'Mobile apps and desktop clients' only." },
      { id: "D", text: "Set Grant control → Require multi-factor authentication and 'Require all the selected controls'." },
    ],
    correctIds: ["B", "D"],
    explanation: "To exclude service accounts, place them in a group and exclude that group under Assignments → Users. To enforce MFA, configure the grant control to Require MFA. The location condition would need to include 'Any location' and exclude trusted IPs/named locations corresponding to the corporate network — option A is partially right but pointing toward Trusted IPs which is a deprecated MFA-server concept; the correct modern approach uses Named Locations. Client apps filtering would not solve the service-account exemption.",
    distractorRationale: {
      A: "Trusted IPs is a legacy per-user MFA setting; modern CA uses Named Locations. The phrasing here is misleading.",
      C: "Client app filtering does not exempt service principals running scripts.",
    },
    references: [
      { title: "Conditional Access — service accounts", url: "https://learn.microsoft.com/entra/identity/conditional-access/howto-policy-exclude-emergency-access" },
    ],
    tags: ["conditional-access", "service-accounts", "mfa"],
  },
  {
    objective: ExamObjective.IDENTITIES_GOVERNANCE,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.MEDIUM,
    stem: "Fabrikam wants to enforce that all virtual networks in its production subscription have DDoS Protection Standard enabled. Existing non-compliant VNets must be automatically remediated. Which Azure Policy effect should you use?",
    options: [
      { id: "A", text: "Audit" },
      { id: "B", text: "Deny" },
      { id: "C", text: "DeployIfNotExists" },
      { id: "D", text: "Modify" },
    ],
    correctIds: ["C"],
    explanation: "DeployIfNotExists deploys a remediation template (in this case, enabling DDoS Protection Standard) when a resource is not compliant. It supports remediation tasks to fix existing resources. Audit only reports, Deny blocks new resources but doesn't fix existing ones, and Modify changes simple properties — DDoS Protection is associated through a child resource, not a flat property.",
    distractorRationale: {
      A: "Audit reports but doesn't remediate.",
      B: "Deny prevents new resources but cannot fix existing non-compliant ones.",
      D: "Modify is for simple property changes (e.g. adding tags), not deploying related resources.",
    },
    references: [
      { title: "Policy effect: deployIfNotExists", url: "https://learn.microsoft.com/azure/governance/policy/concepts/effects#deployifnotexists" },
    ],
    tags: ["policy", "deploy-if-not-exists", "remediation"],
  },
  {
    objective: ExamObjective.IDENTITIES_GOVERNANCE,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.HARD,
    stem: "You configure Microsoft Entra Connect with password hash sync from on-premises AD DS. The on-premises DC suffers an extended outage. Which authentication scenarios continue to work?",
    options: [
      { id: "A", text: "Only cached sign-ins on previously authenticated devices." },
      { id: "B", text: "All Entra ID cloud authentication scenarios, including new sign-ins to Microsoft 365." },
      { id: "C", text: "Only authentication to Azure portal and PowerShell." },
      { id: "D", text: "Authentication fails entirely until on-prem AD DS is restored." },
    ],
    correctIds: ["B"],
    explanation: "Password hash sync stores a hash of the password hash in Entra ID, so cloud authentication is independent of on-premises availability. All cloud sign-ins continue to work. By contrast, pass-through authentication and federation (AD FS) DO depend on on-prem connectivity and would fail during an outage.",
    distractorRationale: {
      A: "PHS does not require cache — cloud auth fully self-contained.",
      C: "All cloud services authenticated by Entra ID continue working.",
      D: "Outage only affects PTA/AD FS, not PHS.",
    },
    references: [
      { title: "Choose right authentication method", url: "https://learn.microsoft.com/entra/identity/hybrid/connect/choose-ad-authn" },
    ],
    tags: ["entra-connect", "phs", "hybrid"],
  },
  {
    objective: ExamObjective.IDENTITIES_GOVERNANCE,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.MEDIUM,
    stem: "You enable Privileged Identity Management for the Global Administrator role. A user activates the role with a justification. Within how long, by default, does PIM require the activation to be reviewed and re-justified?",
    options: [
      { id: "A", text: "The activation expires after 1 hour." },
      { id: "B", text: "The activation expires after 8 hours by default; the maximum is configurable." },
      { id: "C", text: "PIM activations are permanent until manually revoked." },
      { id: "D", text: "PIM requires re-activation every 15 minutes for high-privilege roles." },
    ],
    correctIds: ["B"],
    explanation: "PIM eligible role activations default to 8 hours but are configurable in role settings. After expiration the user must re-activate (with justification, optionally with approval and MFA). PIM is the just-in-time mechanism that limits standing privilege.",
    distractorRationale: {
      A: "1 hour is configurable but not the default.",
      C: "Eligible activations are time-bound.",
      D: "15 minutes would be impractical and is not a default.",
    },
    references: [
      { title: "PIM role settings", url: "https://learn.microsoft.com/entra/id-governance/privileged-identity-management/pim-how-to-change-default-settings" },
    ],
    tags: ["pim", "governance"],
  },
  {
    objective: ExamObjective.IDENTITIES_GOVERNANCE,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.MEDIUM,
    stem: "You need to allow users in the Contoso tenant to invite external partners as guests, while preventing the partners from inviting further guests once they join. Where should you configure this?",
    options: [
      { id: "A", text: "Microsoft Entra ID → External Identities → External collaboration settings." },
      { id: "B", text: "Azure Policy assigned at the tenant root management group." },
      { id: "C", text: "RBAC role assignment of Guest Inviter at subscription scope." },
      { id: "D", text: "Microsoft Entra ID → Security → Authentication methods." },
    ],
    correctIds: ["A"],
    explanation: "External collaboration settings control who can invite guests, what guests can do, and B2B invitation policies. The 'Guest user access restrictions' option lets you constrain guest abilities — including preventing them from inviting others. RBAC and Policy do not surface this control.",
    distractorRationale: {
      B: "Azure Policy governs resource configuration, not guest invitation behaviour.",
      C: "Guest Inviter is a role for sending invitations, not a control over guest abilities.",
      D: "Authentication methods controls factor configuration, not guest behaviour.",
    },
    references: [
      { title: "External collaboration settings", url: "https://learn.microsoft.com/entra/external-id/external-collaboration-settings-configure" },
    ],
    tags: ["b2b", "guests", "external-identities"],
  },

  // ────────────── Storage ──────────────
  {
    objective: ExamObjective.STORAGE,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.MEDIUM,
    stem: "Adventure Works generates 50 TB of telemetry data per month. The data must be queryable for 7 days for operations, accessible for 90 days for analytics, and retained for 7 years for compliance. Costs must be minimised. Which sequence of blob access tiers, applied via lifecycle policy, meets these requirements?",
    options: [
      { id: "A", text: "Hot → Cool at 7 days → Archive at 90 days → delete at 2555 days." },
      { id: "B", text: "Hot for the lifetime; reduce egress costs with reserved capacity." },
      { id: "C", text: "Premium → Hot at 7 days → Cool at 90 days → Archive at 2555 days." },
      { id: "D", text: "Cool → Archive at 7 days → delete at 90 days." },
    ],
    correctIds: ["A"],
    explanation: "The lifecycle: data starts in Hot for the 7-day query window, moves to Cool when analytics access drops, then to Archive for cheap long-term retention, and finally deletes at 7 years. Archive has the lowest storage price, suitable for cold compliance data.",
    distractorRationale: {
      B: "Hot for 7 years is wasteful — analytics access is gone after 90 days.",
      C: "Premium is for low-latency workloads; doesn't fit cold telemetry.",
      D: "Deletes data at 90 days, missing the 7-year retention requirement.",
    },
    references: [
      { title: "Lifecycle policy examples", url: "https://learn.microsoft.com/azure/storage/blobs/lifecycle-management-policy-configure" },
    ],
    tags: ["lifecycle", "tiering", "retention"],
  },
  {
    objective: ExamObjective.STORAGE,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.HARD,
    stem: "An application currently authenticates to Azure Storage using the account key. Security requires you to remove the account key from the application and rotate to Entra ID authentication, with no code changes. What should you do?",
    options: [
      { id: "A", text: "Enable a managed identity on the application's compute resource, assign the Storage Blob Data Contributor role, and update the application to use DefaultAzureCredential." },
      { id: "B", text: "Generate a User Delegation SAS and update the application to use it instead of the account key." },
      { id: "C", text: "Store the account key in Key Vault and read it from the application." },
      { id: "D", text: "Enable Customer-Managed Keys on the storage account." },
    ],
    correctIds: ["A"],
    explanation: "Using a managed identity with the appropriate data-plane role lets the application authenticate to Storage with Entra ID, eliminating the account key. DefaultAzureCredential transparently uses the managed identity. The question allows code changes (it says 'update the application'); the constraint is removing the key. SAS tokens still require code; Key Vault hides the key but doesn't remove it; CMK encrypts data but doesn't change auth.",
    distractorRationale: {
      B: "SAS still uses key-based signing; you've moved the key, not eliminated it.",
      C: "Key Vault stores the key — doesn't remove it.",
      D: "CMK is for encryption, unrelated to identity.",
    },
    references: [
      { title: "Authorize access with managed identity", url: "https://learn.microsoft.com/azure/storage/blobs/authorize-managed-identity" },
    ],
    tags: ["storage", "managed-identity", "rbac"],
  },
  {
    objective: ExamObjective.STORAGE,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.MEDIUM,
    stem: "You enable Geo-Redundant Storage (GRS) replication on a storage account. The primary region experiences a long-running outage. What action do you take to access the data?",
    options: [
      { id: "A", text: "Wait for Microsoft to initiate an automatic failover to the secondary region." },
      { id: "B", text: "Initiate a customer-managed account failover from the storage account's Geo-replication blade." },
      { id: "C", text: "Re-deploy the storage account in the paired region using ARM templates." },
      { id: "D", text: "Add a read-access tier (RA) to the GRS account, then read from the secondary endpoint." },
    ],
    correctIds: ["B"],
    explanation: "GRS supports customer-initiated failover via the portal/CLI/PowerShell. Microsoft does not automatically fail over storage accounts. RA-GRS provides read access to the secondary, but if the primary is unavailable, you initiate failover to make the secondary the new primary. After failover, the account becomes LRS in the new primary region and must be reconfigured.",
    distractorRationale: {
      A: "Microsoft does not auto-fail-over storage accounts.",
      C: "Redeploying loses data; failover preserves it.",
      D: "Adding RA must be done before the outage; even then it only gives reads, not writes.",
    },
    references: [
      { title: "Storage account failover", url: "https://learn.microsoft.com/azure/storage/common/storage-disaster-recovery-guidance" },
    ],
    tags: ["grs", "failover", "redundancy"],
  },
  {
    objective: ExamObjective.STORAGE,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.MEDIUM,
    stem: "An Azure Files share is consuming high IOPS that occasionally exceed the Standard tier capacity, causing throttling. Workload latency must be <10ms. Which migration path is most appropriate?",
    options: [
      { id: "A", text: "Increase the share quota on the existing Standard storage account." },
      { id: "B", text: "Migrate to a FileStorage account in the Premium tier." },
      { id: "C", text: "Enable Azure File Sync to offload reads to local servers." },
      { id: "D", text: "Move to a BlockBlobStorage account in the Premium tier." },
    ],
    correctIds: ["B"],
    explanation: "Premium Azure Files (on a FileStorage account kind) offers SSD-backed storage with provisioned IOPS and ms-level latency. Increasing quota on Standard doesn't address the throttling caused by transaction limits. File Sync is for hybrid file caching, not for solving latency in pure Azure workloads. BlockBlobStorage is for blob workloads, not SMB shares.",
    distractorRationale: {
      A: "Quota doesn't scale IOPS on Standard.",
      C: "File Sync is hybrid caching, not a latency fix for native Azure workloads.",
      D: "BlockBlobStorage hosts block blobs, not file shares.",
    },
    references: [
      { title: "Azure Files Premium overview", url: "https://learn.microsoft.com/azure/storage/files/storage-files-introduction" },
    ],
    tags: ["azure-files", "premium", "iops"],
  },

  // ────────────── Compute ──────────────
  {
    objective: ExamObjective.COMPUTE,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.HARD,
    stem: "Tailwind Traders wants to deploy a stateful application to AKS. Pods require persistent storage that survives node restarts and supports ReadWriteMany. The storage must be backed by Azure infrastructure. Which storage class should the team use?",
    options: [
      { id: "A", text: "Azure Disk CSI driver with the default storage class." },
      { id: "B", text: "Azure Files CSI driver with the NFS or SMB protocol." },
      { id: "C", text: "EmptyDir volume backed by node-local disk." },
      { id: "D", text: "Azure Blob CSI driver in block-blob mode." },
    ],
    correctIds: ["B"],
    explanation: "Azure Files supports ReadWriteMany (multiple pods mounting the same share) over SMB or NFS. Azure Disks are block storage and only support ReadWriteOnce. EmptyDir is ephemeral. Azure Blob CSI is for object storage, not POSIX file systems suitable for typical stateful workloads.",
    distractorRationale: {
      A: "Disks are RWO only.",
      C: "EmptyDir is ephemeral, lost on pod restart.",
      D: "Blob isn't a POSIX file system suitable for general RWX needs.",
    },
    references: [
      { title: "Storage options for AKS", url: "https://learn.microsoft.com/azure/aks/concepts-storage" },
    ],
    tags: ["aks", "storage", "persistent-volumes"],
  },
  {
    objective: ExamObjective.COMPUTE,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.MEDIUM,
    stem: "You need to host containers that run for less than 5 minutes, scale to zero when idle, and incur no infrastructure management. The workload is event-driven, triggered by Service Bus messages. Which service is the best fit?",
    options: [
      { id: "A", text: "Azure Container Instances with always-on configuration." },
      { id: "B", text: "Azure Container Apps with KEDA scaler on Service Bus." },
      { id: "C", text: "Azure Kubernetes Service with manual replica scaling." },
      { id: "D", text: "Azure App Service with a Docker image." },
    ],
    correctIds: ["B"],
    explanation: "Azure Container Apps is purpose-built for event-driven, serverless container workloads. It supports KEDA scalers (including Service Bus) and scale-to-zero. ACI doesn't scale to zero with always-on. AKS requires cluster management. App Service is request-driven and doesn't scale to zero on the Premium/Standard tiers.",
    distractorRationale: {
      A: "ACI doesn't scale to zero by default.",
      C: "AKS requires significant ops overhead.",
      D: "App Service doesn't scale to zero on production tiers and isn't event-triggered.",
    },
    references: [
      { title: "Azure Container Apps overview", url: "https://learn.microsoft.com/azure/container-apps/overview" },
    ],
    tags: ["container-apps", "keda", "serverless"],
  },
  {
    objective: ExamObjective.COMPUTE,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.HARD,
    stem: "You enable system-assigned managed identity on a virtual machine. Within the VM, an application uses the IMDS endpoint to obtain a token but receives 'Identity not found'. The role assignment is correct. What is the most likely cause?",
    options: [
      { id: "A", text: "The application is calling the IMDS endpoint over HTTPS instead of HTTP." },
      { id: "B", text: "The VM's NSG is blocking outbound traffic to 169.254.169.254." },
      { id: "C", text: "A user-defined route on the subnet directs 169.254.169.254/32 traffic to a network virtual appliance." },
      { id: "D", text: "The managed identity must propagate; tokens are unavailable for the first 24 hours." },
    ],
    correctIds: ["C"],
    explanation: "IMDS is a link-local endpoint (169.254.169.254) that must be reachable directly from the VM. A UDR forcing 0.0.0.0/0 or even just the IMDS prefix through an NVA breaks token acquisition. The fix is to add a UDR exception for 169.254.169.254/32 with next hop 'Internet' so it bypasses the appliance. NSGs don't apply to link-local traffic; IMDS uses HTTP by design; managed identities are available within minutes.",
    distractorRationale: {
      A: "IMDS uses HTTP — HTTPS would also fail differently.",
      B: "NSGs don't block traffic to 169.254.0.0/16 link-local.",
      D: "Propagation takes a few minutes, not 24 hours.",
    },
    references: [
      { title: "IMDS overview", url: "https://learn.microsoft.com/azure/virtual-machines/instance-metadata-service" },
    ],
    tags: ["managed-identity", "imds", "udr"],
  },
  {
    objective: ExamObjective.COMPUTE,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.MEDIUM,
    stem: "Contoso uses Azure Compute Gallery to distribute a Windows Server image across regions. After updating the image to a new version, some regions still deploy old VMs from the previous version. What is required?",
    options: [
      { id: "A", text: "Set the new version as the default in the gallery's image definition." },
      { id: "B", text: "Wait for cross-region replication to complete; new versions must replicate to each target region before they are usable there." },
      { id: "C", text: "Delete the previous version manually from each target region." },
      { id: "D", text: "Re-run sysprep on the source VM before creating the new version." },
    ],
    correctIds: ["B"],
    explanation: "Image versions must replicate to each target region before VMs can be deployed from them there. Until replication completes, deployments in lagging regions either fail or fall back to the prior available version. Default-version selection happens automatically. Sysprep is at image creation time.",
    distractorRationale: {
      A: "Latest version is implicitly preferred; default isn't the issue.",
      C: "Previous versions remain valid; they don't have to be deleted.",
      D: "Sysprep applies to source VM, not to version distribution.",
    },
    references: [
      { title: "Azure Compute Gallery", url: "https://learn.microsoft.com/azure/virtual-machines/azure-compute-gallery" },
    ],
    tags: ["compute-gallery", "images", "replication"],
  },

  // ────────────── Virtual Networking ──────────────
  {
    objective: ExamObjective.VIRTUAL_NETWORKING,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.MEDIUM,
    stem: "You need to provide outbound internet access to 500 VMs in a single subnet while preventing port exhaustion and minimising management. Which service should you implement?",
    options: [
      { id: "A", text: "Assign a public IP to each VM." },
      { id: "B", text: "Use a NAT Gateway with multiple Standard public IPs attached." },
      { id: "C", text: "Place a Standard Load Balancer in front of the VMs and configure outbound rules." },
      { id: "D", text: "Deploy an Azure Firewall and route all traffic through it." },
    ],
    correctIds: ["B"],
    explanation: "NAT Gateway is the recommended outbound SNAT for large subnets. Each attached Standard public IP provides ~64K SNAT ports; attaching multiple IPs scales linearly and prevents port exhaustion. It is fully managed with no rules to maintain. Per-VM PIPs scale but greatly expand attack surface; LB outbound rules are usable but cap port allocation per backend; Azure Firewall is heavier and includes egress filtering you didn't ask for.",
    distractorRationale: {
      A: "500 PIPs = administrative and cost overhead, plus large attack surface.",
      C: "LB outbound rules suffer port-allocation tuning at this scale.",
      D: "Firewall adds cost and filtering complexity beyond the requirement.",
    },
    references: [
      { title: "NAT Gateway overview", url: "https://learn.microsoft.com/azure/nat-gateway/nat-overview" },
    ],
    tags: ["nat-gateway", "outbound", "snat"],
  },
  {
    objective: ExamObjective.VIRTUAL_NETWORKING,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.HARD,
    stem: "Fabrikam runs an application gateway in front of three backend VMs. Health probes report all three backends as Healthy, but users intermittently receive 502 errors. Which configuration should you investigate FIRST?",
    options: [
      { id: "A", text: "The NSG on the application gateway subnet." },
      { id: "B", text: "The HTTP settings 'Pick host name from backend address' option and the backend's expected Host header." },
      { id: "C", text: "The minimum TLS version on the listener." },
      { id: "D", text: "The frontend IP allocation method (static vs dynamic)." },
    ],
    correctIds: ["B"],
    explanation: "Intermittent 502s with healthy probes typically indicate a Host header mismatch — the probe succeeds with a default host, but real requests fail because the backend is virtual-host-routed and rejects the missing or wrong Host header. Configure either 'Pick host name from backend address' or explicit overrides. NSG would cause consistent failures; TLS version mismatches block at connect time; frontend allocation type doesn't cause 502s.",
    distractorRationale: {
      A: "NSG misconfiguration would block traffic uniformly, not intermittently.",
      C: "TLS mismatch fails the handshake, not specific requests.",
      D: "Frontend allocation method doesn't affect backend responses.",
    },
    references: [
      { title: "Application Gateway 502", url: "https://learn.microsoft.com/azure/application-gateway/application-gateway-troubleshooting-502" },
    ],
    tags: ["application-gateway", "502", "host-header"],
  },
  {
    objective: ExamObjective.VIRTUAL_NETWORKING,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.MEDIUM,
    stem: "You need to configure a private DNS zone that resolves the FQDN crm.contoso.com to a VM in your VNet. The same FQDN should resolve publicly to a different IP. What should you do?",
    options: [
      { id: "A", text: "Create an Azure Private DNS zone for contoso.com and link it to the VNet with auto-registration." },
      { id: "B", text: "Add an A record to the public Azure DNS zone with the VM's private IP." },
      { id: "C", text: "Use split-horizon DNS — keep the public zone for internet resolution, and a separate Private DNS zone for the VNet override." },
      { id: "D", text: "Configure a conditional forwarder on the Azure-provided DNS server." },
    ],
    correctIds: ["C"],
    explanation: "Split-horizon DNS solves this exact problem: a public DNS zone for internet clients and a private DNS zone with the same name overriding inside the VNet. VNet-linked private zones resolve before falling back to public DNS, so VMs see the override IP. Adding the private IP to the public zone exposes infrastructure. A single private zone without the public version breaks external resolution.",
    distractorRationale: {
      A: "Without addressing public resolution, internet users lose the FQDN.",
      B: "Publishing private IPs to the public zone leaks infrastructure.",
      D: "Conditional forwarders forward queries but don't override resolution.",
    },
    references: [
      { title: "Private DNS split-horizon", url: "https://learn.microsoft.com/azure/dns/private-dns-overview" },
    ],
    tags: ["private-dns", "split-horizon"],
  },
  {
    objective: ExamObjective.VIRTUAL_NETWORKING,
    type: QuestionType.SCENARIO,
    difficulty: Difficulty.HARD,
    caseStudy: "You manage a multi-region deployment. Contoso uses ExpressRoute to connect on-prem datacenters to two Azure regions. The team wants on-prem traffic to use the closest ExpressRoute circuit and fail over to the other circuit if one fails.",
    stem: "Which configuration meets the requirements with the fewest manual interventions?",
    options: [
      { id: "A", text: "Configure ExpressRoute Global Reach between the two circuits and set equal BGP weights on both connections." },
      { id: "B", text: "Implement ExpressRoute connections with local preference / AS path prepending so the preferred circuit wins BGP path selection, with the other available as backup." },
      { id: "C", text: "Use Azure Traffic Manager with Performance routing in front of both ExpressRoute circuits." },
      { id: "D", text: "Combine Site-to-Site VPN with each ExpressRoute circuit and rely on Azure Route Server to select paths." },
    ],
    correctIds: ["B"],
    explanation: "ExpressRoute connections support BGP-based path selection. Setting local preference on the preferred circuit (and prepending AS path on the backup) makes BGP prefer the closer/primary path while keeping the other as automatic failover — no manual intervention required. Global Reach connects on-prem locations through Azure; it's about east-west connectivity, not active/passive failover. Traffic Manager is DNS-based and not applicable to private routing. Adding VPNs is unnecessary complexity.",
    distractorRationale: {
      A: "Global Reach links on-prem sites via Azure; doesn't address circuit failover policy.",
      C: "Traffic Manager works on public DNS, not private routing.",
      D: "Adds complexity; not needed for the requirement.",
    },
    references: [
      { title: "ExpressRoute routing", url: "https://learn.microsoft.com/azure/expressroute/expressroute-routing" },
    ],
    tags: ["expressroute", "bgp", "failover"],
  },

  // ────────────── Monitoring & Backup ──────────────
  {
    objective: ExamObjective.MONITORING_BACKUP,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.MEDIUM,
    stem: "Adventure Works needs to retain Azure Activity logs for 2 years for compliance, with the lowest storage cost possible. Which destination should you configure on the activity log diagnostic setting?",
    options: [
      { id: "A", text: "A Log Analytics workspace with default retention." },
      { id: "B", text: "A Log Analytics workspace with Archive tier configured for 24-month retention." },
      { id: "C", text: "A storage account with immutable blob storage policies." },
      { id: "D", text: "An Event Hub with extended retention." },
    ],
    correctIds: ["C"],
    explanation: "Storage account export is the lowest-cost destination for long-term retention; combined with immutable blob policies it provides tamper-resistant compliance storage. Log Analytics is more expensive per GB than blob storage even at Archive tier. Event Hubs cap retention at 7 days for Standard (up to 90 days for Premium/Dedicated), unsuited for 2-year retention.",
    distractorRationale: {
      A: "Default Log Analytics retention is 30 days; extending is costly.",
      B: "Even Archive tier is pricier than blob storage at scale for cold logs.",
      D: "Event Hub retention is much shorter than 2 years.",
    },
    references: [
      { title: "Activity log diagnostic settings", url: "https://learn.microsoft.com/azure/azure-monitor/essentials/activity-log" },
    ],
    tags: ["activity-log", "retention", "compliance"],
  },
  {
    objective: ExamObjective.MONITORING_BACKUP,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.MEDIUM,
    stem: "You configure a Log Analytics-based alert that runs a KQL query every 5 minutes. The alert fires on every evaluation even though the underlying condition (CPU > 80%) is intermittent. What should you adjust?",
    options: [
      { id: "A", text: "Increase the alert severity to Sev 0." },
      { id: "B", text: "Configure 'Number of violations' or 'Frequency of evaluation' threshold so the alert fires only after N consecutive evaluations match." },
      { id: "C", text: "Disable Auto-mitigate on the alert rule." },
      { id: "D", text: "Switch to a metric alert with dynamic thresholds." },
    ],
    correctIds: ["B"],
    explanation: "Alert rules support multi-evaluation thresholds: 'fire only when condition is true X out of Y evaluations'. This dampens noisy alerts on intermittent conditions. Severity is just metadata; auto-mitigate controls reset behaviour; switching to metric alerts is a larger change than necessary (though a valid optimisation).",
    distractorRationale: {
      A: "Severity doesn't change firing logic.",
      C: "Auto-mitigate affects clearing, not initial firing.",
      D: "Switch is a bigger change than tuning the existing rule.",
    },
    references: [
      { title: "Log alert rules", url: "https://learn.microsoft.com/azure/azure-monitor/alerts/alerts-log" },
    ],
    tags: ["alerts", "log-alert", "tuning"],
  },
  {
    objective: ExamObjective.MONITORING_BACKUP,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.HARD,
    stem: "Tailwind Traders backs up VMs with Azure Backup. A user accidentally deletes a critical VM. The retention policy specifies daily backups for 30 days. The user wants the most recent recovery point but cannot find the VM in the Recovery Services Vault's backup items. What should you check?",
    options: [
      { id: "A", text: "The Soft-deleted items view in the vault." },
      { id: "B", text: "The Azure Recycle Bin in the resource group." },
      { id: "C", text: "Whether the backup policy was paused before deletion." },
      { id: "D", text: "The diagnostic settings on the vault to confirm logs aren't truncated." },
    ],
    correctIds: ["A"],
    explanation: "When a backed-up VM is deleted, the backup data moves to a Soft-deleted items view in the vault. By default it's retained 14 days (default soft delete) and can be undeleted from there. After the soft delete window expires, recovery points are permanently removed. Azure has no resource group recycle bin, paused policies don't affect retrieval, and diagnostic settings don't affect data retention.",
    distractorRationale: {
      B: "Azure has no general resource recycle bin.",
      C: "Pausing a policy doesn't delete data.",
      D: "Diagnostic settings are about logs, not backup data.",
    },
    references: [
      { title: "Soft delete for Backup", url: "https://learn.microsoft.com/azure/backup/backup-azure-security-feature-cloud" },
    ],
    tags: ["backup", "soft-delete"],
  },
];
