require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const multer = require('multer');
const cors = require('cors');

const app = express();
const upload = multer();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
const PRINCE_KEY = process.env.PRINCE_API_KEY;
const GIFTED_KEY = process.env.GIFTED_API_KEY;
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID;

// 🔐 Check for missing keys
if (!GIFTED_KEY) console.warn('⚠️ GIFTED_API_KEY is missing.');
if (!PRINCE_KEY) console.warn('⚠️ PRINCE_API_KEY is missing.');
if (!IMGUR_CLIENT_ID) console.warn('⚠️ IMGUR_CLIENT_ID is missing. Image upload will fail.');

// 🖼️ Upload to Imgur
app.post('/upload', upload.single('image'), async (req, res) => {
  if (!IMGUR_CLIENT_ID) {
    return res.status(500).json({ error: 'Imgur client ID not configured.' });
  }

  try {
    const response = await axios.post('https://api.imgur.com/3/image', req.file.buffer, {
      headers: {
        Authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
        'Content-Type': 'application/octet-stream'
      }
    });
    res.json({ link: response.data.data.link });
  } catch (err) {
    console.error('Imgur upload error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Image upload failed.' });
  }
});

// 💬 Chat
app.post('/chat', async (req, res) => {
  const { prompt } = req.body;
  console.log('📨 Chat prompt:', prompt);

  try {
    const response = await axios.get('https://api.giftedtech.co.ke/api/ai/gpt', {
      params: { apikey: GIFTED_KEY, q: prompt }
    });
    console.log('✅ Chat response:', response.data);
    res.json({ reply: response.data.reply || 'No reply received.' });
  } catch (err) {
    console.error('❌ Chat error:', err.response?.data || err.message);
    res.json({ reply: 'Chat service unavailable.' });
  }
});

// 📜 Quote
app.get('/quote', async (req, res) => {
  try {
    const response = await axios.get('https://api.giftedtech.co.ke/api/fun/quotes', {
      params: { apikey: GIFTED_KEY }
    });
    console.log('✅ Quote response:', response.data);
    res.json({ quote: response.data.quote || 'No quote available.' });
  } catch (err) {
    console.error('❌ Quote error:', err.response?.data || err.message);
    res.json({ quote: 'Quote service unavailable.' });
  }
});

// 🔥 Motivation
app.get('/motivation', async (req, res) => {
  try {
    const response = await axios.get('https://api.princetechn.com/api/fun/motivation', {
      params: { apikey: PRINCE_KEY }
    });
    console.log('✅ Motivation response:', response.data);
    res.json({ motivation: response.data.motivation || 'No motivation available.' });
  } catch (err) {
    console.error('❌ Motivation error:', err.response?.data || err.message);
    res.json({ motivation: 'Motivation service unavailable.' });
  }
});

// 🧠 Advice
app.get('/advice', async (req, res) => {
  try {
    const response = await axios.get('https://api.giftedtech.co.ke/api/fun/advice', {
      params: { apikey: GIFTED_KEY }
    });
    console.log('✅ Advice response:', response.data);
    res.json({ advice: response.data.advice || 'No advice available.' });
  } catch (err) {
    console.error('❌ Advice error:', err.response?.data || err.message);
    res.json({ advice: 'Advice service unavailable.' });
  }
});

// 🎨 Image Generation
app.post('/image/:style', async (req, res) => {
  const { prompt } = req.body;
  const style = req.params.style;
  console.log(`🎨 Image prompt: "${prompt}" | Style: "${style}"`);

  const endpoints = {
    text2img: `https://api.giftedtech.co.ke/api/ai/text2img`,
    fluximg: `https://api.giftedtech.co.ke/api/ai/fluximg`,
    sd: `https://api.giftedtech.co.ke/api/ai/sd`,
    ghibli: `https://api.giftedtech.co.ke/api/ai/text2ghibli`,
    deepimg: `https://api.giftedtech.co.ke/api/ai/deepimg`
  };

  const url = endpoints[style];
  if (!url) return res.status(400).json({ error: 'Invalid style' });

  try {
    const response = await axios.get(url, {
      params: { apikey: GIFTED_KEY, prompt }
    });
    console.log('✅ Image response:', response.data);
    res.json({ imageUrl: response.data.image || response.data.imageUrl || 'Image not returned.' });
  } catch (err) {
    console.error('❌ Image error:', err.response?.data || err.message);
    res.json({ imageUrl: null, error: 'Image generation failed.' });
  }
});

// 🖼️ Vision-to-Text
app.post('/vision', async (req, res) => {
  const { imageUrl, prompt } = req.body;
  console.log('🧠 Vision request:', imageUrl, prompt);

  try {
    const response = await axios.get('https://api.giftedtech.co.ke/api/ai/vision', {
      params: { apikey: GIFTED_KEY, url: imageUrl, prompt }
    });
    console.log('✅ Vision response:', response.data);
    res.json({ description: response.data.description || 'No description returned.' });
  } catch (err) {
    console.error('❌ Vision error:', err.response?.data || err.message);
    res.json({ description: 'Unable to describe image.' });
  }
});

// 🧹 Remove Background
app.post('/removebg', async (req, res) => {
  const { imageUrl } = req.body;
  console.log('🧹 RemoveBG request:', imageUrl);

  try {
    const response = await axios.get('https://api.giftedtech.co.ke/api/tools/removebg', {
      params: { apikey: GIFTED_KEY, url: imageUrl }
    });
    console.log('✅ RemoveBG response:', response.data);
    res.json({ imageUrl: response.data.image || 'No image returned.' });
  } catch (err) {
    console.error('❌ RemoveBG error:', err.response?.data || err.message);
    res.json({ imageUrl: null, error: 'Background removal failed.' });
  }
});

// ✨ Remini Enhancement
app.post('/remini', async (req, res) => {
  const { imageUrl } = req.body;
  console.log('✨ Remini request:', imageUrl);

  try {
    const response = await axios.get('https://api.giftedtech.co.ke/api/tools/remini', {
      params: { apikey: GIFTED_KEY, url: imageUrl }
    });
    console.log('✅ Remini response:', response.data);
    res.json({ imageUrl: response.data.image || 'No image returned.' });
  } catch (err) {
    console.error('❌ Remini error:', err.response?.data || err.message);
    res.json({ imageUrl: null, error: 'Image enhancement failed.' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
