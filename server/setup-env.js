const fs = require("fs");
const path = require("path");
const readline = require("readline");
const axios = require("axios");
const dotenv = require("dotenv");

// Setup readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Base path
const BASE_DIR = path.resolve(__dirname, "..");
const ENV_PATH = path.join(BASE_DIR, ".env");
const ENV_EXAMPLE_PATH = path.join(BASE_DIR, ".env.example");

// Load existing env file if it exists
dotenv.config({ path: ENV_PATH });

console.log("==========================================");
console.log("Bitlook Voltage Node Setup Helper");
console.log("==========================================");

// Function to prompt for input with default value
function prompt(question, defaultValue) {
  return new Promise((resolve) => {
    const defaultText = defaultValue ? ` (${defaultValue})` : "";
    rl.question(`${question}${defaultText}: `, (answer) => {
      resolve(answer || defaultValue);
    });
  });
}

// Function to test Voltage connection
async function testVoltageConnection(apiUrl, port, macaroon) {
  try {
    console.log(`\nTesting connection to ${apiUrl}:${port}...`);
    const response = await axios.get(`${apiUrl}:${port}/v1/getinfo`, {
      headers: {
        "Grpc-Metadata-macaroon": macaroon,
        "Content-Type": "application/json",
      },
    });

    console.log("\n✅ Connection successful!");
    console.log("Node info:");
    console.log(`- Alias: ${response.data.alias}`);
    console.log(`- Pubkey: ${response.data.identity_pubkey}`);
    console.log(`- Version: ${response.data.version}`);
    console.log(`- Active channels: ${response.data.num_active_channels}`);

    return true;
  } catch (error) {
    console.log("\n❌ Connection failed!");
    console.log(`Error: ${error.message}`);

    if (error.response) {
      console.log(`Status: ${error.response.status}`);
    }

    return false;
  }
}

// Main function
async function main() {
  try {
    // Check if .env file exists
    const envExists = fs.existsSync(ENV_PATH);
    if (!envExists) {
      console.log("No .env file found. Creating one from .env.example...");
      if (fs.existsSync(ENV_EXAMPLE_PATH)) {
        fs.copyFileSync(ENV_EXAMPLE_PATH, ENV_PATH);
        console.log(".env file created successfully.");
      } else {
        console.log("No .env.example file found. Creating a new .env file...");
        fs.writeFileSync(ENV_PATH, "# Bitlook Environment Variables\n\n");
      }
    }

    // Read existing .env file
    const envContent = fs.readFileSync(ENV_PATH, "utf8");

    // Extract existing values
    let currentApiEndpoint = process.env.api_endpoint || "";
    let currentRestPort = process.env.rest_port || "8080";
    let currentMacaroon = process.env.admin_macaroon || "";

    console.log("\nPlease provide your Voltage node details:");

    // Get user input
    const apiEndpoint = await prompt(
      "API Endpoint (e.g. http://yournode.u.voltageapp.io)",
      currentApiEndpoint
    );
    const restPort = await prompt("REST Port", currentRestPort);
    const macaroon = await prompt("Admin Macaroon", currentMacaroon);

    // Test connection
    const connectionSuccessful = await testVoltageConnection(
      apiEndpoint,
      restPort,
      macaroon
    );

    if (
      connectionSuccessful ||
      (await prompt("Save these values anyway? (y/n)", "n")) === "y"
    ) {
      // Update .env file
      let updatedContent = envContent;

      // Define the Voltage section pattern
      const voltageSectionPattern = /# Voltage Node REST API[\s\S]*?(?=\n#|$)/;
      const voltageSection = `# Voltage Node REST API (for Lightning Proxy)
api_endpoint=${apiEndpoint}
rest_port=${restPort}
admin_macaroon=${macaroon}`;

      if (envContent.match(voltageSectionPattern)) {
        // Replace existing section
        updatedContent = envContent.replace(
          voltageSectionPattern,
          voltageSection
        );
      } else {
        // Append to the end
        updatedContent = `${envContent}\n\n${voltageSection}\n`;
      }

      // Write updated content
      fs.writeFileSync(ENV_PATH, updatedContent);
      console.log("\n✅ .env file updated successfully!");

      if (connectionSuccessful) {
        console.log("\nYou can now start the Bitlook application with:");
        console.log("npm run start:easy");
      } else {
        console.log("\n⚠️ Connection test failed, but values were saved.");
        console.log("Please check your Voltage node settings and try again.");
      }
    } else {
      console.log("\nSetup canceled. No changes were made to the .env file.");
    }
  } catch (error) {
    console.error("An error occurred:", error.message);
  } finally {
    rl.close();
  }
}

// Run the main function
main();
