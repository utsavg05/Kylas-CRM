import express from 'express';
const router = express.Router();

// This route receives data from Kylas workflow (contact creation or update)
router.post('/contact-sync', async (req, res) => {
  const contact = req.body;

  console.log('📥 Contact received from Kylas Workflow:', contact);

  // Optional: Save to DB if needed for faster access in iframe
  // await ContactModel.create(contact);

  res.status(200).send("Contact received");
});

export default router;
