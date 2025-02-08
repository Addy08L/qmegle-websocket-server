const WebSocket = require("ws");

// Use dynamic port for Railway deployment
const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });

console.log(`✅ WebSocket server is running on ws://localhost:${PORT}`);

// Store connected clients
const clients = new Map();

wss.on("connection", (ws) => {
    console.log("🔗 New client connected");

    ws.on("message", (message) => {
        try {
            const data = JSON.parse(message);
            console.log(`📩 Received: ${JSON.stringify(data)}`);

            switch (data.action) {
                case "findPartner":
                    clients.set(data.userId, ws);
                    matchUsers(data.userId);
                    break;

                case "sendMessage":
                    const partner = clients.get(data.partnerId);
                    if (partner) {
                        partner.send(JSON.stringify({ from: data.userId, message: data.message }));
                    }
                    break;

                case "disconnect":
                    handleDisconnect(data.userId);
                    break;

                default:
                    console.log("⚠️ Unknown action:", data.action);
            }
        } catch (err) {
            console.log("⚠️ JSON Parsing Error:", err.message);
        }
    });

    ws.on("close", () => {
        console.log("❌ Client disconnected");
        clients.forEach((client, userId) => {
            if (client === ws) {
                handleDisconnect(userId);
            }
        });
    });

    ws.on("error", (err) => {
        console.log("⚠️ WebSocket error:", err);
    });
});

function matchUsers(userId) {
    const partnerId = Array.from(clients.keys()).find(id => id !== userId);
    if (partnerId) {
        const partnerSocket = clients.get(partnerId);
        if (partnerSocket) {
            clients.get(userId).send(JSON.stringify({ action: "partnerFound", partnerId }));
            partnerSocket.send(JSON.stringify({ action: "partnerFound", partnerId: userId }));
        }
    }
}

function handleDisconnect(userId) {
    const partnerSocket = clients.get(userId);
    if (partnerSocket) {
        partnerSocket.send(JSON.stringify({ action: "partnerDisconnected" }));
    }
    clients.delete(userId);
}
