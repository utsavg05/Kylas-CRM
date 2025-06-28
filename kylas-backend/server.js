// import express from 'express';
// import cors from 'cors';
// import axios from 'axios';
// import dotenv from 'dotenv';
// import qs from 'qs';
// import path from 'path';
// import { fileURLToPath } from 'url';

// dotenv.config();

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const app = express();
// const PORT = 3001;

// app.use(cors());
// app.use(express.json());

// app.use((req, res, next) => {
//   res.setHeader('X-Frame-Options', 'ALLOWALL'); // Allow iframe embedding
//   next();
// });

// // 🧠 In-memory token store: accountId -> { access_token, refresh_token }
// const tokenStore = new Map();

// // ✅ 1. Health check
// // app.get('/', (req, res) => {
// //   res.send('✅ Kylas backend running!');
// // });

// // ✅ 2. OAuth Callback from Kylas
// app.get('/oauth/callback', async (req, res) => {
//   const code = req.query.code;
//   if (!code) return res.status(400).send('❌ Missing code from query params.');

//   const redirectUri = process.env.REDIRECT_URI;
//   const clientId = process.env.CLIENT_ID;
//   const clientSecret = process.env.CLIENT_SECRET;

//   const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

//   try {
//     // 🔄 Exchange code for tokens
//     const tokenRes = await axios.post(
//       'https://api.kylas.io/oauth/token',
//       qs.stringify({
//         grant_type: 'authorization_code',
//         code,
//         redirect_uri: redirectUri,
//         client_id: clientId,
//         client_secret: clientSecret,
//       }),
//       {
//         headers: {
//           Authorization: `Basic ${basicAuth}`,
//           'Content-Type': 'application/x-www-form-urlencoded',
//         },
//       }
//     );

//     const { access_token, refresh_token } = tokenRes.data;

//     // 🔍 Get account/user info
//     const userInfoRes = await axios.get('https://api.kylas.io/v1/users/self', {
//       headers: {
//         Authorization: `Bearer ${access_token}`,
//       },
//     });

//     const user = userInfoRes.data.user;
//     const accountId = user.accountId;

//     // 🗂️ Store token for this account
//     tokenStore.set(accountId, {
//       access_token,
//       refresh_token,
//     });

//     console.log(`✅ OAuth success for ${user.name} (${accountId})`);
//     console.log(`🔐 Access Token: ${access_token}`);
//     console.log(`🔁 Refresh Token: ${refresh_token}`);

//     // 🔁 Send data to frontend
//     res.json({
//       message: `OAuth successful for ${user.name}`,
//       account_id: accountId,
//       token: access_token,
//     });
//   } catch (error) {
//     console.error('❌ OAuth error:', error.response?.data || error.message);
//     res.status(500).json({
//       error: 'OAuth callback failed',
//       details: error.response?.data || error.message,
//     });
//   }
// });

// // ✅ 3. Verify IVR Token
// app.post('/api/verify-token', async (req, res) => {
//   const { token } = req.body;
//   if (!token) return res.status(400).json({ error: '❌ Token is required' });

//   try {
//     const response = await axios.post(
//       'https://api.ivrsolutions.in/api/key_authentication',
//       {},
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       }
//     );

//     console.log('✅ IVR token verified');
//     res.json(response.data);
//   } catch (error) {
//     console.error('❌ IVR verification failed:', error.response?.data || error.message);
//     res.status(500).json({ error: 'Token verification failed' });
//   }
// });

// // ✅ 4. Get Kylas Leads for an Account
// app.get('/api/leads', async (req, res) => {
//   const accountId = req.query.account_id;
//   if (!accountId || !tokenStore.has(accountId)) {
//     return res.status(400).json({ error: '❌ Missing or invalid account_id' });
//   }

//   const { access_token } = tokenStore.get(accountId);

//   try {
//     const response = await axios.get('https://api.kylas.io/v1/leads', {
//       headers: {
//         Authorization: `Bearer ${access_token}`,
//       },
//     });

//     res.json(response.data);
//   } catch (error) {
//     console.error('❌ Error fetching leads:', error.response?.data || error.message);
//     res.status(500).json({ error: 'Failed to fetch leads' });
//   }
// });

// // ✅ Serve React frontend
// app.use(express.static(path.join(__dirname, '../kylas-frontend/dist')));
// app.get('/{*any}', (req, res) => {
//   res.sendFile(path.join(__dirname, '../kylas-frontend/dist/index.html'));
// });

// // ✅ Start server
// app.listen(PORT, () => {
//   console.log(`🚀 Server running at http://localhost:${PORT}`);
// });




import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import qs from 'qs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const tempTokenStore = new Map(); // holds tokens temporarily until IVR is verified
const activeAccounts = new Map(); // final storage after IVR check

// ✅ OAuth Callback — Temporarily hold tokens
app.get('/oauth/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).json({ error: 'Missing code' });

  try {
    const basicAuth = Buffer.from(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString('base64');

    const tokenRes = await axios.post(
      'https://api.kylas.io/oauth/token',
      qs.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.REDIRECT_URI,
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
      }),
      {
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token, refresh_token } = tokenRes.data;

    const userInfoRes = await axios.get('https://api.kylas.io/v1/users/self', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const accountId = userInfoRes.data.user.accountId;

    // Store in temp memory
    tempTokenStore.set(accountId, {
      access_token,
      refresh_token,
      verified: false,
    });

    // Redirect user to IVR verification page with account ID
    res.redirect(`/?account_id=${accountId}`);
  } catch (err) {
    console.error('OAuth failed:', err.response?.data || err.message);
    res.status(500).json({
      error: 'OAuth callback failed',
      details: err.response?.data || err.message,
    });
  }
});

// ✅ IVR Token Verification
app.post('/api/verify-token', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token required' });

  try {
    const result = await axios.post(
      'https://api.ivrsolutions.in/api/key_authentication',
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    res.json({ success: true });
  } catch (err) {
    console.error('IVR verification failed:', err.response?.data || err.message);
    res.status(500).json({ error: 'IVR token verification failed' });
  }
});

// ✅ Finalize account after IVR token is verified
app.post('/api/activate-account', (req, res) => {
  const { account_id } = req.body;

  if (!account_id || !tempTokenStore.has(account_id)) {
    return res.status(400).json({ error: 'Invalid account_id or expired session' });
  }

  const data = tempTokenStore.get(account_id);
  activeAccounts.set(account_id, {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  });

  tempTokenStore.delete(account_id);
  res.json({ message: 'Account activated' });
});

// ✅ Protected route — get leads
app.get('/api/leads', async (req, res) => {
  const accountId = req.query.account_id;

  if (!accountId || !activeAccounts.has(accountId)) {
    return res.status(403).json({ error: 'Unauthorized or missing account' });
  }

  const { access_token } = activeAccounts.get(accountId);

  try {
    const result = await axios.get('https://api.kylas.io/v1/leads', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    res.json(result.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// ✅ Serve React app
app.use(express.static(path.join(__dirname, '../kylas-frontend/dist')));
app.get('/{*any}', (req, res) => {
  res.sendFile(path.join(__dirname, '../kylas-frontend/dist/index.html'));
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
