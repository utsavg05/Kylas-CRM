import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv'
import qs from 'qs';
import path from 'path';

// import connectDB from './config/connectDB.js';

import kylasRoutes from './routes/kylas.js';
import contactRoutes from './routes/contact.js';
// import ivrTokenRoutes from './routes/ivrTokenRoutes.js';
import webhookRoutes from './routes/kylasWebhook.js'

dotenv.config();

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/kylas', kylasRoutes);
app.use('/api/contact', contactRoutes);
// app.use('/api/ivr-token', ivrTokenRoutes);
app.use('/api/kylas', webhookRoutes);

app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'ALLOWALL'); // 🟢 allow iframe embedding
  next();
});

// ✅ 1. Health check
// app.get('/', (req, res) => {
//   res.send('Kylas backend running!');
// });

// ✅ 2. OAuth Callback from Kylas
app.post('/oauth/callback', async (req, res) => {
  const code = req.query.code;
  console.log(code);
  console.log(typeof code);


  if (!code) return res.status(400).send('Missing code from query params.');

  const basicAuth = Buffer.from(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString('base64');


  try {
    const tokenRes = await axios.post(
      'https://api.kylas.io/oauth/token',
      qs.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.REDIRECT_URI,
      }),
      {
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token, refresh_token } = tokenRes.data;
    process.env.ACCESS_TOKEN = access_token; // 🔁 TEMPORARY STORAGE (for local test)

    console.log('✅ Kylas Access Token:', access_token);
    console.log('🔁 Kylas Refresh Token:', refresh_token);

    // Optional: fetch user info
    // const userInfo = await axios.get('https://api.kylas.io/v1/users/self', {
    //   headers: {
    //     Authorization: `Bearer ${access_token}`,
    //   },
    // });

    // console.log('👤 User Info:', userInfo.data.user);

    res.status(200).json({ token: access_token });
  } catch (error) {
    console.error('❌ OAuth error:', error.response?.data || error.message);
    res.status(500).json({ error: 'OAuth callback failed' });
  }
});

// ✅ 3. IVR token verification
app.post('/api/verify-token', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token is required' });

  try {
    console.log('🔍 Verifying IVR token:', token);

    const response = await axios.post(
      'https://api.ivrsolutions.in/api/key_authentication',
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log('✅ IVR API Response:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('❌ IVR verification error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Token verification failed' });
  }
});

// ✅ 4. Sample: Use access token to call Kylas API (get leads)
app.get('/api/leads', async (req, res) => {
  const token = process.env.ACCESS_TOKEN;
  if (!token) return res.status(400).json({ error: 'Missing access token' });

  try {
    const response = await axios.get('https://api.kylas.io/v1/leads', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error('❌ Error fetching leads:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

app.get('/person-action-modal', async (req, res) => {
  try {
    const { selectedIds } = req.query;
    const personIds = selectedIds ? selectedIds.split(',') : [];

    console.log('Selected Person IDs:', personIds);

    if (personIds.length === 0) {
      return res.status(400).json({
        error: { message: "No person selected" }
      });
    }

    const itemsdata = [];

    // ✅ Async function to fetch dialers and return list
    async function fetchDialers() {
      const response = await fetch('https://api.ivrsolutions.in/api/get_dialers_list', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer 9d9e342f9478836c02171cbcf68d0c7b',
          'Content-Type': 'application/json'
        }
      });

      const dialers = await response.json();
      if (!dialers.data) {
        throw new Error("No dialer data found");
      }

      dialers.data.forEach(item => {
        itemsdata.push({
          label: `${item.name} (${item.status})`,
          value: item.id
        });
      });
    }

    // ⏳ Wait for dialer fetch to finish before responding
    await fetchDialers();

    // ✅ Now return the modal structure
    res.json({
      data: {
        blocks: {
          action_selection: {
            items: itemsdata
          },
          project_selection: {},
          followup_date: {}
        },
        actions: {
          cancel_action: {},
          submit_action: {}
        }
      }
    });

  } catch (error) {
    console.error('Error handling modal request:', error);
    res.status(500).json({
      error: { message: "Failed to load person data" }
    });
  }
});
//post request todo here
// app.post('/person-action-modal', async (req, res) => {
//   console.log("🟢 Received from modal:", req.body);
//   console.log("🟡 Query params:", req.query);

//   res.json({
//     success: {
//       message: "Action received and processed."
//     }
//   });
// });

// Utility function to extract phone numbers
const extractPhoneNumbers = (person) => {
  return (person.phone || [])
    .map(p => p.value)
    .filter(Boolean);
};

// Your endpoint
app.post('/person-action-modal', async (req, res) => {
  try {
    console.log("🟢 Received from modal:", req.body);
    console.log("🟡 Query params:", req.query);

    const {
      action_selection: dialerId,
      followup_date,
      project_selection: timezone
    } = req.body;

    const {
      selectedIds = '',
      companyId,
     
    } = req.query;

   

    const personIds = selectedIds.split(',').map(id => id.trim());
    const domain = 'abhishek-sandbox3.pipedrive.com'; // Make this dynamic per your use case
    const phoneNumbers = [];

    // 🔁 Loop through each person and fetch phone numbers
    for (const personId of personIds) {
      const url = `https://${domain}/api/v1/persons/${personId}`;
      const { data } = await axios.get(url, {
        headers: {
          Authorization: `Bearer v1u:AQIBAHj-LzTNK2yuuuaLqifzhWb9crUNKTpk4FlQ9rjnXqp_6AH1xWIuX4UNV4pLjxXmWX9qAAAAfjB8BgkqhkiG9w0BBwagbzBtAgEAMGgGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMFHdktw7w7f0Pjg7rAgEQgDvdZiq5D_z3NrqUDbPJtST4-2TOMCW6wX9bysOeNz1dnXk2iat6N4tJCtsyTenFd4dHuS53Kg7r436P0Q:73UXBKQBUxhNamj1WAZ2fyYnwqHr5q7guI3b4xsLQsLQ0WXXkm6NtGL9vg3hTnclN1ff4w_sl046wrcy6ldZt_VntWU7izFrMzboGbD680uxndPDdZTXD_8jWGI9G1guMlSsQkjpf8rzDMmCJyse3mGFP17h6gPHjR92jiiKgJrRxpDSZITGDj9kLPflIjdh-ulGPuLTW7GFNot-B_zG8-60zTK3GqMuo0x_xy9wQF0XBUbtTLPpN0PAFqLsHEx22v5Ss4U14T1vNJtX9RkvBjbAhQjs-Yi70auU1l6EqUogFGv0yjRxYmqI3dxNvXdzcs_gXzLrTsTYq9gClce1OO4_WDlgFPO1JRDxCktMXxzB08hVwMtfjTxyygzzx6WmPoDrWha6xzVjFiBLjwddpjWmf7AoxVi6gtrL4Ql9TtUVN4Us` // Use passed token from query
        }
      });

      if (data?.data) {
        const numbers = extractPhoneNumbers(data.data);
        numbers.forEach(num => {
          phoneNumbers.push({ phone_number: num });
        });
      }
    }

    if (!phoneNumbers.length) {
      return res.status(400).json({
        success: false,
        message: "No phone numbers found."
      });
    }

    // 📦 Construct dialer payload
    const payload = {
      dialerid: dialerId,
      recordList: phoneNumbers
    };

    if (followup_date && timezone) {
      payload.schedule_datetime = `${followup_date} 15:50:00`;
      payload.timezone = timezone;
    }

    // 📤 Send to dialer
    const dialerResponse = await axios.post(
      'https://api.ivrsolutions.in/v1/add_to_dialer',
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.DIALER_API_KEY}`
        }
      }
    );

    console.log("📤 Sent to dialer:", payload);
    console.log("✅ Dialer response:", dialerResponse.data);

    // ✅ Pipedrive expects this format
    return res.json({
      success: {
        message: "Action received and processed."
      }
    });

  } catch (error) {
    console.error("❌ Error in /person-action-modal:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add to dialer.",
      error: error.message
    });
  }
});









app.use(express.static(path.join(__dirname, '../kylas-frontend/dist')));
app.get("/{*any}", (req, res) => {
  res.sendFile(path.join(__dirname, '../kylas-frontend/dist/index.html'));
});
// changed


// ✅ Start server
app.listen(PORT, () => {
  // connectDB()
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
