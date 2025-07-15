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

app.get('/person-action-modal', (req, res) => {
  res.json({
    data: {
      sections: [
        {
          fields: [
            {
              type: "select",
              key: "dialer",
              label: "Select Dialer",
              isRequired: true,
              options: {
                items: [
                  { label: "Anmol Madan (Active)", value: "anmol_madan" },
                  { label: "Priya Sharma", value: "priya_sharma" }
                ]
              }
            },
            {
              type: "datetime",
              key: "schedule_datetime",
              label: "Schedule Date & Time",
              isRequired: true,
              placeholder: "dd - mm - yyyy   -- : --"
            },
            {
              type: "select",
              key: "timezone",
              label: "Select Timezone",
              isRequired: true,
              options: {
                items: [
                  { label: "Asia/Kolkata", value: "Asia/Kolkata" },
                  { label: "UTC", value: "UTC" },
                  { label: "America/New_York", value: "America/New_York" }
                ]
              }
            },
            {
              type: "multiselect",
              key: "selected_numbers",
              label: "Selected Numbers",
              placeholder: "Waiting for selection...",
              isRequired: true,
              options: {
                items: [
                  { label: "+91 9876543210", value: "9876543210" },
                  { label: "+91 9123456789", value: "9123456789" }
                ]
              }
            },
            {
              type: "note",
              markdown: true,
              content: "**Name:** John Doe<br>**Email:** john@example.com<br>**Phone:** +1 555 1234567<br>**Organization:** Acme Corp"
            }
          ]
        }
      ],
      actions: [
        {
          type: "submit",
          label: "📞 Assign to Dialer",
          style: "primary"
        },
        {
          type: "cancel",
          label: "Cancel"
        }
      ]
    }
  });
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
