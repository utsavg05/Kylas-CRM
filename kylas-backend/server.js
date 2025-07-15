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
    // Extract query parameters sent by Pipedrive
    const { 
      selectedIds, 
      resource, 
      view, 
      userId, 
      companyId, 
      token 
    } = req.query;
    
    console.log('Request params:', { selectedIds, resource, view, userId, companyId });
    
    // selectedIds contains the person ID(s) selected by user
    const personIds = selectedIds ? selectedIds.split(',') : [];
    console.log('Selected Person IDs:', personIds);
    
    if (personIds.length === 0) {
      return res.status(400).json({
        error: { message: "No person selected" }
      });
    }
    
    // FETCH PERSON DATA - This was missing!
    let personData = null;
    try {
      personData = await fetchPersonData(personIds[0]); // Get first selected person
      console.log('Fetched person data:', personData);
    } catch (fetchError) {
      console.error('Error fetching person data:', fetchError);
      return res.status(500).json({
        error: { message: "Failed to load person data" }
      });
    }
    
    // Return schema with person data populated (matching your JSON structure)
    res.json({
      data: {
        blocks: {
          person_info_header: {
            type: "text",
            value: "# Selected Person Information",
            markdown: true
          },
          person_name: {
            type: "text",
            value: `**Name:** ${personData.name || 'N/A'}`,
            markdown: true
          },
          person_email: {
            type: "text",
            value: `**Email:** ${personData.email?.[0]?.value || 'N/A'}`,
            markdown: true
          },
          person_phone: {
            type: "text",
            value: `**Phone:** ${personData.phone?.[0]?.value || 'N/A'}`,
            markdown: true
          },
          person_organization: {
            type: "text",
            value: `**Organization:** ${personData.org_name || 'N/A'}`,
            markdown: true
          },
          action_selection: {
            type: "select",
            label: "What would you like to do with this person?",
            placeholder: "Select an action",
            isRequired: true,
            items: [
              {
                label: "Send Email Campaign",
                value: "email_campaign"
              },
              {
                label: "Add to Project",
                value: "add_project"
              },
              {
                label: "Schedule Follow-up",
                value: "schedule_followup"
              },
              {
                label: "Export Contact",
                value: "export_contact"
              }
            ]
          },
          project_selection: {
            type: "select",
            label: "Select Project",
            placeholder: "Choose a project",
            isRequired: true,
            visibleOn: {
              action_selection: {
                rule: "equals",
                value: "add_project"
              }
            },
            items: [
              {
                label: "Q1 Marketing Campaign",
                value: "project_1"
              },
              {
                label: "Product Launch",
                value: "project_2"
              },
              {
                label: "Customer Onboarding",
                value: "project_3"
              }
            ]
          },
          followup_date: {
            type: "datepicker",
            label: "Follow-up Date",
            placeholder: "Select date",
            message: "When should we follow up with this person?",
            isRequired: true,
            visibleOn: {
              action_selection: {
                rule: "equals",
                value: "schedule_followup"
              }
            }
          },
          export_format: {
            type: "radio",
            label: "Export Format",
            isRequired: true,
            visibleOn: {
              action_selection: {
                rule: "equals",
                value: "export_contact"
              }
            },
            items: [
              {
                label: "CSV",
                value: "csv"
              },
              {
                label: "JSON",
                value: "json"
              },
              {
                label: "vCard",
                value: "vcard"
              }
            ]
          }
        },
        actions: {
          cancel_action: {
            type: "action",
            label: "Cancel",
            handler: "cancel"
          },
          submit_action: {
            type: "action",
            label: "Execute Action",
            handler: "request"
          }
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

// Function to return test person data
async function fetchPersonData(personId) {
  try {
    console.log(`Returning test data for person ID: ${personId}`);
    
    // Test data based on person ID
    const testPersons = {
      '288': {
        id: '288',
        name: 'Sarah Johnson',
        email: [{ value: 'sarah.johnson@techcorp.com', primary: true }],
        phone: [{ value: '+1-555-0198', primary: true }],
        org_name: 'TechCorp Solutions',
        title: 'Marketing Director',
        status: 'active'
      },
      '289': {
        id: '289',
        name: 'Michael Chen',
        email: [{ value: 'michael.chen@innovate.com', primary: true }],
        phone: [{ value: '+1-555-0287', primary: true }],
        org_name: 'Innovate Industries',
        title: 'Product Manager',
        status: 'active'
      },
      '290': {
        id: '290',
        name: 'Emily Rodriguez',
        email: [{ value: 'emily.rodriguez@startup.io', primary: true }],
        phone: [{ value: '+1-555-0376', primary: true }],
        org_name: 'StartupXYZ',
        title: 'CEO',
        status: 'active'
      }
    };
    
    // Return specific test person or default
    return testPersons[personId] || {
      id: personId,
      name: `Test Person ${personId}`,
      email: [{ value: `person${personId}@example.com`, primary: true }],
      phone: [{ value: `+1-555-${personId.padStart(4, '0')}`, primary: true }],
      org_name: `Company ${personId}`,
      title: 'Sales Representative',
      status: 'active'
    };
    
  } catch (error) {
    console.error('Error in fetchPersonData:', error);
    throw error;
  }
}

// POST endpoint to handle form submission
app.post('/person-action-modal', async (req, res) => {
  try {
    console.log('Form submission data:', req.body);
    
    const formData = req.body;
    const { action_selection, project_selection, followup_date, export_format } = formData;
    
    // Process the selected action
    let result;
    let successMessage;
    
    switch (action_selection) {
      case 'email_campaign':
        result = await processEmailCampaign(formData);
        successMessage = 'Person added to email campaign successfully!';
        break;
      case 'add_project':
        result = await addToProject(formData, project_selection);
        successMessage = `Person added to project successfully!`;
        break;
      case 'schedule_followup':
        result = await scheduleFollowup(formData, followup_date);
        successMessage = `Follow-up scheduled for ${followup_date}!`;
        break;
      case 'export_contact':
        result = await exportContact(formData, export_format);
        successMessage = `Contact exported as ${export_format.toUpperCase()}!`;
        break;
      default:
        throw new Error('Invalid action selected');
    }
    
    // Return success response
    res.json({
      success: {
        message: successMessage,
        type: "snackbar",
        link: {
          label: "View Results",
          value: `https://your-app.com/results/${result.id}`
        }
      }
    });
    
  } catch (error) {
    console.error('Error processing form submission:', error);
    res.status(400).json({
      error: {
        message: "Failed to process the action. Please try again."
      }
    });
  }
});

// Helper functions for different actions
async function processEmailCampaign(formData) {
  console.log('Test: Processing email campaign:', formData);
  return { 
    id: 'campaign-' + Date.now(),
    message: 'Email campaign processed successfully'
  };
}

async function addToProject(formData, projectId) {
  console.log('Test: Adding to project:', formData, 'Project ID:', projectId);
  return { 
    id: 'project-' + Date.now(),
    message: 'Person added to project successfully'
  };
}

async function scheduleFollowup(formData, date) {
  console.log('Test: Scheduling follow-up:', formData, 'Date:', date);
  return { 
    id: 'followup-' + Date.now(),
    message: 'Follow-up scheduled successfully'
  };
}

async function exportContact(formData, format) {
  console.log('Test: Exporting contact:', formData, 'Format:', format);
  return { 
    id: 'export-' + Date.now(),
    message: 'Contact exported successfully'
  };
}





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
