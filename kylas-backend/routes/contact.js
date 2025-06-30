import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

router.get('/:id', async (req, res) => {
  const contactId = req.params.id;

  try {
    const response = await axios.get(
      `https://api.kylas.io/crm/v1/contacts/${contactId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.KYLAS_ACCESS_TOKEN}`, // store in .env
        }
      }
    );

    res.json(response.data.data);
  } catch (error) {
    console.error('Error fetching contact:', error?.response?.data || error.message);
    res.status(500).json({ message: 'Failed to fetch contact details' });
  }
});

export default router;
