const express = require("express");
const messageRouter = express.Router();
const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");

const token = process.env.WHATSAPP_TOKEN;
const phoneNumberId = process.env.PHONE_NUMBER_ID;
const mytoken = process.env.VERIFY_TOKEN;

//To verify the callback url from dashboard side - cloud api side
// messageRouter.get("/", (req, res) => {
//   const mode = req.query["hub.mode"];
//   const challenge = req.query["hub.challenge"];
//   const token = req.query["hub.verify_token"];
//   if (mode && token === process.env.VERIFY_TOKEN) {
//     res.status(200).send(challenge);
//   } else {
//     res.status(400).send("Invalid request");
//   }
// });

// Whatever user sent the message / reply the message this is console the response
messageRouter.post("/", (req, res) => {
  const { entry } = req.body;

  if (!entry || entry.length === 0) {
    return res.status(400).send("Invalid Request");
  }

  const changes = entry[0].changes;

  if (!changes || changes.length === 0) {
    return res.status(400).send("Invalid Request");
  }

  const statuses = changes[0].value.statuses
    ? changes[0].value.statuses[0]
    : null;
  const messages = changes[0].value.messages
    ? changes[0].value.messages[0]
    : null;

  if (statuses) {
    // Handle message status
    console.log(`
      MESSAGE STATUS UPDATE:
      ID: ${statuses.id},
      STATUS: ${statuses.status}
    `);
  }

  if (messages) {
    // Handle received messages
    if (messages.type === "text") {
      if (messages.text.body.toLowerCase() === "hello") {
        replyMessage(messages.from, "Hello. How are you?", messages.id);
      }

      if (messages.text.body.toLowerCase() === "list") {
        sendList(messages.from);
      }

      if (messages.text.body.toLowerCase() === "buttons") {
        sendReplyButtons(messages.from);
      }
    }

    if (messages.type === "interactive") {
      if (messages.interactive.type === "list_reply") {
        sendMessage(
          messages.from,
          `You selected the option with ID ${messages.interactive.list_reply.id} - Title ${messages.interactive.list_reply.title}`
        );
      }

      if (messages.interactive.type === "button_reply") {
        sendMessage(
          messages.from,
          `You selected the button with ID ${messages.interactive.button_reply.id} - Title ${messages.interactive.button_reply.title}`
        );
      }
    }

    console.log(JSON.stringify(messages, null, 2));
  }

  res.status(200).send("Webhook processed");
});

async function sendMessage(to, body) {
  await axios({
    url: `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
    method: "post",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    data: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: {
        body,
      },
    }),
  });
}

async function replyMessage(to, body, messageId) {
  await axios({
    url: `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
    method: "post",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    data: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: {
        body,
      },
      context: {
        message_id: messageId,
      },
    }),
  });
}

async function sendList(to) {
  await axios({
    url: `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
    method: "post",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    data: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "list",
        header: {
          type: "text",
          text: "Message Header",
        },
        body: {
          text: "This is a interactive list message",
        },
        footer: {
          text: "This is the message footer",
        },
        action: {
          button: "Tap for the options",
          sections: [
            {
              title: "First Section",
              rows: [
                {
                  id: "first_option",
                  title: "First option",
                  description: "This is the description of the first option",
                },
                {
                  id: "second_option",
                  title: "Second option",
                  description: "This is the description of the second option",
                },
              ],
            },
            {
              title: "Second Section",
              rows: [
                {
                  id: "third_option",
                  title: "Third option",
                },
              ],
            },
          ],
        },
      },
    }),
  });
}

async function sendReplyButtons(to) {
  await axios({
    url: `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
    method: "post",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    data: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        header: {
          type: "text",
          text: "Message Header",
        },
        body: {
          text: "This is a interactive reply buttons message",
        },
        footer: {
          text: "This is the message footer",
        },
        action: {
          buttons: [
            {
              type: "reply",
              reply: {
                id: "first_button",
                title: "First Button",
              },
            },
            {
              type: "reply",
              reply: {
                id: "second_button",
                title: "Second Button",
              },
            },
          ],
        },
      },
    }),
  });
}

// For template message which should already approved by whatsapp
messageRouter.post("/sendTemplate", async (req, res) => {
  const url = `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`;

  const { phone } = req.body.to;

  console.log(phone);

  const data = {
    messaging_product: "whatsapp",
    to: phone,
    type: "template",
    template: {
      name: "hello_world", // Make sure this template is approved
      language: {
        code: "en_US",
      },
    },
  };

  try {
    const response = await axios.post(url, data, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log(` Template sent to ${phone}`);

    // Send back the Facebook API response to the client
    return res.status(200).json(response.data);
  } catch (error) {
    console.error(
      `❌ Failed for ${phone}:`,
      error.response?.data || error.message
    );
    // Send an error response to client
    return res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message,
    });
  }
});

// For Text Message
messageRouter.post("/sendMessage", async (req, res) => {
  const url = `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`;

  const { phone } = req.body.to;

  console.log(phone);

  const data = {
    messaging_product: "whatsapp",
    to: phone,
    type: "text",
    text: {
      preview_url: true,
      body: "Hello",
    },
  };

  try {
    const response = await axios.post(url, data, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log(`✅ Message sent to ${phone}`);

    // Send back the Facebook API response to the client
    return res.status(200).json(response.data);
  } catch (error) {
    console.error(
      `❌ Failed for ${phone}:`,
      error.response?.data || error.message
    );
    // Send an error response to client
    return res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message,
    });
  }
});

// Upload media and return media_id of images
const uploadMedia = async (filePath) => {
  const form = new FormData();
  form.append("file", fs.createReadStream(filePath));
  form.append("messaging_product", "whatsapp");

  const response = await axios.post(
    `https://graph.facebook.com/v19.0/${phoneNumberId}/media`,
    form,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        ...form.getHeaders(),
      },
    }
  );

  return response.data.id;
};

// For Images messages
messageRouter.post("/messageImages", async (req, res) => {
  const mediaId = await uploadMedia("./assets/Logo-1.png");
  console.log("✅ Uploaded Media ID:", mediaId);

  const url = `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`;

  const { phone } = req.body.to;

  console.log(phone);

  const data = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: phone,
    type: "image",
    image: {
      id: mediaId,
      caption: "The best succulent ever?",
    },
  };

  try {
    const response = await axios.post(url, data, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log(`✅ Image sent to ${phone}`);

    // Send back the Facebook API response to the client
    return res.status(200).json(response.data);
  } catch (error) {
    console.error(
      `❌ Failed for ${phone}:`,
      error.response?.data || error.message
    );
    // Send an error response to client
    return res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message,
    });
  }
});

// For locations messages

// for dynamically i will have to send the longitude and latitude through the frontend

// navigator.geolocation.getCurrentPosition(
//   (position) => {
//     fetch("http://localhost:3000/api/v1/webhook/message/location", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         to: { phone: "919000000000" },
//         location: {
//           latitude: position.coords.latitude,
//           longitude: position.coords.longitude,
//           name: "User Location",
//           address: "Current Location",
//         },
//       }),
//     });
//   },
//   (err) => console.error("Location error:", err)
// );

messageRouter.post("/locationMessage", async (req, res) => {
  const url = `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`;

  const { phone } = req.body.to;

  console.log(phone);

  const data = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: phone,
    type: "location",
    location: {
      latitude: "37.44216251868683",
      longitude: "-122.16153582049394",
      name: "Philz Coffee",
      address: "101 Forest Ave, Palo Alto, CA 94301",
    },
  };

  try {
    const response = await axios.post(url, data, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log(`Location sent to ${phone}`);

    // Send back the Facebook API response to the client
    return res.status(200).json(response.data);
  } catch (error) {
    console.error(
      `Failed for ${phone}:`,
      error.response?.data || error.message
    );
    // Send an error response to client
    return res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message,
    });
  }
});

// For create template message which should already approved by whatsapp
messageRouter.post("/createTemplate", async (req, res) => {
  const url =
    "https://graph.facebook.com/v21.0/102290129340398/message_templates";

  const { phone } = req.body.to;

  console.log(phone);

  const data = {
    name: "test_template",
    language: "en_US",
    category: "MARKETING",
    // Configure your TTL in seconds below
    message_send_ttl_seconds: "120",
    components: [
      {
        type: "BODY",
        text: "Shop now through {{1}} and use code {{2}} to get {{3}} off of all merchandise.",
        example: {
          body_text: [["the end of August", "25OFF", "25%"]],
        },
      },
      {
        type: "FOOTER",
        text: "Use the buttons below to manage your marketing subscriptions",
      },
    ],
  };

  try {
    const response = await axios.post(url, data, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log(` Template sent to ${phone}`);

    // Send back the Facebook API response to the client
    return res.status(200).json(response.data);
  } catch (error) {
    console.error(
      `❌ Failed for ${phone}:`,
      error.response?.data || error.message
    );
    // Send an error response to client
    return res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message,
    });
  }
});

module.exports = messageRouter;
