const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const path = require("path");

const token = process.env.WHATSAPP_TOKEN;
const phoneNumberId = process.env.PHONE_NUMBER_ID;
const mytoken = process.env.VERIFY_TOKEN;

const receivedMessages = [];

const uploadMedia = async (filePath, mediaType = "image") => {
  const form = new FormData();
  const fileName = path.basename(filePath);

  // Append file with filename explicitly
  form.append("file", fs.createReadStream(filePath), { filename: fileName });
  form.append("messaging_product", "whatsapp");

  // Add type only for video/audio
  if (["video", "audio", "document"].includes(mediaType)) {
    form.append("type", mediaType);
  }

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

const downloadMedia = async (mediaId, mediaType) => {
  const token = process.env.WHATSAPP_TOKEN;

  try {
    // Step 1: Get media URL
    const mediaMeta = await axios.get(
      `https://graph.facebook.com/v19.0/${mediaId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const mediaUrl = mediaMeta.data.url;

    // Step 2: Download media file
    const mediaFile = await axios.get(mediaUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: "arraybuffer",
    });

    // Step 3: Save file locally
    const fileExt =
      {
        image: "jpg",
        video: "mp4",
        audio: "ogg",
        document: "pdf", // or infer from mime_type
      }[mediaType] || "bin";

    const downloadPath = path.join(__dirname, "downloads");
    if (!fs.existsSync(downloadPath)) fs.mkdirSync(downloadPath);

    const filePath = path.join(downloadPath, `${mediaId}.${fileExt}`);
    fs.writeFileSync(filePath, mediaFile.data);

    console.log(`✅ Saved ${mediaType} to ${filePath}`);
  } catch (error) {
    console.error(
      "❌ Failed to download media:",
      error.response?.data || error.message
    );
  }
};

exports.sendTemplate = async (req, res) => {
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
      ` Failed for ${phone}:`,
      error.response?.data || error.message
    );
    // Send an error response to client
    return res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message,
    });
  }
};

exports.sendMessage = async (req, res) => {
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

    console.log(`Message sent to ${phone}`);

    // Send back the Facebook API response to the client
    return res.status(200).json(response.data);
  } catch (error) {
    console.error(
      ` Failed for ${phone}:`,
      error.response?.data || error.message
    );
    // Send an error response to client
    return res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message,
    });
  }
};

exports.sendLocation = async (req, res) => {
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
};

exports.createTemplate = async (req, res) => {
  const url = `https://graph.facebook.com/v23.0/${phoneNumberId}/message_templates`;

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
};

exports.sendImages = async (req, res) => {
  const mediaId = await uploadMedia("./assets/Logo-1.png");
  console.log(" Uploaded Media ID:", mediaId);

  const url = `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`;

  const { phone } = req.body.to;

  console.log(phone);

  const data = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: phone,
    type: "image",
    image: {
      id: mediaId,
    },
  };

  try {
    const response = await axios.post(url, data, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log(` Image sent to ${phone}`);

    // Send back the Facebook API response to the client
    return res.status(200).json(response.data);
  } catch (error) {
    console.error(
      ` Failed for ${phone}:`,
      error.response?.data || error.message
    );
    // Send an error response to client
    return res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message,
    });
  }
};

exports.sendDocuments = async (req, res) => {
  const docsId = await uploadMedia("./assets/BPSC_Result.pdf", "document");
  const url = `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`;

  const { phone } = req.body.to;

  const data = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: phone,
    type: "document",
    document: {
      id: docsId, // Only if using uploaded media -->
      filename: "BPSC_RESULT.pdf",
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
      ` Failed for ${phone}:`,
      error.response?.data || error.message
    );
    // Send an error response to client
    return res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message,
    });
  }
};

exports.sendAudio = async (req, res) => {
  const audioId = await uploadMedia("./assets/andro-isa-67087.mp3", "audio");
  const url = `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`;

  const { phone } = req.body.to;

  const data = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: phone,
    type: "audio",
    audio: {
      id: audioId,
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
      `Failed for ${phone}:`,
      error.response?.data || error.message
    );
    // Send an error response to client
    return res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message,
    });
  }
};

exports.sendVideo = async (req, res) => {
  const videoId = await uploadMedia("./assets/videoplayback.mp4", "video");

  const url = `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`;

  const { phone } = req.body.to;

  const data = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: phone,
    type: "video",
    video: {
      id: videoId,
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
      ` Failed for ${phone}:`,
      error.response?.data || error.message
    );
    // Send an error response to client
    return res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message,
    });
  }
};

exports.sendContact = async (req, res) => {
  const { phone } = req.body.to;

  const url = `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`;

  const data = {
    messaging_product: "whatsapp",
    to: phone,
    type: "contacts",
    contacts: [
      {
        addresses: [
          {
            street: "Rajasan",
            city: "HJP",
            state: "BR",
            zip: "844102",
            country: "India",
            country_code: "IN",
            type: "Work",
          },
          {
            street: "Rajasan",
            city: "HJP",
            state: "BR",
            zip: "844102",
            country: "India",
            country_code: "IN",
            type: "Work",
          },
        ],
        birthday: "2001-03-09",
        emails: [
          {
            email: "shubham@stadopublication.com",
            type: "Work",
          },
        ],
        name: {
          formatted_name: "Kumar Shubham",
          first_name: "Kumar",
          last_name: "Shubham",
          prefix: "Mr.",
        },
        org: {
          company: "Stado Publication Pvt. Ltd.",
          department: "IT",
          title: "Software Developer",
        },
        phones: [
          {
            phone: "+919097989707",
            type: "Work",
          },
          {
            phone: "+919097989707",
            type: "Mobile",
            wa_id: "19175559999",
          },
        ],
        urls: [
          {
            url: "https://stadopublication.com/",
            type: "Work",
          },
          {
            url: "https://stadopublication.com/",
            type: "Work",
          },
        ],
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

    console.log(`📇 Contact sent to ${phone}`);
    return res.status(200).json(response.data);
  } catch (error) {
    console.error(
      `❌ Failed for ${phone}:`,
      error.response?.data || error.message
    );
    return res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message,
    });
  }
};

// To verify the callback url from dashboard side - cloud api side
exports.verifyCallback = (req, res) => {
  const mode = req.query["hub.mode"];
  const challenge = req.query["hub.challenge"];
  const token = req.query["hub.verify_token"];
  if (mode && token === process.env.VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.status(400).send("Invalid request");
  }
};

// Whatever user sent the message / reply the message this is console the response
exports.webhookCall = (req, res) => {
  console.log(
    "******************************* Partition 1 ******************************"
  );

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
    console.log(
      `MESSAGE STATUS UPDATE:\nID: ${statuses.id},\nSTATUS: ${statuses.status}`
    );

    receivedMessages.push({
      type: "status",
      id: statuses.id,
      status: statuses.status,
      timestamp: new Date().toISOString(),
    });
  }

  if (messages) {
    const from = messages.from;
    const type = messages.type;

    // ✅ Handle text messages
    if (type === "text") {
      const text = messages.text.body.toLowerCase();

      // Automated replies
      if (text === "hello") {
        const replyText = "Hello, How are you?";
        replyMessage(from, replyText, messages.id);
        receivedMessages.push({
          type: "response",
          from: "server",
          message: replyText,
          timestamp: new Date().toISOString(),
        });
      }

      if (text === "list") {
        sendList(from);
        receivedMessages.push({
          type: "response",
          from: "server",
          message: "Sent an interactive list message.",
          timestamp: new Date().toISOString(),
        });
      }

      if (text === "buttons") {
        sendReplyButtons(from);
        receivedMessages.push({
          type: "response",
          from: "server",
          message: "Sent an interactive reply buttons message.",
          timestamp: new Date().toISOString(),
        });
      }

      // ✅ Push text message to store
      receivedMessages.push({
        type: "message",
        from,
        message: messages.text.body,
        timestamp: new Date().toISOString(),
      });
    }

    // ✅ Handle interactive replies
    if (type === "interactive") {
      const interaction = messages.interactive;
      if (interaction.type === "list_reply") {
        sendMessage(
          from,
          `You selected the option with ID ${interaction.list_reply.id} - Title ${interaction.list_reply.title}`
        );
      } else if (interaction.type === "button_reply") {
        sendMessage(
          from,
          `You selected the button with ID ${interaction.button_reply.id} - Title ${interaction.button_reply.title}`
        );
      }
    }

    // ✅ Handle image messages
    if (type === "image") {
      const mediaId = messages.image.id;
      console.log(`📷 Received image with ID: ${mediaId}`);

      receivedMessages.push({
        type: "media",
        mediaType: "image",
        mediaId,
        from,
        timestamp: new Date().toISOString(),
      });

      downloadMedia(mediaId, "image");
    }

    // ✅ Handle audio messages
    if (type === "audio") {
      const mediaId = messages.audio.id;
      console.log(`🎧 Received audio with ID: ${mediaId}`);

      receivedMessages.push({
        type: "media",
        mediaType: "audio",
        mediaId,
        from,
        timestamp: new Date().toISOString(),
      });

      downloadMedia(mediaId, "audio");
    }

    // ✅ Handle video messages
    if (type === "video") {
      const mediaId = messages.video.id;
      console.log(`🎥 Received video with ID: ${mediaId}`);

      receivedMessages.push({
        type: "media",
        mediaType: "video",
        mediaId,
        from,
        timestamp: new Date().toISOString(),
      });

      downloadMedia(mediaId, "video");
    }

    // ✅ Handle document messages
    if (type === "document") {
      const mediaId = messages.document.id;
      const filename = messages.document.filename || "document";

      console.log(`📄 Received document with ID: ${mediaId}`);

      receivedMessages.push({
        type: "media",
        mediaType: "document",
        mediaId,
        fileName: filename,
        from,
        timestamp: new Date().toISOString(),
      });

      downloadMedia(mediaId, "document");
    }

    // ✅ Optional: Debugging log for full message
    console.log(JSON.stringify(messages, null, 2));
  }

  res.status(200).send("Webhook processed");
};

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

// Reterive the message
exports.message = (req, res) => {
  res.json(receivedMessages);
};
