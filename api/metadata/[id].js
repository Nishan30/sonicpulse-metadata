import { ethers } from 'ethers';

// --- IMPORTANT: Paste your VehicleRegistry contract address and ABI here ---
const contractAddress = "YOUR_NEWEST_VEHICLE_REGISTRY_ADDRESS";
const contractABI = [ /* PASTE THE FULL ABI ARRAY HERE */ ];

// This is the main serverless function handler
export default async function handler(request, response) {
  try {
    // Get the token ID from the URL (e.g., /api/metadata/4 -> id = 4)
    const { id } = request.query;
    
    // Connect to the Sonic Testnet using a read-only provider
    const provider = new ethers.JsonRpcProvider("https://rpc.testnet.sonic.game/");
    const contract = new ethers.Contract(contractAddress, contractABI, provider);

    // Fetch the vehicle's state from the blockchain
    const vehicleState = await contract.getVehicleState(id);
    const owner = await contract.ownerOf(id);

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
            "value": Number(vehicleState.lastUpdateTime)
        }
      ],
    };

    // Return the JSON response
    return response.status(200).json(metadata);

  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: "Failed to fetch metadata." });
  }
}