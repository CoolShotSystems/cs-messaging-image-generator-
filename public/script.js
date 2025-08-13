async function fetchQuote() {
  try {
    const res = await fetch('/quote');
    const data = await res.json();
    console.log('Quote response:', data);
    document.getElementById('quoteBox').innerText =
      `“${data.result || data.quote || 'Stay inspired. Create boldly.'}”`;
  } catch {
    document.getElementById('quoteBox').innerText = '“Unable to load quote.”';
  }
}

function saveMessage(role, text) {
  const messages = JSON.parse(localStorage.getItem('chatHistory') || '[]');
  messages.push({ role, text });
  localStorage.setItem('chatHistory', JSON.stringify(messages));
}

function loadMessages() {
  const messages = JSON.parse(localStorage.getItem('chatHistory') || '[]');
  const chatWindow = document.getElementById('chatWindow');
  chatWindow.innerHTML = ''; // clear before reloading
  messages.forEach(msg => appendMessage(msg.role, msg.text, false));
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function clearChat() {
  localStorage.removeItem('chatHistory');
  document.getElementById('chatWindow').innerHTML = '';
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

  let response = 'Processing...';

  try {
    let res, data;

    if (feature === 'chat') {
      res = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input })
      });
      data = await res.json();
      console.log('Chat response:', data);
      response = data.result || data.reply || 'No reply received.';
    } else if (['quote', 'motivation', 'advice'].includes(feature)) {
      res = await fetch(`/${feature}`);
      data = await res.json();
      console.log(`${feature} response:`, data);
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
      console.log(`${feature} response:`, data);
      response = data.result || data.description || data.imageUrl || 'Image processing failed.';
    } else {
      res = await fetch(`/image/${feature}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input })
      });
      data = await res.json();
      console.log('Image generation response:', data);
      response = data.result || data.image || data.imageUrl || data.error || 'Image generation failed.';
    }
  } catch (err) {
    console.error('Request error:', err);
    response = 'Something went wrong. Please try again.';
  }

  appendMessage('cs', response);
}

// Poll for new messages from server
async function pollMessages() {
  try {
    const res = await fetch('/messages'); // Backend should return latest messages
    const serverMessages = await res.json();
    const storedMessages = JSON.parse(localStorage.getItem('chatHistory') || '[]');

    // Find messages not in local storage
    const newMessages = serverMessages.filter(sm =>
      !storedMessages.some(st => st.role === sm.role && st.text === sm.text)
    );

    newMessages.forEach(msg => appendMessage(msg.role, msg.text));
  } catch (err) {
    console.error('Polling error:', err);
  }
}

window.onload = () => {
  fetchQuote();
  loadMessages();
  setInterval(pollMessages, 3000); // check every 3 seconds
};
