import { run } from "hardhat";

export async function verify(contractAddress: string, constructorArguments: any[] = []) {
  console.log(`🔍 Verifying contract at ${contractAddress}...`);
  
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: constructorArguments,
    });
    
    console.log(`✅ Contract verified successfully`);
  } catch (error: any) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log(`✅ Contract already verified`);
    } else {
      console.log(`❌ Verification failed: ${error.message}`);
      throw error;
    }
  }
}
