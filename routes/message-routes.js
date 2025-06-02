const express = require("express");
const messageRouter = express.Router();
const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");

const token = process.env.WHATSAPP_TOKEN;
const phoneNumberId = process.env.PHONE_NUMBER_ID;
const mytoken = process.env.VERIFY_TOKEN;

//to verify the callback url from dashboard side - cloud api side
messageRouter.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const challenge = req.query["hub.challenge"];
  const token = req.query["hub.verify_token"];
  if (mode && token === process.env.VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.status(400).send("Invalid request");
  }
});

// whatever user sent the message / reply the message this is console the response
messageRouter.post("/", (req, res) => {
  console.log(JSON.stringify(req.body, null, 2));
  res.status(200).send("EVENT_RECEIVED");
});

// for template message which should already approved by whatsapp
messageRouter.post("/SendTemplate", async (req, res) => {
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

// for create template message which should already approved by whatsapp
messageRouter.post("/createTemplate", async (req, res) => {
  const url = `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`;

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
      body: "Hiii this is shubham",
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

// for images messages
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

// for locations messages

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

// messageRouter.get("/", (req, res) => {
//   res.status(200).send("Hello Shubham");
// });

module.exports = messageRouter;
