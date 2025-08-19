import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

export interface DeploymentInfo {
  network: string;
  chainId: string;
  deployer: string;
  contracts: {
    [contractName: string]: {
      address: string;
      constructorArgs: any[];
    };
  };
  timestamp: string;
  blockNumber: number;
}

export async function saveDeploymentInfo(network: string, deploymentInfo: DeploymentInfo): Promise<void> {
  try {
    // Create deployments directory if it doesn't exist
    const deploymentsDir = join(__dirname, "..", "..", "deployments");
    if (!existsSync(deploymentsDir)) {
      mkdirSync(deploymentsDir, { recursive: true });
    }
    
    // Save network-specific deployment info
    const networkFile = join(deploymentsDir, `${network}.json`);
    writeFileSync(networkFile, JSON.stringify(deploymentInfo, null, 2));
    
    // Save latest deployment info
    const latestFile = join(deploymentsDir, "latest.json");
    writeFileSync(latestFile, JSON.stringify(deploymentInfo, null, 2));
    
    console.log(`💾 Deployment info saved to ${networkFile}`);
    console.log(`💾 Latest deployment info saved to ${latestFile}`);
  } catch (error) {
    console.error("❌ Failed to save deployment info:", error);
    throw error;
  }
}

export function loadDeploymentInfo(network: string): DeploymentInfo | null {
  try {
    const deploymentsDir = join(__dirname, "..", "..", "deployments");
    const networkFile = join(deploymentsDir, `${network}.json`);
    
    if (!existsSync(networkFile)) {
      return null;
    }
    
    const fileContent = require(networkFile);
    return fileContent as DeploymentInfo;
  } catch (error) {
    console.error("❌ Failed to load deployment info:", error);
    return null;
  }
}

export function getContractAddress(network: string, contractName: string): string | null {
  const deploymentInfo = loadDeploymentInfo(network);
  if (!deploymentInfo || !deploymentInfo.contracts[contractName]) {
    return null;
  }
  
  return deploymentInfo.contracts[contractName].address;
}

export function getAllContractAddresses(network: string): { [contractName: string]: string } | null {
  const deploymentInfo = loadDeploymentInfo(network);
  if (!deploymentInfo) {
    return null;
  }
  
  const addresses: { [contractName: string]: string } = {};
  for (const [contractName, contractInfo] of Object.entries(deploymentInfo.contracts)) {
    addresses[contractName] = contractInfo.address;
  }
  
  return addresses;
}
