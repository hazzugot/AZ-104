/**
 * Seed data: hand-curated AZ-104 flashcards.
 *
 * Single-fact, single-answer cards optimised for active recall. Mnemonics
 * are included only where they genuinely aid memorisation.
 */
export interface FlashcardSeed {
  moduleSlug: string;
  unitSlug?: string;
  front: string;
  back: string;
  mnemonic?: string;
  category: string;
  difficulty: number;
}

export const FLASHCARDS: FlashcardSeed[] = [
  // ────────────── Identities & Governance ──────────────
  { moduleSlug: "manage-azure-identities-governance", unitSlug: "microsoft-entra-id", front: "Which Entra ID edition is required for Privileged Identity Management (PIM)?", back: "P2 (also: Identity Protection, access reviews).", mnemonic: "P2 = Privileged + Protection.", category: "Identity", difficulty: 1 },
  { moduleSlug: "manage-azure-identities-governance", unitSlug: "microsoft-entra-id", front: "Which Entra ID edition is required for Conditional Access?", back: "P1.", category: "Identity", difficulty: 1 },
  { moduleSlug: "manage-azure-identities-governance", unitSlug: "microsoft-entra-id", front: "Three on-prem authentication methods supported by Entra Connect.", back: "Password Hash Sync (PHS), Pass-through Authentication (PTA), Federation (AD FS).", mnemonic: "PHS-PTA-FED.", category: "Identity", difficulty: 2 },
  { moduleSlug: "manage-azure-identities-governance", unitSlug: "microsoft-entra-id", front: "Which sync method continues to work during an on-prem outage?", back: "Password Hash Sync (PHS).", category: "Identity", difficulty: 2 },
  { moduleSlug: "manage-azure-identities-governance", unitSlug: "users-and-groups", front: "What does Entra ID dynamic group membership require?", back: "Microsoft Entra ID P1 or higher.", category: "Identity", difficulty: 1 },
  { moduleSlug: "manage-azure-identities-governance", unitSlug: "users-and-groups", front: "Which property must be set on a user before assigning a licensed plan with regional restrictions?", back: "usageLocation.", category: "Identity", difficulty: 2 },
  { moduleSlug: "manage-azure-identities-governance", unitSlug: "users-and-groups", front: "Which PowerShell module is supported for Entra ID administration today?", back: "Microsoft Graph PowerShell (Get-MgUser, etc.). MSOnline and AzureAD modules are deprecated.", category: "Identity", difficulty: 1 },
  { moduleSlug: "manage-azure-identities-governance", unitSlug: "rbac", front: "Difference between Owner and Contributor?", back: "Owner can assign roles (Microsoft.Authorization/*). Contributor cannot.", category: "RBAC", difficulty: 1 },
  { moduleSlug: "manage-azure-identities-governance", unitSlug: "rbac", front: "Four scope levels in Azure RBAC, broad to narrow.", back: "Management Group → Subscription → Resource Group → Resource.", mnemonic: "MG-Sub-RG-Res", category: "RBAC", difficulty: 1 },
  { moduleSlug: "manage-azure-identities-governance", unitSlug: "rbac", front: "Which roles can create or delete resource locks?", back: "Owner and User Access Administrator (Microsoft.Authorization/locks/* permission).", category: "RBAC", difficulty: 2 },
  { moduleSlug: "manage-azure-identities-governance", unitSlug: "rbac", front: "Difference between Storage Account Contributor and Storage Blob Data Contributor?", back: "Account Contributor = management plane (settings, keys). Blob Data Contributor = data plane (read/write blobs via Entra ID).", category: "RBAC", difficulty: 2 },
  { moduleSlug: "manage-azure-identities-governance", unitSlug: "rbac", front: "Which lock type allows reads but blocks updates and deletes?", back: "ReadOnly.", category: "RBAC", difficulty: 1 },
  { moduleSlug: "manage-azure-identities-governance", unitSlug: "rbac", front: "How are deny assignments created?", back: "Automatically by Azure Blueprints and Managed Applications — you cannot author them manually.", category: "RBAC", difficulty: 3 },
  { moduleSlug: "manage-azure-identities-governance", unitSlug: "azure-policy", front: "What does the DeployIfNotExists policy effect require?", back: "A system-assigned managed identity with sufficient role permissions to deploy the remediation template.", category: "Policy", difficulty: 2 },
  { moduleSlug: "manage-azure-identities-governance", unitSlug: "azure-policy", front: "Difference between Audit and Deny effects in Azure Policy?", back: "Audit reports non-compliance without blocking. Deny prevents non-compliant resource creation or update.", category: "Policy", difficulty: 1 },
  { moduleSlug: "manage-azure-identities-governance", unitSlug: "azure-policy", front: "How often does Azure Policy evaluate existing resources?", back: "Every 24 hours, plus on resource create/update and on demand.", category: "Policy", difficulty: 2 },
  { moduleSlug: "manage-azure-identities-governance", unitSlug: "azure-policy", front: "What is a Policy Initiative?", back: "A named bundle of related policies assigned together (e.g. ISO 27001, NIST 800-53).", category: "Policy", difficulty: 1 },

  // ────────────── Storage ──────────────
  { moduleSlug: "implement-manage-storage", unitSlug: "storage-accounts", front: "How many copies and where does LRS store data?", back: "3 copies in a single datacenter (one zone).", category: "Storage", difficulty: 1 },
  { moduleSlug: "implement-manage-storage", unitSlug: "storage-accounts", front: "How many copies and where does GZRS store data?", back: "6 copies. 3 across availability zones in primary region, 3 in paired region.", category: "Storage", difficulty: 2 },
  { moduleSlug: "implement-manage-storage", unitSlug: "storage-accounts", front: "Which redundancy option provides read access to a secondary region replica with zone resilience in the primary?", back: "RA-GZRS.", mnemonic: "RA = Read Access, GZRS = Geo + Zone.", category: "Storage", difficulty: 2 },
  { moduleSlug: "implement-manage-storage", unitSlug: "storage-accounts", front: "Minimum storage duration before Archive tier early-deletion fees apply?", back: "180 days.", category: "Storage", difficulty: 2 },
  { moduleSlug: "implement-manage-storage", unitSlug: "storage-accounts", front: "Minimum storage duration before Cool tier early-deletion fees apply?", back: "30 days.", category: "Storage", difficulty: 2 },
  { moduleSlug: "implement-manage-storage", unitSlug: "storage-accounts", front: "Which storage account kind is required for Premium Azure Files?", back: "FileStorage.", category: "Storage", difficulty: 2 },
  { moduleSlug: "implement-manage-storage", unitSlug: "storage-accounts", front: "Which storage account kind is required for Premium block blobs?", back: "BlockBlobStorage.", category: "Storage", difficulty: 2 },
  { moduleSlug: "implement-manage-storage", unitSlug: "storage-accounts", front: "Default and recommended storage account kind for general use?", back: "StorageV2 (general purpose v2).", category: "Storage", difficulty: 1 },
  { moduleSlug: "implement-manage-storage", unitSlug: "blob-storage", front: "Three blob types and what each is best for.", back: "Block (files, streaming), Append (logs — append only), Page (VHDs / random read-write).", category: "Storage", difficulty: 2 },
  { moduleSlug: "implement-manage-storage", unitSlug: "blob-storage", front: "Can Hierarchical Namespace (ADLS Gen2) be turned off after enabling?", back: "No. HNS is irreversible. You must migrate to a new account.", category: "Storage", difficulty: 2 },
  { moduleSlug: "implement-manage-storage", unitSlug: "blob-storage", front: "How often do lifecycle management policies run?", back: "Once per day.", category: "Storage", difficulty: 2 },
  { moduleSlug: "implement-manage-storage", unitSlug: "blob-storage", front: "Three SAS types in order of preference?", back: "User Delegation SAS (best, signed by Entra ID), Service SAS, Account SAS.", category: "Storage", difficulty: 3 },
  { moduleSlug: "implement-manage-storage", unitSlug: "azure-files", front: "Authentication options for Azure Files SMB shares?", back: "On-prem AD DS, Microsoft Entra Domain Services, or storage account key.", category: "Storage", difficulty: 2 },
  { moduleSlug: "implement-manage-storage", unitSlug: "azure-files", front: "What does Azure File Sync's cloud tiering do?", back: "Keeps frequently accessed files local on the Windows server and ages cold files out to Azure Files; cloud share is source of truth.", category: "Storage", difficulty: 2 },
  { moduleSlug: "implement-manage-storage", unitSlug: "azure-files", front: "Which tier supports SMB Multichannel?", back: "Premium (FileStorage account) only.", category: "Storage", difficulty: 3 },
  { moduleSlug: "implement-manage-storage", unitSlug: "azure-files", front: "Which port must be open for SMB to Azure Files?", back: "TCP 445. (Often blocked by ISPs — use VPN/PrivateLink.)", category: "Storage", difficulty: 2 },

  // ────────────── Compute ──────────────
  { moduleSlug: "deploy-manage-compute", unitSlug: "vms", front: "Single-instance VM SLA prerequisite?", back: "All OS and data disks must be Premium SSD or better.", category: "Compute", difficulty: 2 },
  { moduleSlug: "deploy-manage-compute", unitSlug: "vms", front: "Can you add an existing VM to an availability set?", back: "No. You must redeploy the VM.", category: "Compute", difficulty: 1 },
  { moduleSlug: "deploy-manage-compute", unitSlug: "vms", front: "Can you change a VM's availability zone after creation?", back: "No. You must capture an image and redeploy.", category: "Compute", difficulty: 2 },
  { moduleSlug: "deploy-manage-compute", unitSlug: "vms", front: "Availability set SLA?", back: "99.95%. Across fault and update domains in one datacenter.", category: "Compute", difficulty: 2 },
  { moduleSlug: "deploy-manage-compute", unitSlug: "vms", front: "Availability zone SLA?", back: "99.99% (when VMs span 2+ zones).", category: "Compute", difficulty: 2 },
  { moduleSlug: "deploy-manage-compute", unitSlug: "vms", front: "What happens to disks, NIC, and PIP when `az vm delete` runs by default?", back: "They remain. CLI does NOT cascade-delete. Use --force-deletion plus explicit cleanup.", category: "Compute", difficulty: 3 },
  { moduleSlug: "deploy-manage-compute", unitSlug: "vms", front: "Difference between generalised and specialised VM images?", back: "Generalised = sysprepped (Windows) or deprovisioned (Linux), use as template. Specialised = exact copy, retains hostname/SID.", category: "Compute", difficulty: 3 },
  { moduleSlug: "deploy-manage-compute", unitSlug: "vmss", front: "Recommended VMSS orchestration mode for new deployments?", back: "Flexible.", category: "Compute", difficulty: 1 },
  { moduleSlug: "deploy-manage-compute", unitSlug: "vmss", front: "What must autoscale rules include besides scale-out?", back: "Scale-in rules. Without them, the scale set never shrinks.", category: "Compute", difficulty: 2 },
  { moduleSlug: "deploy-manage-compute", unitSlug: "app-service", front: "Minimum App Service tier for deployment slots?", back: "Standard.", category: "Compute", difficulty: 1 },
  { moduleSlug: "deploy-manage-compute", unitSlug: "app-service", front: "Minimum App Service tier for autoscale?", back: "Standard.", category: "Compute", difficulty: 1 },
  { moduleSlug: "deploy-manage-compute", unitSlug: "app-service", front: "Difference between scale up and scale out on App Service?", back: "Scale up = bigger SKU (more CPU/RAM). Scale out = more instances at the same SKU.", category: "Compute", difficulty: 1 },
  { moduleSlug: "deploy-manage-compute", unitSlug: "app-service", front: "Is App Service VNet Integration inbound or outbound?", back: "Outbound (app's outbound traffic uses VNet). For inbound private connectivity, use Private Endpoints.", category: "Compute", difficulty: 2 },
  { moduleSlug: "deploy-manage-compute", unitSlug: "aks", front: "AKS pricing — what do you pay for?", back: "Worker nodes. Control plane is free (Standard tier). Premium tier control plane is paid.", category: "Compute", difficulty: 2 },
  { moduleSlug: "deploy-manage-compute", unitSlug: "aks", front: "Difference between cluster autoscaler and HPA?", back: "Cluster autoscaler adds/removes nodes. HPA (Horizontal Pod Autoscaler) adds/removes pod replicas.", category: "Compute", difficulty: 2 },

  // ────────────── Virtual Networking ──────────────
  { moduleSlug: "implement-manage-virtual-networking", unitSlug: "vnets", front: "How many IP addresses does Azure reserve per subnet?", back: "5 (network, gateway, two DNS, broadcast). Smallest usable subnet is /29 (3 usable).", category: "Networking", difficulty: 2 },
  { moduleSlug: "implement-manage-virtual-networking", unitSlug: "vnets", front: "Is VNet peering transitive?", back: "No. A↔B and B↔C does NOT bridge A↔C. Use UDRs through a hub firewall for spoke-to-spoke.", category: "Networking", difficulty: 1 },
  { moduleSlug: "implement-manage-virtual-networking", unitSlug: "vnets", front: "What must be true for VNets to peer?", back: "Address spaces must not overlap. Both VNets must be in the same tenant (or use cross-tenant peering options).", category: "Networking", difficulty: 2 },
  { moduleSlug: "implement-manage-virtual-networking", unitSlug: "vnets", front: "Required GatewaySubnet name and recommended size?", back: "Name must be exactly 'GatewaySubnet'. /27 is recommended.", category: "Networking", difficulty: 1 },
  { moduleSlug: "implement-manage-virtual-networking", unitSlug: "vnets", front: "Difference between service endpoints and private endpoints?", back: "Service endpoint = subnet uses a Microsoft-routed path to a service public IP. Private endpoint = service gets a private IP in your VNet.", category: "Networking", difficulty: 2 },
  { moduleSlug: "implement-manage-virtual-networking", unitSlug: "vnets", front: "What's required for private endpoint DNS resolution?", back: "A Private DNS zone (privatelink.<service>.core.windows.net) linked to consuming VNets.", category: "Networking", difficulty: 2 },
  { moduleSlug: "implement-manage-virtual-networking", unitSlug: "nsg", front: "Are NSGs stateful?", back: "Yes. Permitted outbound flow's return traffic is allowed automatically.", category: "Networking", difficulty: 1 },
  { moduleSlug: "implement-manage-virtual-networking", unitSlug: "nsg", front: "Default outbound to internet on a new NSG?", back: "Allowed (AllowInternetOutBound at priority 65001).", category: "Networking", difficulty: 2 },
  { moduleSlug: "implement-manage-virtual-networking", unitSlug: "nsg", front: "Default inbound from internet on a new NSG?", back: "Denied (DenyAllInBound at priority 65500).", category: "Networking", difficulty: 1 },
  { moduleSlug: "implement-manage-virtual-networking", unitSlug: "nsg", front: "Priority rules in NSGs — lower or higher number wins?", back: "Lower number = higher priority = evaluated first.", category: "Networking", difficulty: 1 },
  { moduleSlug: "implement-manage-virtual-networking", unitSlug: "nsg", front: "What's an Application Security Group?", back: "A label/group for VMs used in NSG rules. Membership is dynamic — add/remove VMs without rewriting rules.", category: "Networking", difficulty: 2 },
  { moduleSlug: "implement-manage-virtual-networking", unitSlug: "load-balancer", front: "Difference between Azure Load Balancer and Application Gateway?", back: "ALB = L4 (TCP/UDP). AG = L7 (HTTP/HTTPS, URL/path routing, optional WAF).", category: "Networking", difficulty: 1 },
  { moduleSlug: "implement-manage-virtual-networking", unitSlug: "load-balancer", front: "Default outbound internet behaviour of Standard Load Balancer?", back: "None. You must configure outbound rules or pair with NAT Gateway.", category: "Networking", difficulty: 2 },
  { moduleSlug: "implement-manage-virtual-networking", unitSlug: "load-balancer", front: "Which Application Gateway SKU includes a WAF?", back: "WAF_v2.", category: "Networking", difficulty: 1 },
  { moduleSlug: "implement-manage-virtual-networking", unitSlug: "load-balancer", front: "Difference between Application Gateway and Front Door?", back: "App Gateway is regional. Front Door is global. Both are L7.", category: "Networking", difficulty: 2 },
  { moduleSlug: "implement-manage-virtual-networking", unitSlug: "vpn-er", front: "Does ExpressRoute encrypt traffic by default?", back: "No. Add MACsec at the carrier or IPSec on top for encryption.", category: "Networking", difficulty: 2 },
  { moduleSlug: "implement-manage-virtual-networking", unitSlug: "vpn-er", front: "Authentication options for Point-to-Site VPN?", back: "Certificate, Microsoft Entra ID (OpenVPN protocol), or RADIUS.", category: "Networking", difficulty: 2 },

  // ────────────── Monitoring & Backup ──────────────
  { moduleSlug: "monitor-maintain-azure", unitSlug: "azure-monitor", front: "Current supported telemetry agent for Azure and on-prem VMs?", back: "Azure Monitor Agent (AMA). MMA is being retired.", category: "Monitoring", difficulty: 1 },
  { moduleSlug: "monitor-maintain-azure", unitSlug: "azure-monitor", front: "Default Log Analytics retention?", back: "30 days. Up to 730 days+ with retention tiers (Archive cheaper).", category: "Monitoring", difficulty: 2 },
  { moduleSlug: "monitor-maintain-azure", unitSlug: "azure-monitor", front: "Difference between Activity Log and Resource Logs?", back: "Activity Log = subscription-level control-plane events. Resource Logs = data-plane events per resource.", category: "Monitoring", difficulty: 2 },
  { moduleSlug: "monitor-maintain-azure", unitSlug: "azure-monitor", front: "What query language does Log Analytics use?", back: "Kusto Query Language (KQL).", category: "Monitoring", difficulty: 1 },
  { moduleSlug: "monitor-maintain-azure", unitSlug: "alerts", front: "Metric alert minimum evaluation frequency?", back: "1 minute.", category: "Monitoring", difficulty: 2 },
  { moduleSlug: "monitor-maintain-azure", unitSlug: "alerts", front: "Log alert minimum evaluation frequency?", back: "5 minutes.", category: "Monitoring", difficulty: 2 },
  { moduleSlug: "monitor-maintain-azure", unitSlug: "alerts", front: "What is an action group?", back: "Reusable bundle of notification + automation actions (email/SMS/webhook/Logic App/Function/Runbook) referenced by alert rules.", category: "Monitoring", difficulty: 1 },
  { moduleSlug: "monitor-maintain-azure", unitSlug: "backup", front: "Which vault is used for Azure VM backups?", back: "Recovery Services Vault.", category: "Backup", difficulty: 1 },
  { moduleSlug: "monitor-maintain-azure", unitSlug: "backup", front: "Which vault is used for Azure Blob, Disk, AKS, PostgreSQL backups?", back: "Backup Vault (newer).", category: "Backup", difficulty: 2 },
  { moduleSlug: "monitor-maintain-azure", unitSlug: "backup", front: "Default Azure Backup soft-delete retention?", back: "14 days (free). Enhanced soft delete extends up to 180 days with immutability.", category: "Backup", difficulty: 2 },
  { moduleSlug: "monitor-maintain-azure", unitSlug: "backup", front: "What does cross-region restore require?", back: "A vault with GRS replication enabled.", category: "Backup", difficulty: 2 },
  { moduleSlug: "monitor-maintain-azure", unitSlug: "backup", front: "How is Azure VM backup made application-consistent?", back: "VSS on Windows; pre/post scripts on Linux.", category: "Backup", difficulty: 3 },
  { moduleSlug: "monitor-maintain-azure", unitSlug: "asr", front: "Purpose of ASR vs Azure Backup?", back: "ASR = disaster recovery (replicates VMs for region failover). Azure Backup = point-in-time recovery points.", category: "Backup", difficulty: 1 },
  { moduleSlug: "monitor-maintain-azure", unitSlug: "asr", front: "What does ASR test failover do?", back: "Brings up a recovered VM in an isolated VNet without affecting source replication. Source continues replicating.", category: "Backup", difficulty: 2 },
  { moduleSlug: "monitor-maintain-azure", unitSlug: "asr", front: "After ASR failover, what's the next step before failback?", back: "Re-protect (replicate the failed-over VM back to the original region).", category: "Backup", difficulty: 2 },
];
