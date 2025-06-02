// require("dotenv").config();
// const axios = require("axios");

// const token = process.env.WHATSAPP_TOKEN;
// const phoneNumberId = process.env.PHONE_NUMBER_ID;

// const recipients = [
//   { phone: "919097989707", name: "Shubham" },
//   //   { phone: "918051861367", name: "Honey" },
// ];

// const sendTemplateMessage = async (phone) => {
//   const url = `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`;

//   const data = {
//     messaging_product: "whatsapp",
//     to: phone,
//     type: "template",
//     template: {
//       name: "hello_world", // Make sure this template is approved
//       language: {
//         code: "en_US",
//       },
//     },
//   };

//   try {
//     const response = await axios.post(url, data, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "application/json",
//       },
//     });

//     console.log(`✅ Message sent to ${phone}`);
//   } catch (error) {
//     console.error(
//       `❌ Failed for ${phone}:`,
//       error.response?.data || error.message
//     );
//   }
// };

// const sendBulkMessages = async () => {
//   for (const recipient of recipients) {
//     await sendTemplateMessage(recipient.phone);
//     await new Promise((res) => setTimeout(res, 1000)); // Wait 1 sec between messages
//   }
// };

// sendBulkMessages();

require("dotenv").config();
const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");

const token = process.env.WHATSAPP_TOKEN;
const phoneNumberId = process.env.PHONE_NUMBER_ID;

const recipients = [
  { phone: "919097989707", name: "Shubham" },
  { phone: "918051861367", name: "Honey" },
];

// Upload media and return media_id
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

// Send image message using the media ID
const sendImageMessage = async (phone, mediaId) => {
  const url = `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`;

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

    console.log("Respone of Message", response);

    console.log(`✅ Message sent to ${phone}`);
  } catch (error) {
    console.error(
      `❌ Failed for ${phone}:`,
      error.response?.data || error.message
    );
  }
};

const sendBulkMessages = async () => {
  const mediaId = await uploadMedia("./assets/Logo-1.png");
  console.log("✅ Uploaded Media ID:", mediaId);

  for (const recipient of recipients) {
    await sendImageMessage(recipient.phone, mediaId);
    await new Promise((res) => setTimeout(res, 1000)); // 1 sec delay
  }
};

sendBulkMessages();
