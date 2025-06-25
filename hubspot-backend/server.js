const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config(); // Load .env variables

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// 🟢 Health check
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// 🔐 1. Handle HubSpot token exchange
app.post('/api/exchange-code', async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('client_id', process.env.CLIENT_ID);
    params.append('client_secret', process.env.CLIENT_SECRET);
    params.append('redirect_uri', process.env.REDIRECT_URI);
    params.append('code', code);

    const tokenResponse = await axios.post('https://api.hubapi.com/oauth/v1/token', params);
    console.log('🔐 Token Response:', tokenResponse);
    console.log('🔑 Token Response:', tokenResponse.data);

    const { access_token, refresh_token } = tokenResponse.data;
    console.log('✅ HubSpot Access Token:', access_token);
    console.log('🔁 Refresh Token:', refresh_token);
    const token = access_token;
    

    res.json({ message: 'Token exchange successful', token: access_token });
  } catch (error) {
    console.error('❌ HubSpot token exchange failed:', error.response?.data || error.message);
    res.status(500).json({ error: 'Token exchange failed' });
  }
});

// ✅ 2. IVR token verification
app.post('/api/verify-token', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    console.log('🔍 Verifying IVR Token:', token);

    const response = await axios.post(
      'https://api.ivrsolutions.in/api/key_authentication',
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log('✅ IVR API response:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error(
      '❌ Error from IVR API:',
      error.response?.status,
      error.response?.data || error.message
    );
    res.status(500).json({ error: 'Token verification failed' });
  }
});
app.get('/api/get-portal-id', async (req, res) => {
  const accessToken = process.env.ACCESS_TOKEN;

  if (!accessToken) {
    return res.status(400).json({ error: 'Missing ACCESS_TOKEN in .env' });
  }

  try {
    const response = await axios.get('https://api.hubapi.com/integrations/v1/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const { portalId } = response.data;

    return res.status(200).json({ portalId });
  } catch (error) {
    console.error('❌ Error fetching portal ID:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Failed to fetch portal ID' });
  }
});

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`🚀 Proxy server running at http://localhost:${PORT}`);
  createTestContact(); // Call HubSpot API on startup
});

// 🧪 Create a contact in HubSpot on server start
async function createTestContact() {
const accessToken = process.env.ACCESS_TOKEN;

  if (!accessToken) {
    console.error('❌ No ACCESS_TOKEN in .env');
    return;
  }

  try {
    const response = await axios.post(
      'https://api.hubapi.com/crm/v3/objects/contacts',
      {
        properties: {
          email: 'devhiusr@example.com',
          firstname: 'Test',
          lastname: 'User',
          phone: '12345',
        }
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ HubSpot contact created:', response.data);
    
  } catch (error) {
    console.error('❌ Failed to create contact:', error.response?.data || error.message);
  }
}
