/**
 * Additional AZ-104 lab guides (batch 2).
 * Covers networking (hub-spoke + UDR) and monitoring (alerts + action groups).
 */
import type { LabSeed } from "./labs";

export const LABS_BATCH_2: LabSeed[] = [
  {
    moduleSlug: "implement-manage-virtual-networking",
    unitSlug: "vnets",
    title: "Build a hub-and-spoke topology with UDR-routed spoke-to-spoke",
    objective:
      "Create one hub VNet with an Azure Firewall, two spoke VNets, peer each spoke to the hub, and use UDRs to force spoke-to-spoke traffic through the firewall.",
    prerequisites:
      "Azure subscription with Contributor at the resource-group scope. CLI authenticated. A region that supports Azure Firewall and Standard public IPs.",
    cleanupSteps:
      "Delete the resource group rg-lab-net to remove all created resources (firewall, VNets, VMs).",
    estimatedMin: 45,
    steps: [
      {
        title: "Create the resource group and hub VNet",
        description:
          "The hub holds shared services. The /16 leaves room for a firewall subnet and future shared services.",
        cli: `LOC=eastus\nRG=rg-lab-net\naz group create -n $RG -l $LOC\n\naz network vnet create -g $RG -n hub \\\n  --address-prefixes 10.0.0.0/16 \\\n  --subnet-name AzureFirewallSubnet \\\n  --subnet-prefixes 10.0.0.0/26`,
        bicep: `resource hub 'Microsoft.Network/virtualNetworks@2024-01-01' = {\n  name: 'hub'\n  location: location\n  properties: {\n    addressSpace: { addressPrefixes: ['10.0.0.0/16'] }\n    subnets: [\n      { name: 'AzureFirewallSubnet', properties: { addressPrefix: '10.0.0.0/26' } }\n    ]\n  }\n}`,
        validation:
          "az network vnet show -g $RG -n hub --query 'subnets[].name' should list 'AzureFirewallSubnet'.",
        troubleshooting:
          "AzureFirewallSubnet must be exactly that name. Any other name causes firewall deployment to fail.",
      },
      {
        title: "Deploy the Azure Firewall in the hub",
        description:
          "Azure Firewall needs a Standard public IP and the AzureFirewallSubnet. Allow the deployment 5-10 minutes.",
        cli: `az network public-ip create -g $RG -n pip-afw \\\n  --sku Standard --allocation-method Static\n\naz network firewall create -g $RG -n afw \\\n  --tier Standard \\\n  --vnet-name hub --public-ip pip-afw\n\nFW_PRIVATE_IP=$(az network firewall ip-config list \\\n  -g $RG --firewall-name afw \\\n  --query "[0].privateIpAddress" -o tsv)\necho "Firewall private IP: $FW_PRIVATE_IP"`,
        validation:
          "az network firewall show -g $RG -n afw --query provisioningState should be Succeeded.",
      },
      {
        title: "Create the two spoke VNets and peer each to the hub",
        description:
          "Spokes get non-overlapping /16s. Peering is non-transitive — Spoke1 and Spoke2 will not be able to reach each other until you add UDRs.",
        cli: `for i in 1 2; do\n  az network vnet create -g $RG -n spoke$i \\\n    --address-prefixes 10.$i.0.0/16 \\\n    --subnet-name workload --subnet-prefixes 10.$i.1.0/24\n\n  az network vnet peering create -g $RG \\\n    -n hub-to-spoke$i \\\n    --vnet-name hub \\\n    --remote-vnet spoke$i \\\n    --allow-vnet-access --allow-forwarded-traffic\n\n  az network vnet peering create -g $RG \\\n    -n spoke$i-to-hub \\\n    --vnet-name spoke$i \\\n    --remote-vnet hub \\\n    --allow-vnet-access --allow-forwarded-traffic\ndone`,
        validation:
          "az network vnet peering list -g $RG --vnet-name spoke1 --query '[].peeringState' should show 'Connected'.",
      },
      {
        title: "Create the spoke-to-spoke route table",
        description:
          "Each spoke needs a UDR sending the other spoke's prefix to the firewall as the next hop. Without this, spoke-to-spoke traffic is dropped.",
        cli: `for i in 1 2; do\n  OTHER=$((3 - i))\n  az network route-table create -g $RG -n rt-spoke$i\n\n  az network route-table route create -g $RG \\\n    --route-table-name rt-spoke$i \\\n    -n to-spoke$OTHER \\\n    --address-prefix 10.$OTHER.0.0/16 \\\n    --next-hop-type VirtualAppliance \\\n    --next-hop-ip-address $FW_PRIVATE_IP\n\n  az network vnet subnet update -g $RG \\\n    --vnet-name spoke$i --name workload \\\n    --route-table rt-spoke$i\ndone`,
        validation:
          "az network route-table route list -g $RG --route-table-name rt-spoke1 should show 'to-spoke2' with next hop = firewall private IP.",
      },
      {
        title: "Add a firewall network rule allowing spoke-to-spoke ICMP",
        description:
          "For the test, allow ICMP between the spoke prefixes. Adjust to TCP/UDP for real workloads.",
        cli: `az network firewall network-rule create -g $RG \\\n  --firewall-name afw \\\n  --collection-name spoke-to-spoke \\\n  --name allow-icmp \\\n  --action Allow --priority 100 \\\n  --source-addresses 10.1.0.0/16 10.2.0.0/16 \\\n  --destination-addresses 10.1.0.0/16 10.2.0.0/16 \\\n  --destination-ports '*' \\\n  --protocols ICMP`,
        validation:
          "az network firewall network-rule collection list -g $RG --firewall-name afw should show the new collection.",
      },
      {
        title: "Deploy a test VM in each spoke",
        description:
          "Provision a small Linux VM in each spoke's workload subnet. Use the network watcher extension for connectivity testing.",
        cli: `for i in 1 2; do\n  az vm create -g $RG -n vm-spoke$i \\\n    --image Ubuntu2204 --size Standard_B1s \\\n    --vnet-name spoke$i --subnet workload \\\n    --public-ip-address "" \\\n    --admin-username azureuser --generate-ssh-keys\n  az vm extension set -g $RG --vm-name vm-spoke$i \\\n    --name NetworkWatcherAgentLinux \\\n    --publisher Microsoft.Azure.NetworkWatcher\ndone`,
      },
      {
        title: "Validate spoke-to-spoke flow through the firewall",
        description:
          "Use Network Watcher's connectivity check from vm-spoke1 to vm-spoke2. The hop list should show the firewall as an intermediate.",
        cli: `SRC=$(az vm show -g $RG -n vm-spoke1 --query id -o tsv)\nDST_IP=$(az vm list-ip-addresses -g $RG -n vm-spoke2 \\\n  --query "[0].virtualMachine.network.privateIpAddresses[0]" -o tsv)\n\naz network watcher test-connectivity \\\n  --source-resource $SRC \\\n  --dest-address $DST_IP \\\n  --protocol Icmp`,
        validation:
          "The hops array should include the firewall's private IP, confirming the UDR is in effect. ConnectionStatus = Reachable.",
        troubleshooting:
          "If unreachable: confirm both peering entries say 'Connected', the firewall rule applies to the source/destination prefixes, and the route table is attached to the subnet.",
      },
      {
        title: "Cleanup",
        description: "Tear down the lab in a single command.",
        cli: `az group delete -n $RG --yes --no-wait`,
      },
    ],
  },
  {
    moduleSlug: "monitor-maintain-azure",
    unitSlug: "alerts",
    title: "Configure metric alerts with action groups",
    objective:
      "Create a Log Analytics workspace, onboard a VM with Azure Monitor Agent, then alert when CPU stays above 80% for 5 minutes, sending notifications via an action group with email + webhook.",
    prerequisites:
      "Azure subscription with one existing Linux VM (or follow step 2 to deploy one). Azure CLI logged in.",
    cleanupSteps:
      "Delete the alert rule, action group, Log Analytics workspace, and the lab resource group.",
    estimatedMin: 30,
    steps: [
      {
        title: "Create the Log Analytics workspace",
        description:
          "AMA needs a workspace as the destination for collected logs. Choose the same region as the VM.",
        cli: `LOC=eastus\nRG=rg-lab-mon\nWS=law-lab\naz group create -n $RG -l $LOC\naz monitor log-analytics workspace create -g $RG -n $WS -l $LOC\n\nWS_ID=$(az monitor log-analytics workspace show -g $RG -n $WS --query id -o tsv)`,
      },
      {
        title: "Install Azure Monitor Agent on the VM",
        description:
          "The AMA extension replaces the deprecated MMA. It requires a Data Collection Rule (DCR) to know what to collect.",
        cli: `VM_NAME=vm-target\naz vm extension set -g $RG --vm-name $VM_NAME \\\n  --name AzureMonitorLinuxAgent \\\n  --publisher Microsoft.Azure.Monitor \\\n  --enable-auto-upgrade true`,
        validation:
          "az vm extension list -g $RG --vm-name $VM_NAME should include AzureMonitorLinuxAgent in 'Succeeded' state.",
      },
      {
        title: "Create a Data Collection Rule for syslog + performance counters",
        description:
          "The DCR scopes which streams the AMA collects and which workspace receives them.",
        cli: `cat > dcr.json <<EOF\n{\n  "location": "$LOC",\n  "properties": {\n    "dataSources": {\n      "performanceCounters": [{\n        "name": "perf-vm",\n        "streams": ["Microsoft-Perf"],\n        "samplingFrequencyInSeconds": 60,\n        "counterSpecifiers": ["Processor(*)\\\\% Processor Time"]\n      }]\n    },\n    "destinations": {\n      "logAnalytics": [{ "workspaceResourceId": "$WS_ID", "name": "law-dest" }]\n    },\n    "dataFlows": [{\n      "streams": ["Microsoft-Perf"],\n      "destinations": ["law-dest"]\n    }]\n  }\n}\nEOF\naz monitor data-collection rule create -g $RG -n dcr-cpu --rule-file dcr.json\n\nDCR_ID=$(az monitor data-collection rule show -g $RG -n dcr-cpu --query id -o tsv)\nVM_ID=$(az vm show -g $RG -n $VM_NAME --query id -o tsv)\n\naz monitor data-collection rule association create \\\n  --name vm-cpu-association \\\n  --resource $VM_ID --rule-id $DCR_ID`,
        validation:
          "Wait ~5 min, then query the workspace: 'Perf | take 1'. Should return a row.",
      },
      {
        title: "Create an action group with email and webhook receivers",
        description:
          "Action groups bundle reusable notification + automation actions.",
        cli: `az monitor action-group create -g $RG -n ag-ops \\\n  --short-name ops \\\n  --email primary admin@contoso.com \\\n  --webhook slack-hook https://hooks.slack.com/services/T000/B000/XXX`,
        validation:
          "az monitor action-group show -g $RG -n ag-ops should list both receivers.",
      },
      {
        title: "Create the CPU metric alert rule",
        description:
          "Alert when avg CPU >80% over 5 minutes. Severity 2 for actionable production issues.",
        cli: `aaz monitor metrics alert create -g $RG -n alert-vm-cpu \\\n  --scopes $VM_ID \\\n  --condition "avg Percentage CPU > 80" \\\n  --window-size 5m --evaluation-frequency 1m \\\n  --severity 2 \\\n  --action ag-ops \\\n  --description "Average CPU exceeded 80% for 5 minutes"\n# Note: leading 'a' is not a typo if your shell aliases 'aaz' to az;\n# otherwise use 'az' directly.`,
        validation:
          "az monitor metrics alert show -g $RG -n alert-vm-cpu should report Enabled.",
      },
      {
        title: "Generate load and observe the alert firing",
        description:
          "SSH into the target VM and run stress to push CPU above threshold for 5+ minutes.",
        cli: `# inside VM\nsudo apt-get update && sudo apt-get install -y stress\nstress --cpu 2 --timeout 300s`,
        validation:
          "Within 5-6 minutes the alert should fire. Check: az monitor activity-log alert list-incidents or look at the Alerts blade in the portal. The action group should deliver an email.",
        troubleshooting:
          "If no fire: confirm metrics are arriving (Insights → Metrics on the VM), the threshold operator/value is correct, and the action group isn't suppressed by an alert processing rule.",
      },
      {
        title: "Cleanup",
        description: "Delete the resource group; this cascades to all lab resources.",
        cli: `az group delete -n $RG --yes --no-wait`,
      },
    ],
  },
];
