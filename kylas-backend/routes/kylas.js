import express from 'express';
import axios from 'axios';
const router = express.Router();

router.get('/contact/:id', async (req, res) => {
  const contactId = req.params.id;
  const accessToken = process.env.KYLAS_ACCESS_TOKEN;

  try {
    const response = await axios.get(`https://api.kylas.io/v1/contacts/${contactId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'api-key': process.env.KYLAS_API_KEY
      }
    });
    res.json(response.data);
  } catch (err) {
    console.error("Kylas contact fetch error", err.response?.data);
    res.status(500).json({ error: "Failed to fetch contact from Kylas" });
  }
});

export default router;
