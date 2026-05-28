/**
 * Seed data: interactive lab guides for AZ-104 hands-on units.
 *
 * Each lab has portal/CLI/PowerShell/Bicep/Terraform variants where
 * applicable. The UI tabs through them so learners can practise in their
 * preferred tooling.
 */
export interface LabStep {
  title: string;
  description: string;
  portal?: string;
  cli?: string;
  powershell?: string;
  bicep?: string;
  terraform?: string;
  validation?: string;
  troubleshooting?: string;
}

export interface LabSeed {
  unitSlug: string;
  moduleSlug: string;
  title: string;
  objective: string;
  prerequisites: string;
  cleanupSteps: string;
  estimatedMin: number;
  steps: LabStep[];
}

export const LABS: LabSeed[] = [
  {
    moduleSlug: "manage-azure-identities-governance",
    unitSlug: "lab-assign-roles",
    title: "Assign Azure roles with the portal, CLI, and PowerShell",
    objective: "Grant a developer the ability to start and stop VMs in a specific resource group without giving them broader access. Then refine with a custom role.",
    prerequisites: "Azure subscription where you have Owner or User Access Administrator. One resource group named rg-lab-rbac. One small Standard_B1s VM in that resource group.",
    cleanupSteps: "Delete the role assignments, custom role, and rg-lab-rbac resource group when done.",
    estimatedMin: 25,
    steps: [
      {
        title: "Identify the developer's user principal",
        description: "Locate the user object ID and confirm the resource group name. You'll use these in subsequent role assignments.",
        portal: "Microsoft Entra ID → Users → search for the developer → copy 'Object ID'.",
        cli: `# Replace alice@contoso.com\naz ad user show --id alice@contoso.com --query id -o tsv`,
        powershell: `Get-MgUser -Filter "userPrincipalName eq 'alice@contoso.com'" | Select-Object Id`,
        validation: "You should see a GUID. Save it to a shell variable: PRINCIPAL_ID=<guid>.",
      },
      {
        title: "Assign the Virtual Machine Contributor built-in role",
        description: "Virtual Machine Contributor allows full VM lifecycle (create, delete, start, stop, restart) within the chosen scope. Use the smallest scope possible — the resource group rg-lab-rbac.",
        portal: "Resource group rg-lab-rbac → Access control (IAM) → Add → Add role assignment → Role: 'Virtual Machine Contributor' → Members: select the developer → Review + assign.",
        cli: `RG=$(az group show -n rg-lab-rbac --query id -o tsv)\naz role assignment create \\\n  --assignee $PRINCIPAL_ID \\\n  --role "Virtual Machine Contributor" \\\n  --scope $RG`,
        powershell: `New-AzRoleAssignment \`\n  -ObjectId $PrincipalId \`\n  -RoleDefinitionName "Virtual Machine Contributor" \`\n  -ResourceGroupName "rg-lab-rbac"`,
        validation: "az role assignment list --assignee $PRINCIPAL_ID -o table should show the new assignment.",
      },
      {
        title: "Verify the developer can start/stop but not delegate access",
        description: "Sign in as the developer (private window). The developer should be able to stop and start VMs in rg-lab-rbac but should NOT see Access control (IAM) → Add role assignment.",
        validation: "Confirmed when 'Add role assignment' is disabled for the developer.",
      },
      {
        title: "Create a custom role that allows only start/stop (no create/delete)",
        description: "Built-in VM Contributor is too broad. The team wants exactly start, stop, and read. Create a custom role.",
        cli: `cat > vm-start-stop.json <<EOF\n{\n  "Name": "VM Start-Stop Operator",\n  "Description": "Read VMs, plus start/stop/restart.",\n  "Actions": [\n    "Microsoft.Compute/virtualMachines/read",\n    "Microsoft.Compute/virtualMachines/start/action",\n    "Microsoft.Compute/virtualMachines/deallocate/action",\n    "Microsoft.Compute/virtualMachines/restart/action",\n    "Microsoft.Network/networkInterfaces/read",\n    "Microsoft.Resources/subscriptions/resourceGroups/read"\n  ],\n  "NotActions": [],\n  "AssignableScopes": ["$(az group show -n rg-lab-rbac --query id -o tsv)"]\n}\nEOF\naz role definition create --role-definition @vm-start-stop.json`,
        powershell: `$role = @{\n  Name = "VM Start-Stop Operator"\n  Description = "Read VMs, plus start/stop/restart."\n  Actions = @(\n    "Microsoft.Compute/virtualMachines/read",\n    "Microsoft.Compute/virtualMachines/start/action",\n    "Microsoft.Compute/virtualMachines/deallocate/action",\n    "Microsoft.Compute/virtualMachines/restart/action"\n  )\n  AssignableScopes = @("/subscriptions/<id>/resourceGroups/rg-lab-rbac")\n}\nNew-AzRoleDefinition -Role $role`,
        validation: "az role definition list --custom-role-only --query \"[?roleName=='VM Start-Stop Operator']\" should show the new role.",
        troubleshooting: "If creation fails with 'RoleDefinitionExceedsAssignableScopes', the assignable scope path must be valid and within your subscription.",
      },
      {
        title: "Swap the developer's assignment to the custom role",
        description: "Remove the Virtual Machine Contributor assignment and add the new custom role.",
        cli: `az role assignment delete \\\n  --assignee $PRINCIPAL_ID \\\n  --role "Virtual Machine Contributor" \\\n  --scope $(az group show -n rg-lab-rbac --query id -o tsv)\n\naz role assignment create \\\n  --assignee $PRINCIPAL_ID \\\n  --role "VM Start-Stop Operator" \\\n  --scope $(az group show -n rg-lab-rbac --query id -o tsv)`,
        validation: "Developer can still start/stop VMs but attempting to delete a VM should now fail with AuthorizationFailed.",
      },
      {
        title: "Cleanup",
        description: "Remove the role assignment, then the custom role, then optionally the resource group.",
        cli: `az role assignment delete --assignee $PRINCIPAL_ID --role "VM Start-Stop Operator"\naz role definition delete --name "VM Start-Stop Operator"\naz group delete -n rg-lab-rbac --yes --no-wait`,
      },
    ],
  },
  {
    moduleSlug: "implement-manage-storage",
    unitSlug: "lab-azcopy",
    title: "Move data with AzCopy",
    objective: "Use AzCopy authenticated via Microsoft Entra ID to upload a local directory to a blob container, then copy between two containers using server-to-server transfer.",
    prerequisites: "AzCopy v10+ installed locally. A storage account with Hot tier and a container 'lab-source'. Storage Blob Data Contributor role on yourself.",
    cleanupSteps: "Delete the lab-source and lab-target containers; remove sample data.",
    estimatedMin: 25,
    steps: [
      {
        title: "Authenticate AzCopy with Entra ID",
        description: "Use device-code login. This grants AzCopy access via your Entra ID role assignments — no SAS required.",
        cli: `azcopy login\n# Open the URL printed, enter the device code, sign in as a user with Storage Blob Data Contributor.`,
        validation: "You should see 'Login succeeded.' Subsequent commands will use the cached token.",
      },
      {
        title: "Create the source and target containers",
        description: "Create two containers in the storage account.",
        cli: `az storage container create --account-name <acct> --name lab-source --auth-mode login\naz storage container create --account-name <acct> --name lab-target --auth-mode login`,
      },
      {
        title: "Upload a local directory to the source container",
        description: "Use --recursive to traverse subfolders and --block-size-mb to tune for large files.",
        cli: `azcopy copy "/path/to/local/data/*" \\\n  "https://<acct>.blob.core.windows.net/lab-source" \\\n  --recursive=true \\\n  --block-size-mb=128`,
        validation: "AzCopy prints a job summary with totals. Listing the container should show the uploaded blobs.",
        troubleshooting: "If you see 'Authentication Failed', confirm 'azcopy login' succeeded and your role assignment includes the data plane (Storage Blob Data Contributor).",
      },
      {
        title: "Server-to-server copy (no data egresses your machine)",
        description: "AzCopy can copy directly between two URLs, using server-side transfer. No bytes flow through your laptop.",
        cli: `azcopy copy \\\n  "https://<acct>.blob.core.windows.net/lab-source/*" \\\n  "https://<acct>.blob.core.windows.net/lab-target" \\\n  --recursive=true`,
        validation: "lab-target container now has the same blobs as lab-source. Job summary shows zero bytes transferred through your local network.",
      },
      {
        title: "Sync source → target (idempotent)",
        description: "Use 'azcopy sync' for an idempotent operation that only copies differences.",
        cli: `azcopy sync \\\n  "https://<acct>.blob.core.windows.net/lab-source" \\\n  "https://<acct>.blob.core.windows.net/lab-target" \\\n  --recursive=true \\\n  --delete-destination=true`,
        validation: "Re-running should report zero transfers.",
      },
      {
        title: "Cleanup",
        description: "Delete the lab containers.",
        cli: `az storage container delete --account-name <acct> --name lab-source --auth-mode login\naz storage container delete --account-name <acct> --name lab-target --auth-mode login`,
      },
    ],
  },
  {
    moduleSlug: "deploy-manage-compute",
    unitSlug: "lab-deploy-vm",
    title: "Deploy a zone-redundant VM cluster behind Standard Load Balancer",
    objective: "Deploy three Standard_B1s VMs across availability zones 1, 2, and 3. Place them behind a Standard Load Balancer with a TCP 80 health probe. Verify that stopping one VM does not interrupt traffic.",
    prerequisites: "Azure CLI logged in. A region that supports availability zones (e.g. eastus, westeurope, australiaeast).",
    cleanupSteps: "Delete the resource group rg-lab-az when done.",
    estimatedMin: 30,
    steps: [
      {
        title: "Create the resource group and VNet",
        description: "Bicep makes this easier — see the Bicep tab. Otherwise use the CLI.",
        cli: `LOC=eastus\nRG=rg-lab-az\naz group create -n $RG -l $LOC\naz network vnet create -g $RG -n vnet1 \\\n  --address-prefixes 10.10.0.0/16 \\\n  --subnet-name web --subnet-prefixes 10.10.1.0/24`,
        bicep: `// main.bicep — call: az deployment group create -g rg-lab-az -f main.bicep\nparam location string = resourceGroup().location\nresource vnet 'Microsoft.Network/virtualNetworks@2024-01-01' = {\n  name: 'vnet1'\n  location: location\n  properties: {\n    addressSpace: { addressPrefixes: [ '10.10.0.0/16' ] }\n    subnets: [ { name: 'web', properties: { addressPrefix: '10.10.1.0/24' } } ]\n  }\n}`,
      },
      {
        title: "Create the Standard Load Balancer",
        description: "Standard SKU is required for zone-redundant frontends.",
        cli: `az network public-ip create -g $RG -n pip-lb \\\n  --sku Standard --zone 1 2 3\naz network lb create -g $RG -n lb1 \\\n  --sku Standard --public-ip-address pip-lb \\\n  --frontend-ip-name fe --backend-pool-name bepool\naz network lb probe create -g $RG --lb-name lb1 \\\n  -n probe80 --protocol tcp --port 80\naz network lb rule create -g $RG --lb-name lb1 \\\n  -n rule80 --protocol tcp \\\n  --frontend-port 80 --backend-port 80 \\\n  --frontend-ip-name fe --backend-pool-name bepool \\\n  --probe-name probe80`,
        validation: "az network public-ip show -g $RG -n pip-lb --query zones should list ['1','2','3'].",
      },
      {
        title: "Deploy 3 VMs across the 3 availability zones",
        description: "Each VM gets a NIC in the LB backend pool. Use a bash loop.",
        cli: `for ZONE in 1 2 3; do\n  az vm create -g $RG -n vm-z$ZONE \\\n    --image Ubuntu2204 --size Standard_B1s \\\n    --zone $ZONE \\\n    --vnet-name vnet1 --subnet web \\\n    --public-ip-address "" \\\n    --nsg-rule SSH \\\n    --admin-username azureuser \\\n    --generate-ssh-keys \\\n    --custom-data cloud-init-nginx.yml\n  az network nic ip-config update -g $RG \\\n    --nic-name vm-z${ZONE}VMNic \\\n    -n ipconfigvm-z$ZONE \\\n    --lb-name lb1 --lb-address-pools bepool\ndone`,
        troubleshooting: "If 'zone' is rejected, the VM size + region combination must support zones — pick a different region or SKU.",
      },
      {
        title: "Install a web server via cloud-init",
        description: "cloud-init-nginx.yml installs nginx and returns the VM hostname so you can see which backend served each request.",
        portal: "Or, post-create: VM → Run command → RunShellScript → 'sudo apt-get update && sudo apt-get install -y nginx && hostname > /var/www/html/index.html'",
      },
      {
        title: "Validate failover",
        description: "Curl the LB public IP repeatedly — you should see all three hostnames. Stop one VM and confirm the LB stops routing to it within probe-interval seconds.",
        cli: `LB_IP=$(az network public-ip show -g $RG -n pip-lb --query ipAddress -o tsv)\nfor i in {1..30}; do curl -s http://$LB_IP; echo; sleep 0.5; done\n\n# Now stop vm-z2 and re-run the loop:\naz vm stop -g $RG -n vm-z2\nfor i in {1..30}; do curl -s http://$LB_IP; echo; sleep 0.5; done`,
        validation: "After stopping vm-z2, you should see only vm-z1 and vm-z3 in the responses, with no failed requests.",
      },
      {
        title: "Cleanup",
        description: "Delete the resource group.",
        cli: `az group delete -n $RG --yes --no-wait`,
      },
    ],
  },
];
