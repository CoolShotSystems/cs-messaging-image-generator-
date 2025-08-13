async function fetchQuote() {
  try {
    const res = await fetch('/quote');
    const data = await res.json();
    document.getElementById('quoteBox').innerText = `“${data.quote || 'No quote available.'}”`;
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
  messages.forEach(msg => {
    const bubble = document.createElement('div');
    bubble.className = msg.role === 'user' ? 'user-message' : 'cs-message';
    bubble.innerText = msg.text;
    chatWindow.appendChild(bubble);
  });
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
  const input = document.getElementById('userInput').value;
  const chatWindow = document.getElementById('chatWindow');

  if (!feature || !input) return;

  const userBubble = document.createElement('div');
  userBubble.className = 'user-message';
  userBubble.innerText = input;
  chatWindow.appendChild(userBubble);
  saveMessage('user', input);

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
      response = data.reply || 'No reply received.';
    } else if (['quote', 'motivation', 'advice'].includes(feature)) {
      res = await fetch(`/${feature}`);
      data = await res.json();
      response = data[feature] || `No ${feature} available.`;
    } else if (['vision', 'removebg', 'remini'].includes(feature)) {
      const payload = { imageUrl: input };
      if (feature === 'vision') payload.prompt = input;
      res = await fetch(`/${feature}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      data = await res.json();
      response = data.description || data.imageUrl || 'Image processing failed.';
    } else {
      res = await fetch(`/image/${feature}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input })
      });
      data = await res.json();
      response = data.imageUrl ? `Image generated: ${data.imageUrl}` : 'Image generation failed.';
    }

    console.log('API response:', data);
  } catch (err) {
    console.error('Error:', err);
    response = 'Something went wrong. Please try again.';
  }

  const csBubble = document.createElement('div');
  csBubble.className = 'cs-message';
  csBubble.innerText = response;
  chatWindow.appendChild(csBubble);
  saveMessage('cs', response);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

window.onload = () => {
  fetchQuote();
  loadMessages();
};
