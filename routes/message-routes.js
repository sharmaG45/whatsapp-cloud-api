const express = require("express");
const messageRouter = express.Router();

const {
  sendTemplate,
  sendMessage,
  sendLocation,
  createTemplate,
  sendImages,
  message,
  webhookCall,
  sendAudio,
  sendVideo,
  sendDocuments,
  sendContact,
  verifyCallback,
} = require("../controllers/message-controllers");

// To verify the callback url from dashboard side - cloud api side
// messageRouter.get("/", verifyCallback);

// Whatever user sent the message / reply the message this is console the response
messageRouter.post("/", webhookCall);

//getting the response message
messageRouter.get("/messages", message);

// For template message which should already approved by whatsapp
messageRouter.post("/sendTemplate", sendTemplate);

// For Text Message
messageRouter.post("/sendMessage", sendMessage);

//for send the location
messageRouter.post("/locationMessage", sendLocation);

// For create template message which should already approved by whatsapp
messageRouter.post("/createTemplate", createTemplate);

// For Images messages
messageRouter.post("/sendImages", sendImages);

// For documents messages
messageRouter.post("/sendDocuments", sendDocuments);

// For audio messages
messageRouter.post("/sendAudio", sendAudio);

// For video messages
messageRouter.post("/sendVideo", sendVideo);

//For Contact number
messageRouter.post("/sendContact", sendContact);

module.exports = messageRouter;
