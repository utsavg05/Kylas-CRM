import React, { useEffect, useState } from 'react';
import axios from 'axios';

const IVRWidget = () => {
  const [contactId, setContactId] = useState(null);
  const [contactInfo, setContactInfo] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("contactId");
    setContactId(id);

    if (id) {
      axios.get(`https://kylas-crm.onrender.com/api/kylas/contact/${id}`)
        .then(res => setContactInfo(res.data))
        .catch(err => console.error("Failed to fetch contact", err));
    }
  }, []);

  return (
    <div className="p-6 text-white bg-[#0f172a] min-h-screen">
      <h2 className="text-2xl font-bold mb-4">📞 IVR Click to Call</h2>
      {contactInfo ? (
        <div>
          <p><strong>Name:</strong> {contactInfo.first_name} {contactInfo.last_name}</p>
          <p><strong>Phone:</strong> {contactInfo.phone}</p>
          <p><strong>Email:</strong> {contactInfo.email}</p>
          {/* Add call logs, click-to-call, etc. here */}
        </div>
      ) : (
        <p>Loading contact data...</p>
      )}
    </div>
  );
};

export default IVRWidget;
