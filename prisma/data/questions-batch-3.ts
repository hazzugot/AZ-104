/**
 * Curated AZ-104 questions — batch 3. Brings the curated pool above 75.
 * Focuses on second-order knowledge (gotchas, subtle distinctions, common
 * exam traps that trip up first-time candidates).
 */
import { ExamObjective, QuestionType, Difficulty } from "@prisma/client";
import type { QuestionSeed } from "./questions";

export const QUESTIONS_BATCH_3: QuestionSeed[] = [
  // ────────────── Identities & Governance ──────────────
  {
    objective: ExamObjective.IDENTITIES_GOVERNANCE,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.HARD,
    stem: "Contoso uses Microsoft Entra Connect with the default password hash sync configuration. After enabling Self-Service Password Reset (SSPR) with on-premises writeback, users reset their cloud password and the change appears in Entra ID but does NOT propagate to on-prem AD. What is the most likely cause?",
    options: [
      { id: "A", text: "Password writeback is not enabled in Microsoft Entra Connect Sync." },
      { id: "B", text: "The user does not have Entra ID P1 or higher." },
      { id: "C", text: "Pass-through authentication must be enabled for SSPR writeback to work." },
      { id: "D", text: "The on-premises AD account is in a protected group (Domain Admins)." },
    ],
    correctIds: ["A"],
    explanation: "Password writeback is an opt-in feature in Microsoft Entra Connect Sync — until it is explicitly enabled, password changes made in the cloud do not propagate back to on-prem AD. SSPR requires P1 but the question states changes appear in Entra ID, so the user already has SSPR working cloud-side. Writeback works with PHS or PTA; it's not PTA-exclusive. Protected groups do block writeback, but option A is the more general first-line check.",
    distractorRationale: {
      B: "SSPR is already working in the cloud, so P1 is in place.",
      C: "Writeback supports both PHS and PTA.",
      D: "Protected groups are a niche case; writeback configuration is the universal first check.",
    },
    references: [
      { title: "Password writeback", url: "https://learn.microsoft.com/entra/identity/authentication/concept-sspr-writeback" },
    ],
    tags: ["sspr", "entra-connect", "writeback"],
  },
  {
    objective: ExamObjective.IDENTITIES_GOVERNANCE,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.MEDIUM,
    stem: "You assign the Reader role at the subscription scope to a security auditor. The auditor reports they cannot view the contents of a Key Vault that holds production secrets. What is the cause?",
    options: [
      { id: "A", text: "Reader includes management-plane permissions but not data-plane permissions on Key Vault." },
      { id: "B", text: "The Key Vault has a CanNotDelete lock that blocks reads." },
      { id: "C", text: "The auditor's role assignment has not yet propagated through Entra ID." },
      { id: "D", text: "Key Vault firewall restrictions are blocking the auditor's IP." },
    ],
    correctIds: ["A"],
    explanation: "Reader is a management-plane (ARM) role: it lets the auditor see that the Key Vault exists, view its properties, and read access policies, but not read the secrets/keys/certs themselves. Data-plane access requires either a Key Vault data-plane role (e.g. Key Vault Reader, Key Vault Secrets User) when using Azure RBAC mode, or an entry in the vault's access policy list (legacy mode). Locks don't block reads; propagation is fast; firewalls would block at the network layer with a different error.",
    distractorRationale: {
      B: "CanNotDelete blocks deletes, not reads.",
      C: "Propagation typically takes seconds.",
      D: "Firewall blocks present as network-layer errors, not authorization errors.",
    },
    references: [
      { title: "Key Vault RBAC vs access policies", url: "https://learn.microsoft.com/azure/key-vault/general/rbac-guide" },
    ],
    tags: ["key-vault", "rbac", "data-plane"],
  },
  {
    objective: ExamObjective.IDENTITIES_GOVERNANCE,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.MEDIUM,
    stem: "Fabrikam needs to deploy resources only to specific Azure regions for data sovereignty. The list of allowed regions must be enforced consistently across all current and future subscriptions in the company's tenant. What should you do?",
    options: [
      { id: "A", text: "Assign an 'Allowed locations' policy at the tenant root management group." },
      { id: "B", text: "Add tags to each subscription specifying the allowed regions." },
      { id: "C", text: "Configure the Owner of each subscription with a custom role limiting region usage." },
      { id: "D", text: "Use Azure Blueprints to deploy a policy assignment per subscription." },
    ],
    correctIds: ["A"],
    explanation: "Policies assigned at the tenant root management group inherit down to all current and future subscriptions. This is the only option that scales automatically. Tags don't enforce anything. RBAC cannot scope by region. Blueprints work but require per-subscription deployment — they don't auto-apply to new subscriptions unless paired with the management-group strategy.",
    distractorRationale: {
      B: "Tags are metadata, not constraints.",
      C: "RBAC has no region-scoped concept.",
      D: "Blueprints require explicit per-subscription assignment.",
    },
    references: [
      { title: "Management group policy inheritance", url: "https://learn.microsoft.com/azure/governance/management-groups/overview" },
    ],
    tags: ["policy", "management-groups", "data-sovereignty"],
  },
  {
    objective: ExamObjective.IDENTITIES_GOVERNANCE,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.HARD,
    stem: "You enable Conditional Access with a policy that requires compliant devices for Microsoft 365 access. After enablement, several remote users on non-managed devices report being locked out. What's the recommended way to maintain security while restoring access?",
    options: [
      { id: "A", text: "Disable Conditional Access globally." },
      { id: "B", text: "Configure named locations to include users' home IPs and exempt them." },
      { id: "C", text: "Use report-only mode initially, identify affected users, then enroll their devices in Intune before enforcing." },
      { id: "D", text: "Reduce the policy strictness to 'require MFA' instead of 'require compliant device'." },
    ],
    correctIds: ["C"],
    explanation: "Report-only mode is the recommended rollout pattern for new CA policies — it logs what would happen without blocking. Use the data to identify impact, remediate (enroll devices), then flip to enforced. Disabling CA removes the control entirely. Exempting home IPs undermines the requirement. Reducing strictness defeats the purpose of the compliant-device requirement.",
    distractorRationale: {
      A: "Removes the security control entirely.",
      B: "Geographic exemptions undercut the compliance requirement.",
      D: "Weakens the policy rather than rolling out properly.",
    },
    references: [
      { title: "Conditional Access report-only", url: "https://learn.microsoft.com/entra/identity/conditional-access/concept-conditional-access-report-only" },
    ],
    tags: ["conditional-access", "report-only", "rollout"],
  },

  // ────────────── Storage ──────────────
  {
    objective: ExamObjective.STORAGE,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.MEDIUM,
    stem: "You enable Blob versioning on a storage account. Soft delete is also enabled with a 30-day retention. A user deletes a blob, then realises they need to recover the most recent version. What's the most efficient recovery path?",
    options: [
      { id: "A", text: "Use the Undelete operation to restore the current version from soft delete." },
      { id: "B", text: "Restore from Azure Backup with point-in-time recovery." },
      { id: "C", text: "Promote the most recent prior version to the current version via the portal or REST API." },
      { id: "D", text: "Contact Microsoft Support — versioned blobs cannot be self-recovered." },
    ],
    correctIds: ["A"],
    explanation: "With both versioning and soft delete enabled, deleting a blob preserves versions in soft delete. Undelete restores both the current version and any soft-deleted versions in one operation. Promoting a prior version (option C) works but is less efficient when soft delete is enabled. Azure Backup is overkill if soft delete suffices. Self-recovery is fully supported.",
    distractorRationale: {
      B: "Backup is unnecessary when soft delete is configured.",
      C: "Works but is more steps than the built-in undelete.",
      D: "Not true — undelete is the supported self-service path.",
    },
    references: [
      { title: "Blob soft delete + versioning", url: "https://learn.microsoft.com/azure/storage/blobs/soft-delete-blob-overview" },
    ],
    tags: ["blob", "soft-delete", "versioning"],
  },
  {
    objective: ExamObjective.STORAGE,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.HARD,
    stem: "Tailwind Traders uses Azure Files Premium for an HPC workload. They observe consistent latency at ~5 ms, well below the workload's 10 ms SLO. To reduce cost, they consider switching to Standard. Which factor should they evaluate FIRST?",
    options: [
      { id: "A", text: "Whether their workload's transaction volume would cost more under Standard's per-transaction pricing." },
      { id: "B", text: "Whether Standard supports SMB Multichannel." },
      { id: "C", text: "Whether they could keep the same storage account kind." },
      { id: "D", text: "Whether their share size exceeds the Standard tier maximum." },
    ],
    correctIds: ["A"],
    explanation: "Premium pricing is provisioned-capacity flat; Standard is per-transaction. High-IOPS workloads can pay more under Standard than Premium despite the per-GB savings. This is the first sanity check before migrating. (Standard also lacks SMB Multichannel and uses HDD, so latency would worsen — but cost reversal is the deciding question.)",
    distractorRationale: {
      B: "Lack of Multichannel matters but is secondary to the cost calculation.",
      C: "FileStorage (Premium) and StorageV2 (Standard) are different kinds; migration involves re-creating the share. True, but secondary.",
      D: "Both tiers support large shares.",
    },
    references: [
      { title: "Azure Files pricing", url: "https://azure.microsoft.com/pricing/details/storage/files/" },
    ],
    tags: ["azure-files", "pricing", "premium"],
  },
  {
    objective: ExamObjective.STORAGE,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.MEDIUM,
    stem: "A storage account is configured for RA-GRS. An application reads from the secondary endpoint with eventual consistency. The application reports stale reads of up to 15 minutes. What is the most likely cause?",
    options: [
      { id: "A", text: "Network latency between the application and the secondary region." },
      { id: "B", text: "Geo-replication lag from primary to secondary is asynchronous and can be several minutes." },
      { id: "C", text: "The storage account requires Premium tier for sub-minute geo-replication." },
      { id: "D", text: "RA-GRS does not support read scale-out; reads always go to primary." },
    ],
    correctIds: ["B"],
    explanation: "Geo-replication in GRS variants is asynchronous. The 'Last Sync Time' property tells you how far behind the secondary is. Stale reads of minutes are expected behavior, not a bug. Applications using -secondary endpoints must tolerate this. There is no Premium tier that changes this.",
    distractorRationale: {
      A: "Network latency wouldn't cause stale reads, just slower fresh ones.",
      C: "Premium doesn't offer sub-minute geo-replication.",
      D: "RA does grant read access to the secondary.",
    },
    references: [
      { title: "Designing for high availability with RA-GRS", url: "https://learn.microsoft.com/azure/storage/common/storage-disaster-recovery-guidance" },
    ],
    tags: ["ra-grs", "consistency", "replication"],
  },
  {
    objective: ExamObjective.STORAGE,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.MEDIUM,
    stem: "You need to permit a partner organization to upload large files to a single blob container for a 7-day promotional campaign, without giving them an Azure account or your storage account keys. Which option meets the requirement with the least administrative overhead?",
    options: [
      { id: "A", text: "Create a guest user in Entra ID and grant the Storage Blob Data Contributor role." },
      { id: "B", text: "Generate a User Delegation SAS scoped to the container with write permission and a 7-day expiry." },
      { id: "C", text: "Configure CORS on the storage account and share the public endpoint URL." },
      { id: "D", text: "Share the storage account key over a secure channel and instruct them to rotate it after 7 days." },
    ],
    correctIds: ["B"],
    explanation: "User Delegation SAS is the modern preferred option — signed with Entra ID credentials, scoped to a specific container with specific permissions, time-limited. No partner identity onboarding required. Guest users add directory overhead. CORS doesn't grant write. Sharing keys is a security anti-pattern.",
    distractorRationale: {
      A: "Significant directory overhead vs SAS.",
      C: "CORS controls browser cross-origin behaviour, not authorization.",
      D: "Sharing the master key violates security best practice.",
    },
    references: [
      { title: "Create user delegation SAS", url: "https://learn.microsoft.com/azure/storage/blobs/storage-blob-user-delegation-sas-create-cli" },
    ],
    tags: ["sas", "user-delegation", "external-access"],
  },

  // ────────────── Compute ──────────────
  {
    objective: ExamObjective.COMPUTE,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.MEDIUM,
    stem: "An Azure VM has been deallocated for cost savings. The team wants to retain the VM definition but reduce the running cost. Which of the following continues to incur charges while the VM is deallocated?",
    options: [
      { id: "A", text: "VM compute (per-second pricing)." },
      { id: "B", text: "Managed disks and any reserved public IPs." },
      { id: "C", text: "Network egress charges." },
      { id: "D", text: "VM extension execution charges." },
    ],
    correctIds: ["B"],
    explanation: "Deallocating a VM stops compute billing. Storage (managed disks) and any Static public IP reservations continue to bill, as do any resources that are independent of VM state (e.g. a storage account, an attached Load Balancer SKU). Network egress requires running traffic. Extensions don't run on a deallocated VM.",
    distractorRationale: {
      A: "Compute is the cost that stops.",
      C: "No traffic flows from a deallocated VM.",
      D: "Extensions don't run on a deallocated VM.",
    },
    references: [
      { title: "VM states and billing", url: "https://learn.microsoft.com/azure/virtual-machines/states-billing" },
    ],
    tags: ["vm", "deallocation", "billing"],
  },
  {
    objective: ExamObjective.COMPUTE,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.HARD,
    stem: "You deploy a Windows VM with an Azure Compute Gallery image. The deployment succeeds but the VM hangs at boot with no console output. You have already enabled boot diagnostics. What's the first thing to check?",
    options: [
      { id: "A", text: "The boot diagnostics blade for screenshots/serial console output." },
      { id: "B", text: "Whether the gallery image is generalized (sysprepped) vs specialized." },
      { id: "C", text: "Whether the VM has a public IP." },
      { id: "D", text: "Whether the VM size is supported in the region." },
    ],
    correctIds: ["A"],
    explanation: "Boot diagnostics capture the VM's serial console and screenshots. This is the primary diagnostic tool for VMs that don't boot. Even if the image is wrong (option B is a possible root cause), the serial console / screenshot tells you the actual symptom (BSOD, missing driver, sysprep loop). Always investigate diagnostics first, then form a hypothesis.",
    distractorRationale: {
      B: "Possible root cause but you check diagnostics first.",
      C: "PIP doesn't affect boot.",
      D: "Region/size issues fail deployment, not boot.",
    },
    references: [
      { title: "Boot diagnostics", url: "https://learn.microsoft.com/azure/virtual-machines/boot-diagnostics" },
    ],
    tags: ["vm", "boot", "troubleshooting"],
  },
  {
    objective: ExamObjective.COMPUTE,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.MEDIUM,
    stem: "A team wants to standardize the OS image for all new VMs across multiple subscriptions and regions. The image must be versionable, replicated, and centrally managed. Which Azure service should they use?",
    options: [
      { id: "A", text: "Azure Compute Gallery with image definitions and replicated versions." },
      { id: "B", text: "Azure Image Builder configured per subscription." },
      { id: "C", text: "Managed disk snapshots stored in a central resource group." },
      { id: "D", text: "Microsoft Defender for Cloud image scanning." },
    ],
    correctIds: ["A"],
    explanation: "Azure Compute Gallery (formerly Shared Image Gallery) supports image definitions, versioned image versions, and multi-region replication, with RBAC-controlled cross-subscription sharing. Image Builder creates images but doesn't manage distribution. Snapshots aren't versionable and don't replicate. Defender is a security service, not image distribution.",
    distractorRationale: {
      B: "Image Builder creates, ACG distributes — both are useful but the question is about distribution.",
      C: "Snapshots aren't a managed image distribution mechanism.",
      D: "Defender is for security posture, not image lifecycle.",
    },
    references: [
      { title: "Azure Compute Gallery", url: "https://learn.microsoft.com/azure/virtual-machines/azure-compute-gallery" },
    ],
    tags: ["compute-gallery", "images"],
  },

  // ────────────── Virtual Networking ──────────────
  {
    objective: ExamObjective.VIRTUAL_NETWORKING,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.MEDIUM,
    stem: "You have a VM that needs both a public IP for outbound internet and a private IP for VNet traffic. Currently the VM has one NIC with a static private IP and no public IP. Outbound internet works (via system route), but you want to assign a specific reserved public IP. What's the simplest approach?",
    options: [
      { id: "A", text: "Create a Standard public IP and associate it with the existing NIC's primary IP configuration." },
      { id: "B", text: "Add a second NIC to the VM and place the public IP there." },
      { id: "C", text: "Re-deploy the VM with the public IP attached." },
      { id: "D", text: "Configure the VM's OS to bind directly to the public IP using IP forwarding." },
    ],
    correctIds: ["A"],
    explanation: "Public IPs attach to NIC IP configurations. You can associate a public IP to an existing NIC's primary IP config without redeploying. Adding a second NIC is overkill. OS-level IP binding is not how Azure surfaces public IPs.",
    distractorRationale: {
      B: "Adds complexity (multiple NICs) without benefit.",
      C: "Unnecessary — public IPs are hot-attachable.",
      D: "Azure VMs don't see the public IP in their OS by design.",
    },
    references: [
      { title: "Public IPs", url: "https://learn.microsoft.com/azure/virtual-network/ip-services/public-ip-addresses" },
    ],
    tags: ["public-ip", "nic"],
  },
  {
    objective: ExamObjective.VIRTUAL_NETWORKING,
    type: QuestionType.MULTIPLE_RESPONSE,
    difficulty: Difficulty.HARD,
    stem: "You need to expose an internal Azure VM-hosted website to specific external partners. The solution must support TLS 1.3, URL-path routing, and a WAF. Which TWO services together meet the requirement?",
    options: [
      { id: "A", text: "Azure Application Gateway WAF_v2 with a public frontend." },
      { id: "B", text: "Azure Front Door Premium with a private origin reachable via Private Link." },
      { id: "C", text: "Azure Load Balancer Standard with a public IP." },
      { id: "D", text: "Azure Bastion as the only entry point." },
    ],
    correctIds: ["A", "B"],
    explanation: "Both Application Gateway WAF_v2 (regional) and Front Door Premium (global) satisfy the requirements — TLS 1.3, URL/path routing, WAF. Either is a valid solution; the question says 'which TWO services together meet the requirement' meaning 'which two are each correct individually'. Standard Load Balancer is L4 (no URL routing, no WAF). Bastion is for management access, not workload exposure.",
    distractorRationale: {
      C: "L4 only.",
      D: "Bastion is for management, not workload traffic.",
    },
    references: [
      { title: "Front Door vs App Gateway", url: "https://learn.microsoft.com/azure/architecture/guide/technology-choices/load-balancing-overview" },
    ],
    tags: ["application-gateway", "front-door", "waf"],
  },
  {
    objective: ExamObjective.VIRTUAL_NETWORKING,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.MEDIUM,
    stem: "You configure a VPN Gateway with active-active mode. The gateway has two public IPs and two IPSec tunnels to the on-prem device. Despite this, when one Azure gateway instance fails, traffic momentarily drops for ~30 seconds. What is the cause?",
    options: [
      { id: "A", text: "Active-active VPN gateways require BGP for graceful failover; without BGP, route convergence takes ~30 seconds." },
      { id: "B", text: "Active-active mode is not supported for cross-region VPN." },
      { id: "C", text: "The on-prem device must use IKEv2; IKEv1 causes failover delays." },
      { id: "D", text: "Active-active gateways always have a 30-second failover window — this is by design." },
    ],
    correctIds: ["A"],
    explanation: "Active-active VPN gateways work best when paired with BGP. BGP advertises routes from both tunnels simultaneously, so the on-prem device can re-route within seconds when one tunnel goes down. Without BGP, both tunnels still operate but failover relies on static-route convergence (tunnel-down detection plus route table updates), introducing the observed delay.",
    distractorRationale: {
      B: "Active-active is supported.",
      C: "IKE version doesn't determine failover time.",
      D: "Sub-second failover is achievable with BGP.",
    },
    references: [
      { title: "Active-active VPN gateways", url: "https://learn.microsoft.com/azure/vpn-gateway/vpn-gateway-highlyavailable" },
    ],
    tags: ["vpn", "active-active", "bgp"],
  },
  {
    objective: ExamObjective.VIRTUAL_NETWORKING,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.MEDIUM,
    stem: "You configure DDoS Protection Standard on a VNet. Three weeks later, a DDoS attack triggers the service. Which feature provides the FASTEST recovery and forensic data?",
    options: [
      { id: "A", text: "Automatic attack mitigation by Azure with detailed telemetry exported to Log Analytics." },
      { id: "B", text: "A support credit refund for the attack period." },
      { id: "C", text: "An on-call DDoS Rapid Response team that engages with you during the attack." },
      { id: "D", text: "Manual escalation to Microsoft Defender for Cloud." },
    ],
    correctIds: ["A"],
    explanation: "DDoS Protection Standard performs automatic mitigation and exports rich telemetry (attack vectors, mitigation reports, flow logs) to Azure Monitor / Log Analytics. The Rapid Response team (option C) is a real benefit but engages on demand, not automatically. SLA credits exist but aren't recovery. Defender escalation is unrelated.",
    distractorRationale: {
      B: "Credits compensate but don't accelerate recovery.",
      C: "Real but reactive; automatic mitigation is the fastest layer.",
      D: "Defender is for posture, not active DDoS.",
    },
    references: [
      { title: "DDoS Protection Standard", url: "https://learn.microsoft.com/azure/ddos-protection/ddos-protection-overview" },
    ],
    tags: ["ddos", "monitoring"],
  },

  // ────────────── Monitoring & Backup ──────────────
  {
    objective: ExamObjective.MONITORING_BACKUP,
    type: QuestionType.CLI_TROUBLESHOOT,
    difficulty: Difficulty.MEDIUM,
    stem: "You need a KQL query against a Log Analytics workspace that returns the top 10 Azure VMs by CPU usage averaged over the past hour. Which query is correct?",
    options: [
      { id: "A", text: "Perf | where TimeGenerated > ago(1h) and CounterName == '% Processor Time' | summarize avg(CounterValue) by Computer | top 10 by avg_CounterValue desc" },
      { id: "B", text: "Heartbeat | where TimeGenerated > ago(1h) | summarize count() by Computer | take 10" },
      { id: "C", text: "AzureMetrics | where MetricName == 'Percentage CPU' | top 10" },
      { id: "D", text: "Perf | take 10 | order by CounterValue desc" },
    ],
    correctIds: ["A"],
    explanation: "Option A correctly filters by the CPU performance counter, aggregates per computer over the time window, and returns the top 10. Heartbeat is for availability not CPU. AzureMetrics uses platform metrics (different table, different schema). Option D takes 10 random rows before ordering, which is wrong.",
    distractorRationale: {
      B: "Heartbeat counts probes, not CPU.",
      C: "AzureMetrics is a different table; the query is incomplete.",
      D: "'take' before 'order by' selects random rows.",
    },
    references: [
      { title: "KQL quick reference", url: "https://learn.microsoft.com/azure/data-explorer/kql-quick-reference" },
    ],
    tags: ["kql", "log-analytics"],
  },
  {
    objective: ExamObjective.MONITORING_BACKUP,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.MEDIUM,
    stem: "Contoso runs Azure Backup on 200 VMs with a daily policy and 30-day retention. The backup admin needs to take an immediate on-demand backup of a critical VM before maintenance. Where in the portal is this triggered?",
    options: [
      { id: "A", text: "Recovery Services Vault → Backup items → select the VM → Backup now." },
      { id: "B", text: "Virtual Machine → Operations → Snapshot." },
      { id: "C", text: "Recovery Services Vault → Replicated items → Failover now." },
      { id: "D", text: "Subscription → Resource Health → Take snapshot." },
    ],
    correctIds: ["A"],
    explanation: "On-demand backups are triggered from Backup items in the Recovery Services Vault. The Backup Now command creates an out-of-policy recovery point with its own retention. VM snapshots (option B) are disk snapshots, not Azure Backup recovery points. Replicated items is ASR. Resource Health is not a snapshot tool.",
    distractorRationale: {
      B: "Disk snapshots ≠ Azure Backup recovery points.",
      C: "Replicated items is ASR.",
      D: "Resource Health is for service availability information.",
    },
    references: [
      { title: "On-demand backup", url: "https://learn.microsoft.com/azure/backup/backup-azure-manage-vms" },
    ],
    tags: ["backup", "on-demand"],
  },
  {
    objective: ExamObjective.MONITORING_BACKUP,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.HARD,
    stem: "An Azure VM is regularly backed up to a Recovery Services Vault using a Standard policy. A ransomware incident encrypts the VM's disks. The IT team enables soft delete enhancements (always-on) AFTER the incident. Can the backups be relied upon for clean recovery?",
    options: [
      { id: "A", text: "Yes — soft delete protects existing backups from any prior deletion attempt." },
      { id: "B", text: "Only if the backups were taken before the ransomware encrypted the disks." },
      { id: "C", text: "No — the always-on protection cannot be applied retroactively, and any deletion attempts before enabling have already removed prior recovery points." },
      { id: "D", text: "Yes — Microsoft retains an additional copy in a paired region for ransomware scenarios." },
    ],
    correctIds: ["B"],
    explanation: "Backups taken BEFORE the ransomware encrypted the disks contain clean data and are recoverable. Backups taken after the encryption are themselves encrypted. Soft delete protects against malicious deletion but doesn't filter content. The 'before' criterion is the deciding factor for clean recovery.",
    distractorRationale: {
      A: "True but doesn't address whether the data is clean.",
      C: "Always-on is forward-looking; existing recovery points still exist.",
      D: "Microsoft doesn't keep undisclosed additional copies for ransomware.",
    },
    references: [
      { title: "Ransomware protection with Backup", url: "https://learn.microsoft.com/azure/backup/protect-against-ransomware" },
    ],
    tags: ["backup", "ransomware", "soft-delete"],
  },
  {
    objective: ExamObjective.MONITORING_BACKUP,
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: Difficulty.MEDIUM,
    stem: "You configure Azure Monitor to alert when a Log Analytics workspace exceeds a daily ingestion cap. The cap was hit yesterday but the alert never fired. What is the most likely cause?",
    options: [
      { id: "A", text: "The daily cap is itself enforced by stopping ingestion, so no further events (including alerts based on those events) are processed until the cap resets." },
      { id: "B", text: "Daily cap alerts must be configured as Activity Log alerts, not metric alerts." },
      { id: "C", text: "Daily cap alerts require Microsoft Sentinel." },
      { id: "D", text: "The action group did not include an SMS receiver." },
    ],
    correctIds: ["A"],
    explanation: "Hitting the daily cap stops ingestion of all new data into the workspace until the next 24-hour period. If your alert depends on ingested data to fire, it cannot run after the cap is hit. Use a separate metric/health alert (or budget alerts) for cap visibility — or set a 'reaching cap' threshold below 100% so the alert can run before ingestion halts.",
    distractorRationale: {
      B: "Activity Log alerts work but option A is the actual reason the alert didn't fire.",
      C: "Sentinel is not required.",
      D: "Receiver type doesn't determine whether the alert fires.",
    },
    references: [
      { title: "Daily cap behaviour", url: "https://learn.microsoft.com/azure/azure-monitor/logs/daily-cap" },
    ],
    tags: ["log-analytics", "daily-cap", "alerts"],
  },
];
