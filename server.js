const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080 });

console.log("✅ WebSocket server is running on ws://localhost:8080");

const clients = new Map();

wss.on("connection", (ws) => {
    console.log("🔗 New client connected");

    ws.on("message", (message) => {
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
                    partner.send(JSON.stringify({ action: "sendMessage", from: data.userId, message: data.message }));
                }
                break;

            case "disconnect":
                clients.delete(data.userId);
                break;

            default:
                console.log("⚠️ Unknown action:", data.action);
        }
    });

    ws.on("close", () => {
        console.log("❌ Client disconnected");
        clients.forEach((client, userId) => {
            if (client === ws) {
                clients.delete(userId);
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
