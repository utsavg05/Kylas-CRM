// import React, { useEffect, useState } from 'react';
// import axios from 'axios';

// const IVRWidget = () => {
//   const [contactId, setContactId] = useState(null);
//   const [contactInfo, setContactInfo] = useState(null);

//   useEffect(() => {
//     const params = new URLSearchParams(window.location.search);
//     const id = params.get("contactId");
//     setContactId(id);

//     if (id) {
//       axios.get(`https://kylas-crm.onrender.com/api/kylas/contact/${id}`)
//         .then(res => setContactInfo(res.data))
//         .catch(err => console.error("Failed to fetch contact", err));
//     }
//   }, []);

//   return (
//     <div className="p-6 text-white bg-[#0f172a] min-h-screen">
//       <h2 className="text-2xl font-bold mb-4">📞 IVR Click to Call</h2>
//       {contactInfo ? (
//         <div>
//           <p><strong>Name:</strong> {contactInfo.first_name} {contactInfo.last_name}</p>
//           <p><strong>Phone:</strong> {contactInfo.phone}</p>
//           <p><strong>Email:</strong> {contactInfo.email}</p>
//           {/* Add call logs, click-to-call, etc. here */}
//         </div>
//       ) : (
//         <p>Loading contact data...</p>
//       )}
//     </div>
//   );
// };

// export default IVRWidget;



import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

export default function IVRWidget() {
  const [params] = useSearchParams();
  const contactId = params.get('EntityId');
  const [contact, setContact] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!contactId) return;

    axios.get(`/api/contact/${contactId}`)
      .then((res) => setContact(res.data.data || res.data)) // fallback for different structures
      .catch((err) => {
        console.error('❌ Fetch failed', err);
        setError('Failed to load contact. Please try again.');
      });
  }, [contactId]);

  return (
    <div className="p-4 bg-[#111418] min-h-[400px] text-white rounded">
      <h2 className="text-2xl font-bold mb-4">📞 IVR Click to Call</h2>

      {error && <p className="text-red-400">{error}</p>}

      {!error && !contact ? (
        <p>Loading contact data...</p>
      ) : contact && (
        <div className="space-y-2">
          <p><strong>Name:</strong> {contact.name}</p>
          <p><strong>Phone:</strong> {contact.phoneNumber}</p>
          <p><strong>Email:</strong> {contact.email || 'N/A'}</p>
          <p><strong>Status:</strong> {contact.status || 'Active'}</p>

          {/* Actions */}
          <div className="mt-4 space-x-2">
            <button className="px-4 py-2 bg-green-600 rounded hover:bg-green-700">
              📞 Click to Call
            </button>
            <button className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700">
              📋 View Call Logs
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

