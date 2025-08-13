let socket;

function initSocket() {
  socket = new WebSocket(`ws://${window.location.host}`);

  socket.addEventListener('open', () => {
    console.log('✅ Connected to WebSocket server');
  });

  socket.addEventListener('message', event => {
    try {
      const msg = JSON.parse(event.data);
      console.log('📩 Incoming WS message:', msg);
      appendMessage(msg.role, msg.text);
    } catch (err) {
      console.error('WebSocket parse error:', err, event.data);
    }
  });

  socket.addEventListener('close', () => {
    console.warn('⚠️ WebSocket disconnected, retrying in 3s...');
    setTimeout(initSocket, 3000);
  });
}

function saveMessage(role, text) {
  const messages = JSON.parse(localStorage.getItem('chatHistory') || '[]');
  messages.push({ role, text });
  localStorage.setItem('chatHistory', JSON.stringify(messages));
}

function loadMessages() {
  const messages = JSON.parse(localStorage.getItem('chatHistory') || '[]');
  const chatWindow = document.getElementById('chatWindow');
  chatWindow.innerHTML = '';
  messages.forEach(msg => appendMessage(msg.role, msg.text, false));
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function appendMessage(role, text, save = true) {
  const chatWindow = document.getElementById('chatWindow');
  const bubble = document.createElement('div');
  bubble.className = role === 'user' ? 'user-message' : 'cs-message';

  if (text.startsWith('data:image') || text.startsWith('http')) {
    bubble.innerText = role === 'cs' ? 'Here’s your image:' : text;
    chatWindow.appendChild(bubble);

    if (role === 'cs') {
      const img = document.createElement('img');
      img.src = text;
      img.style.maxWidth = '300px';
      img.style.marginTop = '10px';
      chatWindow.appendChild(img);
    }
  } else {
    bubble.innerText = text;
    chatWindow.appendChild(bubble);
  }

  if (save) saveMessage(role, text);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function clearChat() {
  localStorage.removeItem('chatHistory');
  document.getElementById('chatWindow').innerHTML = '';
}

function handleFeatureChange() {
  const feature = document.getElementById('featureSelector').value;
  document.getElementById('userInput').value = '';
  document.getElementById('imageUploadArea').style.display =
    ['vision', 'removebg', 'remini'].includes(feature) ? 'block' : 'none';
}

async function uploadImage() {
  const file = document.getElementById('imageInput').files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('image', file);

  try {
    const res = await fetch('/upload', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    document.getElementById('imagePreview').src = data.link;
    document.getElementById('userInput').value = data.link;
  } catch {
    alert('Image upload failed.');
  }
}

async function sendRequest() {
  const feature = document.getElementById('featureSelector').value;
  const input = document.getElementById('userInput').value.trim();

  if (!feature || !input) return;

  appendMessage('user', input);

  document.getElementById('userInput').value = '';
  document.getElementById('userInput').focus();

  try {
    let res, data, response;

    if (feature === 'chat') {
      res = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input })
      });
      data = await res.json();
      response = data.result || data.reply || 'No reply received.';
    } else if (['quote', 'motivation', 'advice'].includes(feature)) {
      res = await fetch(`/${feature}`);
      data = await res.json();
      response = data.result || data[feature] || `No ${feature} available.`;
    } else if (['vision', 'removebg', 'remini'].includes(feature)) {
      const payload = { imageUrl: input };
      if (feature === 'vision') payload.prompt = input;
      res = await fetch(`/${feature}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      data = await res.json();
      response = data.result || data.description || data.imageUrl || 'Image processing failed.';
    } else {
      res = await fetch(`/image/${feature}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input })
      });
      data = await res.json();
      response = data.result || data.image || data.imageUrl || data.error || 'Image generation failed.';
    }

    appendMessage('cs', response);
  } catch (err) {
    console.error('Request error:', err);
    appendMessage('cs', 'Something went wrong. Please try again.');
  }
}

// Rotating quote function
let quotes = [];
let quoteIndex = 0;

async function fetchQuotesList() {
  try {
    const res = await fetch('/quotes'); // should return an array of quotes
    quotes = await res.json();
    if (quotes.length > 0) rotateQuote();
  } catch (err) {
    console.error('Quote fetch error:', err);
  }
}

function rotateQuote() {
  if (quotes.length === 0) return;
  const quoteBox = document.getElementById('quoteBox');
  quoteBox.innerText = `“${quotes[quoteIndex]}”`;
  quoteIndex = (quoteIndex + 1) % quotes.length;
  setTimeout(rotateQuote, 5000); // change every 5 seconds
}

window.onload = () => {
  initSocket();
  fetchQuotesList();
  loadMessages();
};
