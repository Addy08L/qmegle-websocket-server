const express = require('express');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = process.env.PORT || 3000;

// Serve static files (your HTML/CSS/JS)
app.use(express.static('public'));

const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

const wss = new WebSocket.Server({ server });

const users = new Map(); // Map<userId, WebSocket>
const waitingRoom = new Set();
const interestsMap = new Map(); // Map<userId, Array>
const typingUsers = new Set();

wss.on('connection', (ws) => {
  const userId = uuidv4();
  users.set(userId, ws);
  
  ws.on('message', (data) => {
    const message = JSON.parse(data);
    
    switch(message.type) {
      case 'SET_INTERESTS':
        interestsMap.set(userId, message.interests);
        break;
        
      case 'START_CHAT':
        handleMatchmaking(userId, message.strict);
        break;
        
      case 'MESSAGE':
        handleMessage(userId, message.text);
        break;
        
      case 'TYPING':
        handleTyping(userId);
        break;
        
      case 'DISCONNECT':
        handleDisconnect(userId);
        break;
    }
  });

  ws.on('close', () => handleDisconnect(userId));
});

function handleMatchmaking(userId, strict) {
  // Add your matching logic similar to Firebase version
  waitingRoom.add(userId);
  
  // Simple matching example
  for (const otherId of waitingRoom) {
    if (otherId !== userId && checkInterestsMatch(userId, otherId, strict)) {
      const partnerWs = users.get(otherId);
      const userWs = users.get(userId);
      
      // Send connection confirmation
      partnerWs.send(JSON.stringify({
        type: 'PARTNER_FOUND',
        partnerId: userId
      }));
      
      userWs.send(JSON.stringify({
        type: 'PARTNER_FOUND',
        partnerId: otherId
      }));
      
      waitingRoom.delete(userId);
      waitingRoom.delete(otherId);
      break;
    }
  }
}

function checkInterestsMatch(userId1, userId2, strict) {
  const interests1 = interestsMap.get(userId1) || [];
  const interests2 = interestsMap.get(userId2) || [];
  
  if (!strict) return true;
  return interests1.some(interest => interests2.includes(interest));
}

function handleMessage(senderId, text) {
  const receiverId = findPartner(senderId);
  if (receiverId && users.has(receiverId)) {
    users.get(receiverId).send(JSON.stringify({
      type: 'MESSAGE',
      text,
      senderId
    }));
  }
}

// Add other handler functions similar to Firebase logic

// Helper function to find partner
function findPartner(userId) {
  // Implement partner tracking logic
}
