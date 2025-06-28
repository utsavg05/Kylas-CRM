// import { useEffect, useState } from 'react';
// import axios from 'axios';

// function App() {
//   const [token, setToken] = useState('');
//   const [status, setStatus] = useState(0);
//   const [error, setError] = useState('');

//   // 🔄 On mount: Exchange Kylas OAuth code
//   useEffect(() => {

//     const exchangeCode = async () => {
//       console.log('🔄 Checking for OAuth code in URL...');
//       const urlParams = new URLSearchParams(window.location.search);
//       const code = urlParams.get('code');

//       if (!code) {
//         console.log('🔍 No OAuth code found in URL.');
//         return;
//       }

//       alert('🔁 Exchanging authorization code...');

//       await axios.get(`https://kylas-crm.onrender.com/oauth/callback?code=${code}`)
//         .then((res) => {
//           alert(res.data.message || '✅ OAuth success!');
//           console.log(res);
//           console.log('🔐 Access Token:', res.data.token);
//           localStorage.setItem('kylas_access_token', res.data.token);
//           setStatus('success');

//           if (res.data.account_id) {
//             localStorage.setItem('account_id', res.data.account_id);
//           }

//         })
//         .catch((err) => {
//           console.error('❌ OAuth exchange failed:', err);
//           alert('❌ OAuth exchange failed. See console for details.');
//         });
//     }

//     exchangeCode();

//   }, []);

//   // ✅ Handle IVR token submit
//   const handleSubmit = async () => {
//     setStatus('loading');
//     setError('');

//     try {
//       const res = await axios.post('https://kylas-crm.onrender.com/api/verify-token', { token });

//       if (res.status === 200) {
//         localStorage.setItem('ivr_token', token);
//         setStatus('success');
//         alert('✅ IVR token verified successfully!');
//         setToken('');
//       } else {
//         setStatus('error');
//         setError('Verification failed. Try again.');
//       }
//     } catch (err) {
//       console.error('❌ Error verifying token:', err);
//       setStatus('error');
//       setError('Something went wrong. Please check token and retry.');
//     }
//   };

//   return (
//     <div
//       style={{
//         minHeight: '100vh',
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'center',
//         backgroundColor: '#0f172a',
//         padding: '1rem',
//       }}
//     >
//       <div
//         style={{
//           width: '100%',
//           maxWidth: '28rem',
//           backgroundColor: '#ffffff', // adjust dynamically for dark mode if needed
//           borderRadius: '1rem',
//           padding: '2rem',
//           boxShadow: '0 10px 15px rgba(0, 0, 0, 0.3)',
//           border: '1px solid #374151',
//         }}
//       >
//         <h2
//           style={{
//             fontSize: '1.875rem',
//             fontWeight: 'bold',
//             textAlign: 'center',
//             marginBottom: '1.5rem',
//             color: '#1f2937', // dark:text-white would be '#ffffff'
//           }}
//         >
//           🔐 Authenticate IVR Access
//         </h2>

//         <input
//           type="text"
//           value={token}
//           onChange={(e) => setToken(e.target.value)}
//           placeholder="Enter your IVR Token"
//           style={{
//             width: '100%',
//             padding: '0.5rem 1rem',
//             borderRadius: '0.5rem',
//             border: '1px solid #d1d5db',
//             outline: 'none',
//             marginBottom: '1rem',
//             color: '#000000',
//             backgroundColor: '#ffffff', // dark mode variant: '#1e293b'
//           }}
//         />

//         <button
//           onClick={handleSubmit}
//           disabled={status === 'loading' || token.trim() === ''}
//           style={{
//             width: '100%',
//             padding: '0.5rem 1rem',
//             borderRadius: '0.5rem',
//             fontWeight: '600',
//             transition: 'background-color 0.2s ease-in-out',
//             cursor:
//               status === 'loading' || token.trim() === ''
//                 ? 'not-allowed'
//                 : 'pointer',
//             backgroundColor:
//               status === 'loading' || token.trim() === ''
//                 ? '#9ca3af'
//                 : '#facc15', // yellow-400
//             color: status === 'loading' ? '#000000' : '#000000',
//           }}
//         >
//           {status === 'loading' ? 'Verifying...' : 'Verify Token'}
//         </button>

//         {status === 'success' && (
//           <p
//             style={{
//               color: '#4ade80', // green-400
//               textAlign: 'center',
//               marginTop: '1rem',
//             }}
//           >
//             ✅ Token verified successfully!
//           </p>
//         )}

//         {status === 'error' && (
//           <p
//             style={{
//               color: '#f87171', // red-400
//               textAlign: 'center',
//               marginTop: '1rem',
//             }}
//           >
//             ❌ {error}
//           </p>
//         )}
//       </div>
//     </div>

//   );
// }

// export default App;





import { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [token, setToken] = useState('');
  const [status, setStatus] = useState(0);
  const [error, setError] = useState('');

  // 🔄 On mount: Exchange Kylas OAuth code
  // useEffect(() => {
  //   const urlParams = new URLSearchParams(window.location.search);
  //   const code = urlParams.get('code');

  //   if (!code) {
  //     console.log('🔍 No OAuth code found in URL.');
  //     return;
  //   }

  //   alert('🔁 Exchanging authorization code...');

  //   axios.post(`https://kylas-crm.onrender.com/oauth/callback?code=${code}`)
  //     .then((res) => {
  //       alert(res.data.message || '✅ OAuth success!');
  //       console.log(res);
  //       console.log('🔐 Access Token:', res.data.token);
  //     })
  //     .catch((err) => {
  //       console.error('❌ OAuth exchange failed:', err);
  //       alert('❌ OAuth exchange failed. See console for details.');
  //     });
  // }, []);

  // ✅ Handle IVR token submit
  const handleSubmit = async () => {
    setStatus('loading');
    setError('');

    try {
      const res = await axios.post('https://kylas-crm.onrender.com/api/verify-token', { token });

      if (res.status === 200) {
        localStorage.setItem('ivr_token', token);
        setStatus('success');
        alert('✅ IVR token verified successfully!');
        setToken('');
      } else {
        setStatus('error');
        setError('Verification failed. Try again.');
      }
    } catch (err) {
      console.error('❌ Error verifying token:', err);
      setStatus('error');
      setError('Something went wrong. Please check token and retry.');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f172a',
        padding: '1rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '28rem',
          backgroundColor: '#ffffff', // adjust dynamically for dark mode if needed
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 10px 15px rgba(0, 0, 0, 0.3)',
          border: '1px solid #374151',
        }}
      >
        <h2
          style={{
            fontSize: '1.875rem',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '1.5rem',
            color: '#1f2937', // dark:text-white would be '#ffffff'
          }}
        >
          🔐 Authenticate IVR Access
        </h2>

        <input
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Enter your IVR Token"
          style={{
            width: '100%',
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            border: '1px solid #d1d5db',
            outline: 'none',
            marginBottom: '1rem',
            color: '#000000',
            backgroundColor: '#ffffff', // dark mode variant: '#1e293b'
          }}
        />

        <button
          onClick={handleSubmit}
          disabled={status === 'loading' || token.trim() === ''}
          style={{
            width: '100%',
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            fontWeight: '600',
            transition: 'background-color 0.2s ease-in-out',
            cursor:
              status === 'loading' || token.trim() === ''
                ? 'not-allowed'
                : 'pointer',
            backgroundColor:
              status === 'loading' || token.trim() === ''
                ? '#9ca3af'
                : '#facc15', // yellow-400
            color: status === 'loading' ? '#000000' : '#000000',
          }}
        >
          {status === 'loading' ? 'Verifying...' : 'Verify Token'}
        </button>

        {status === 'success' && (
          <p
            style={{
              color: '#4ade80', // green-400
              textAlign: 'center',
              marginTop: '1rem',
            }}
          >
            ✅ Token verified successfully!
          </p>
        )}

        {status === 'error' && (
          <p
            style={{
              color: '#f87171', // red-400
              textAlign: 'center',
              marginTop: '1rem',
            }}
          >
            ❌ {error}
          </p>
        )}
      </div>
    </div>

  );
}

export default App;