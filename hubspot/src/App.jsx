import { useState, useEffect } from 'react';

import axios from 'axios';

function App() {
  const [token, setToken] = useState('');
  const [status, setStatus] = useState(0);
  

  useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');

  if (status === 0) {
    alert('Please wait while we exchange your code for an access token...');
    return;
  }

  if (code) {
    // Step 1: Exchange code for access token
    axios.post('http://localhost:3001/api/exchange-code', { code })
      .then(res => {
        console.log('✅ Access Token:', res.data.token);
        localStorage.setItem('hubspot_token', res.data.token);
        alert('✅ Token received');

        // Step 2: Now call the portal ID endpoint
        axios.get('http://localhost:3001/api/get-portal-id')
          .then(res2 => {
            const portalId = res2.data.portalId;
            console.log('🏢 Portal ID:', portalId);
            alert(`Portal ID: ${portalId}`);

         
            window.location.href = `https://app.hubspot.com/connected-apps/${portalId}/installed`;
          })
          .catch(err => {
            console.error('❌ Error fetching portal ID:', err);
            alert('Error getting portal ID');
          });
      })
      .catch(err => {
        console.error('❌ Token exchange failed:', err);
        alert('Error exchanging code');
      });
  }
}, [status]);

  // ✅ Submit your IVR token to /api/verify-token
  const handleSubmit = async () => {
    try {
      const response = await axios.post(
        'http://localhost:3001/api/verify-token',
        { token }
      );
      if(response.status === 200) {
        alert('IVR token verified!');
        setStatus(response.status);
      } 
      else {
        alert('Invalid token or request failed.');
      }

      
      localStorage.setItem('ivr_token', token);
      setToken('');
    } catch (error) {
      console.error('Error verifying IVR token:', error);
      alert('Invalid token or request failed.');
    }
  };

  return (
    <>
      <h1>Welcome to IVR Solution</h1>

      <input
        type="text"
        placeholder="Enter IVR token"
        value={token}
        onChange={(e) => setToken(e.target.value)}
      />
      <button onClick={handleSubmit}>Verify IVR Token</button>
    </>
  );
}

export default App;
