/**
 * Knowledge checks per unit. Layered on top of curriculum.ts so we can
 * keep the lesson bodies clean while still seeding rich quizzes.
 *
 * Indexed by `${moduleSlug}/${unitSlug}` so adding/removing checks is safe
 * and doesn't disturb the curriculum file.
 */
export interface KnowledgeCheckSeed {
  prompt: string;
  options: { id: string; text: string; isCorrect: boolean; rationale?: string }[];
  explanation: string;
  difficulty?: number;
}

export const KNOWLEDGE_CHECKS: Record<string, KnowledgeCheckSeed[]> = {
  // ────────────── Identity & Governance ──────────────
  "manage-azure-identities-governance/microsoft-entra-id": [
    {
      prompt: "An on-prem AD outage affects which Microsoft Entra ID authentication methods?",
      difficulty: 2,
      options: [
        { id: "A", text: "Only Federation (AD FS) and Pass-through Authentication.", isCorrect: true },
        { id: "B", text: "All cloud authentication methods.", isCorrect: false, rationale: "PHS still works." },
        { id: "C", text: "Only Password Hash Sync.", isCorrect: false },
        { id: "D", text: "Federation only.", isCorrect: false, rationale: "PTA also relies on on-prem connectivity." },
      ],
      explanation: "PHS stores a hash of the hash in the cloud, so cloud authentication continues even when on-prem is down. PTA relays auth to the on-prem agent; AD FS issues the token on-prem. Both fail during outage.",
    },
  ],
  "manage-azure-identities-governance/users-and-groups": [
    {
      prompt: "Which property must be set on a user before assigning a Microsoft 365 license whose service plans have regional availability constraints?",
      difficulty: 2,
      options: [
        { id: "A", text: "department", isCorrect: false },
        { id: "B", text: "usageLocation", isCorrect: true },
        { id: "C", text: "preferredLanguage", isCorrect: false },
        { id: "D", text: "country (display)", isCorrect: false, rationale: "country is a display attribute, not the licensing constraint." },
      ],
      explanation: "usageLocation is the ISO country code Microsoft uses to validate which service plans the user is allowed to consume. Without it, group-based licensing fails silently for affected service plans.",
    },
  ],
  "manage-azure-identities-governance/azure-policy": [
    {
      prompt: "Which TWO policy effects can remediate existing non-compliant resources via a remediation task? (Choose 2.)",
      difficulty: 3,
      options: [
        { id: "A", text: "Audit", isCorrect: false },
        { id: "B", text: "DeployIfNotExists", isCorrect: true },
        { id: "C", text: "Modify", isCorrect: true },
        { id: "D", text: "Deny", isCorrect: false, rationale: "Deny only blocks new resources." },
      ],
      explanation: "DeployIfNotExists deploys a remediation template; Modify can add/update/remove properties on existing resources. Both require a managed identity with sufficient permissions.",
    },
  ],

  // ────────────── Storage ──────────────
  "implement-manage-storage/storage-accounts": [
    {
      prompt: "You need region-level durability AND zone-level durability AND read access to the secondary copy. Which replication type?",
      difficulty: 2,
      options: [
        { id: "A", text: "LRS", isCorrect: false },
        { id: "B", text: "ZRS", isCorrect: false },
        { id: "C", text: "RA-GZRS", isCorrect: true },
        { id: "D", text: "RA-GRS", isCorrect: false, rationale: "RA-GRS uses LRS in the primary region — no zone resilience." },
      ],
      explanation: "RA-GZRS = ZRS in primary region (zone) + async copy to paired region (geo) + read access to secondary (RA).",
    },
  ],
  "implement-manage-storage/blob-storage": [
    {
      prompt: "After enabling Hierarchical Namespace on a storage account, what's the supported path to revert to a flat namespace?",
      difficulty: 2,
      options: [
        { id: "A", text: "Disable it from the portal.", isCorrect: false },
        { id: "B", text: "Use az storage account update with --enable-hierarchical-namespace false.", isCorrect: false },
        { id: "C", text: "Migrate data to a new storage account without HNS.", isCorrect: true },
        { id: "D", text: "Submit a support request.", isCorrect: false },
      ],
      explanation: "HNS is irreversible. The only supported reversion path is migration to a new storage account.",
    },
  ],
  "implement-manage-storage/azure-files": [
    {
      prompt: "Which authentication option for Azure Files SMB does NOT require on-premises AD DS?",
      difficulty: 2,
      options: [
        { id: "A", text: "AD DS authentication", isCorrect: false },
        { id: "B", text: "Microsoft Entra Domain Services authentication", isCorrect: true },
        { id: "C", text: "Kerberos with AD FS", isCorrect: false },
        { id: "D", text: "OAuth 2.0 device code", isCorrect: false, rationale: "SMB doesn't authenticate via OAuth." },
      ],
      explanation: "Microsoft Entra Domain Services provides Kerberos/NTLM in Azure without on-prem AD DS — ideal for cloud-only file share auth.",
    },
  ],

  // ────────────── Compute ──────────────
  "deploy-manage-compute/vms": [
    {
      prompt: "A production single-instance VM uses one Premium SSD OS disk and two Standard HDD data disks. Which SLA does Azure offer?",
      difficulty: 3,
      options: [
        { id: "A", text: "99.99%", isCorrect: false },
        { id: "B", text: "99.95%", isCorrect: false },
        { id: "C", text: "99.9%", isCorrect: false, rationale: "All disks must be Premium for the 99.9% single-instance SLA." },
        { id: "D", text: "No SLA", isCorrect: true },
      ],
      explanation: "Single-instance VM SLA (99.9%) requires ALL disks to be Premium SSD or better. Mixed configurations forfeit the SLA. Higher SLAs require Availability Sets or Zones.",
    },
  ],
  "deploy-manage-compute/vmss": [
    {
      prompt: "Why might a VM Scale Set never shrink despite low CPU usage?",
      difficulty: 2,
      options: [
        { id: "A", text: "Missing scale-in rule.", isCorrect: true },
        { id: "B", text: "Uniform orchestration mode disables scale-in.", isCorrect: false },
        { id: "C", text: "Premium SSDs prevent scale-in.", isCorrect: false },
        { id: "D", text: "Standard LB blocks scale-in.", isCorrect: false },
      ],
      explanation: "Autoscale needs both scale-out AND scale-in rules explicitly. Without a scale-in rule, the scale set only grows.",
    },
  ],
  "deploy-manage-compute/app-service": [
    {
      prompt: "A Standard S1 App Service Plan hosts a web app. You need to use a deployment slot for blue-green releases. What's the minimum required configuration change?",
      difficulty: 1,
      options: [
        { id: "A", text: "No change — Standard already supports slots.", isCorrect: true },
        { id: "B", text: "Scale up to Premium.", isCorrect: false },
        { id: "C", text: "Scale out to two instances.", isCorrect: false },
        { id: "D", text: "Move to a Free plan first.", isCorrect: false, rationale: "Free has no slots." },
      ],
      explanation: "Deployment slots are available starting at the Standard tier. S1 already supports them.",
    },
  ],
  "deploy-manage-compute/aks": [
    {
      prompt: "Which AKS network plugin assigns each pod an IP from the VNet?",
      difficulty: 2,
      options: [
        { id: "A", text: "kubenet", isCorrect: false, rationale: "kubenet uses NAT through the node IP." },
        { id: "B", text: "Azure CNI", isCorrect: true },
        { id: "C", text: "Calico", isCorrect: false, rationale: "Calico is a network policy engine, not a CNI here." },
        { id: "D", text: "BGP CNI", isCorrect: false },
      ],
      explanation: "Azure CNI gives each pod a real VNet IP, enabling first-class integration with Azure features (NSGs, Service Endpoints, Private Endpoints). It consumes more IPs than kubenet — plan VNet sizing accordingly.",
    },
  ],

  // ────────────── Virtual Networking ──────────────
  "implement-manage-virtual-networking/vnets": [
    {
      prompt: "How many IP addresses are reserved by Azure per subnet, and what's the smallest usable subnet size?",
      difficulty: 1,
      options: [
        { id: "A", text: "3 reserved, /30 minimum.", isCorrect: false },
        { id: "B", text: "5 reserved, /29 minimum.", isCorrect: true },
        { id: "C", text: "5 reserved, /27 minimum.", isCorrect: false, rationale: "/27 is the gateway subnet recommendation, not the general minimum." },
        { id: "D", text: "7 reserved, /28 minimum.", isCorrect: false },
      ],
      explanation: "Azure reserves 5 IPs per subnet (network, gateway, two DNS, broadcast). /29 (8 addresses, 3 usable) is the smallest allowed.",
    },
  ],
  "implement-manage-virtual-networking/nsg": [
    {
      prompt: "If subnet NSG-Subnet allows TCP 443 inbound and NIC NSG-NIC denies TCP 443 inbound, what happens to a request to port 443?",
      difficulty: 2,
      options: [
        { id: "A", text: "The subnet NSG wins; the request is allowed.", isCorrect: false },
        { id: "B", text: "Deny anywhere wins; the request is denied.", isCorrect: true },
        { id: "C", text: "Only the closer NSG to the workload (NIC) applies.", isCorrect: false, rationale: "Both are evaluated when both are present." },
        { id: "D", text: "Rules conflict and traffic flows in a non-deterministic state.", isCorrect: false },
      ],
      explanation: "When both NSGs are present, both are evaluated. Inbound traffic passes subnet NSG → NIC NSG; outbound passes NIC NSG → subnet NSG. A deny at any layer drops the packet.",
    },
  ],
  "implement-manage-virtual-networking/load-balancer": [
    {
      prompt: "Three Standard SKU VMs are placed behind a Standard Load Balancer. They cannot reach external HTTPS endpoints. What's the most likely cause?",
      difficulty: 2,
      options: [
        { id: "A", text: "Missing NAT Gateway or outbound rule — Standard LB doesn't provide default outbound.", isCorrect: true },
        { id: "B", text: "Standard LB requires Basic SKU PIPs.", isCorrect: false },
        { id: "C", text: "Standard LB blocks all egress by default.", isCorrect: false, rationale: "It doesn't block — it just doesn't provide SNAT." },
        { id: "D", text: "The load balancer rules must include outbound TCP 443.", isCorrect: false, rationale: "LB rules are for inbound; outbound is configured separately." },
      ],
      explanation: "Standard Load Balancer is secure-by-default: backend VMs have no implicit outbound internet. Add a NAT Gateway (preferred) or configure outbound rules on the LB.",
    },
  ],
  "implement-manage-virtual-networking/vpn-er": [
    {
      prompt: "What subnet name does an Azure VPN Gateway require?",
      difficulty: 1,
      options: [
        { id: "A", text: "VPNSubnet", isCorrect: false },
        { id: "B", text: "GatewaySubnet", isCorrect: true },
        { id: "C", text: "AzureGatewaySubnet", isCorrect: false },
        { id: "D", text: "Any subnet of /27 or larger.", isCorrect: false },
      ],
      explanation: "The subnet must be named exactly 'GatewaySubnet'. /27 is the recommended size.",
    },
  ],

  // ────────────── Monitoring & Backup ──────────────
  "monitor-maintain-azure/azure-monitor": [
    {
      prompt: "Which agent is currently the supported, non-deprecated path for collecting logs and metrics from Azure and on-prem VMs?",
      difficulty: 1,
      options: [
        { id: "A", text: "Microsoft Monitoring Agent (MMA)", isCorrect: false, rationale: "Deprecated." },
        { id: "B", text: "Azure Monitor Agent (AMA)", isCorrect: true },
        { id: "C", text: "Operations Manager agent", isCorrect: false },
        { id: "D", text: "Diagnostics extension (Azure Diagnostics)", isCorrect: false, rationale: "Older, being superseded by AMA." },
      ],
      explanation: "Azure Monitor Agent is the current standard. Configure collection via Data Collection Rules (DCRs).",
    },
  ],
  "monitor-maintain-azure/alerts": [
    {
      prompt: "You need an alert that triggers within 60 seconds when a VM's CPU exceeds 90%. Which alert type satisfies the latency requirement?",
      difficulty: 2,
      options: [
        { id: "A", text: "Log alert with 5-minute evaluation.", isCorrect: false, rationale: "5 min is the minimum log alert evaluation frequency." },
        { id: "B", text: "Metric alert on Percentage CPU.", isCorrect: true },
        { id: "C", text: "Activity Log alert.", isCorrect: false, rationale: "Activity Log captures control-plane events, not metrics." },
        { id: "D", text: "Smart Detection in App Insights.", isCorrect: false },
      ],
      explanation: "Metric alerts evaluate at 1-minute granularity — the fastest signal available.",
    },
  ],
  "monitor-maintain-azure/backup": [
    {
      prompt: "Which vault type is required for Azure VM backups?",
      difficulty: 1,
      options: [
        { id: "A", text: "Backup Vault (the newer type)", isCorrect: false, rationale: "Backup Vault is for blobs/disks/AKS." },
        { id: "B", text: "Recovery Services Vault", isCorrect: true },
        { id: "C", text: "Either — they're interchangeable.", isCorrect: false },
        { id: "D", text: "Storage account with immutability.", isCorrect: false },
      ],
      explanation: "Recovery Services Vault handles VMs, Azure Files, SQL/SAP-in-VM, and on-prem MARS/MABS scenarios. Backup Vault is for newer data sources (Blob, Disk, AKS, PostgreSQL).",
    },
  ],
  "monitor-maintain-azure/asr": [
    {
      prompt: "Why do you 'clean up test failover' rather than 'commit' after a successful ASR test failover?",
      difficulty: 2,
      options: [
        { id: "A", text: "ASR has no commit operation for test failovers.", isCorrect: true },
        { id: "B", text: "Cleanup is cheaper than commit.", isCorrect: false },
        { id: "C", text: "Commit only applies to planned failovers.", isCorrect: false, rationale: "Misleading — planned failovers do conclude differently, but the distinction here is the test workflow." },
        { id: "D", text: "Commit drops the source replication.", isCorrect: false },
      ],
      explanation: "Test failover creates an isolated copy without affecting source replication. Cleanup deletes the isolated VM and resets the test. Real failovers (planned or unplanned) use different commands.",
    },
  ],
};
