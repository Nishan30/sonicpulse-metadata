// api/metadata/[id].js (FINAL, ROBUST VERSION)

// We use the 'ethers' package that was installed on Vercel.
// Note: Vercel might require just 'ethers' instead of 'ethers/v5' depending on the version.
// 'ethers' is safer for their latest environments.
import { ethers } from 'ethers';

// --- IMPORTANT: Paste your VehicleRegistry contract address here ---
const contractAddress = "0x6F430C55cE1e23959fd4C873C5b2D17351F77a58";

// --- IMPORTANT: Paste the entire ABI array you copied directly here ---
const contractABI = require("./abi/VehicleRegistry.json").abi;

// This is the main serverless function handler
export default async function handler(request, response) {
  try {
    // Get the token ID from the URL (e.g., /api/metadata/4 -> id = 4)
    const { id } = request.query;

    if (!id || isNaN(parseInt(id))) {
        return response.status(400).json({ error: "A valid token ID is required." });
    }
    
    // Connect to the Sonic Testnet using a read-only provider
    const provider = new ethers.JsonRpcProvider("https://rpc.testnet.sonic.game/");
    const contract = new ethers.Contract(contractAddress, contractABI, provider);

    // Fetch the vehicle's state and owner from the blockchain
    // We use Promise.all to run these checks in parallel for efficiency
    const [vehicleState, owner] = await Promise.all([
        contract.getVehicleState(id),
        contract.ownerOf(id)
    ]);

    // Convert the enum status to a human-readable string
    let statusString = "Moving";
    if (Number(vehicleState.status) === 1) statusString = "Waiting";
    if (Number(vehicleState.status) === 2) statusString = "Crossing";

    // Construct the metadata JSON object
    const metadata = {
      name: `SonicPulse Vehicle #${id}`,
      description: "A dynamic NFT representing a real-time coordinated vehicle on the Sonic network.",
      image: "https://i.imgur.com/x854B7S.png", // A sample image URL
      owner: owner,
      attributes: [
        {
          trait_type: "Status",
          value: statusString,
        },
        {
          trait_type: "Location",
          value: vehicleState.location,
        },
        {
          trait_type: "Speed",
          value: Number(vehicleState.speed),
        },
        {
            "trait_type": "Last Update",
            "display_type": "date", 
            "value": Number(vehicleState.lastUpdateTime) // OpenSea understands UNIX timestamps
        }
      ],
    };

    // Set the correct header to tell browsers it's a JSON response
    response.setHeader('Content-Type', 'application/json');
    // Return the JSON response
    return response.status(200).json(metadata);

  } catch (error) {
    // Log the detailed error on the server for debugging
    console.error(`Error fetching metadata for ID ${request.query.id}:`, error);
    // Return a generic error to the user
    return response.status(500).json({ error: "Failed to fetch metadata. The token might not exist or there was a network issue." });
  }
}