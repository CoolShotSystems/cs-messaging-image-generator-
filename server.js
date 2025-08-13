require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const multer = require('multer');
const upload = multer();

const app = express();
app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
const PRINCE_KEY = process.env.PRINCE_API_KEY;
const GIFTED_KEY = process.env.GIFTED_API_KEY;
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID;

// 🔼 Upload to Imgur
app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const response = await axios.post('https://api.imgur.com/3/image', req.file.buffer, {
      headers: {
        Authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
        'Content-Type': 'application/octet-stream'
      }
    });
    res.json({ link: response.data.data.link });
  } catch {
    res.status(500).json({ error: 'Image upload failed.' });
  }
});

// 💬 Chat
app.post('/chat', async (req, res) => {
  const { prompt } = req.body;
  try {
    const response = await axios.get(`https://api.giftedtech.co.ke/api/ai/gpt?apikey=${GIFTED_KEY}&q=${encodeURIComponent(prompt)}`);
    res.json({ reply: response.data.reply });
  } catch {
    try {
      const response = await axios.get(`https://api.princetechn.com/api/ai/openai?apikey=${PRINCE_KEY}&q=${encodeURIComponent(prompt)}`);
      res.json({ reply: response.data.reply });
    } catch {
      res.json({ reply: 'Sorry, all chat services are currently unavailable.' });
    }
  }
});

// 🎨 Image Generation
app.post('/image/:style', async (req, res) => {
  const { prompt } = req.body;
  const style = req.params.style;

  const endpoints = {
    text2img: {
      gifted: `https://api.giftedtech.co.ke/api/ai/text2img`,
      prince: `https://api.princetechn.com/api/ai/text2img`
    },
    fluximg: {
      gifted: `https://api.giftedtech.co.ke/api/ai/fluximg`,
      prince: `https://api.princetechn.com/api/ai/fluximg`
    },
    sd: {
      gifted: `https://api.giftedtech.co.ke/api/ai/sd`,
      prince: `https://api.princetechn.com/api/ai/sd`
    },
    ghibli: {
      gifted: `https://api.giftedtech.co.ke/api/ai/text2ghibli`
    },
    deepimg: {
      gifted: `https://api.giftedtech.co.ke/api/ai/deepimg`
    }
  };

  const urls = endpoints[style];
  if (!urls) return res.status(400).json({ error: 'Invalid style' });

  try {
    const response = await axios.get(`${urls.gifted}?apikey=${GIFTED_KEY}&prompt=${encodeURIComponent(prompt)}`);
    res.json({ imageUrl: response.data.image });
  } catch {
    if (urls.prince) {
      try {
        const response = await axios.get(`${urls.prince}?apikey=${PRINCE_KEY}&prompt=${encodeURIComponent(prompt)}`);
        res.json({ imageUrl: response.data.image });
      } catch {
        res.json({ imageUrl: null, error: 'Image generation failed.' });
      }
    } else {
      res.json({ imageUrl: null, error: 'Image generation failed.' });
    }
  }
});

// 🖼️ Vision-to-Text
app.post('/vision', async (req, res) => {
  const { imageUrl, prompt } = req.body;
  try {
    const response = await axios.get(`https://api.giftedtech.co.ke/api/ai/vision?apikey=${GIFTED_KEY}&url=${encodeURIComponent(imageUrl)}&prompt=${encodeURIComponent(prompt)}`);
    res.json({ description: response.data.description });
  } catch {
    try {
      const response = await axios.get(`https://api.princetechn.com/api/ai/vision?apikey=${PRINCE_KEY}&url=${encodeURIComponent(imageUrl)}&prompt=${encodeURIComponent(prompt)}`);
      res.json({ description: response.data.description });
    } catch {
      res.json({ description: 'Unable to describe image.' });
    }
  }
});

// 🧹 Remove Background
app.post('/removebg', async (req, res) => {
  const { imageUrl } = req.body;
  try {
    const response = await axios.get(`https://api.giftedtech.co.ke/api/tools/removebg?apikey=${GIFTED_KEY}&url=${encodeURIComponent(imageUrl)}`);
    res.json({ imageUrl: response.data.image });
  } catch {
    res.json({ imageUrl: null, error: 'Background removal failed.' });
  }
});

// ✨ Remini Enhancement
app.post('/remini', async (req, res) => {
  const { imageUrl } = req.body;
  try {
    const response = await axios.get(`https://api.giftedtech.co.ke/api/tools/remini?apikey=${GIFTED_KEY}&url=${encodeURIComponent(imageUrl)}`);
    res.json({ imageUrl: response.data.image });
  } catch {
    res.json({ imageUrl: null, error: 'Image enhancement failed.' });
  }
});

// 📜 Quotes, Motivation, Advice
app.get('/quote', async (req, res) => {
  try {
    const response = await axios.get(`https://api.giftedtech.co.ke/api/fun/quotes?apikey=${GIFTED_KEY}`);
    res.json({ quote: response.data.quote });
  } catch {
    try {
      const response = await axios.get(`https://api.princetechn.com/api/fun/quotes?apikey=${PRINCE_KEY}`);
      res.json({ quote: response.data.quote });
    } catch {
      res.json({ quote: 'No quote available.' });
    }
  }
});

app.get('/motivation', async (req, res) => {
  try {
    const response = await axios.get(`https://api.princetechn.com/api/fun/motivation?apikey=${PRINCE_KEY}`);
    res.json({ motivation: response.data.motivation });
  } catch {
    res.json({ motivation: 'No motivation available.' });
  }
});

app.get('/advice', async (req, res) => {
  try {
    const response = await axios.get(`https://api.giftedtech.co.ke/api/fun/advice?apikey=${GIFTED_KEY}`);
    res.json({ advice: response.data.advice });
  } catch {
    res.json({ advice: 'No advice available.' });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
