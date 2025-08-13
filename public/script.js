async function fetchQuote() {
  try {
    const res = await fetch('/quote');
    const data = await res.json();
    document.getElementById('quoteBox').innerText = `“${data.quote}”`;
  } catch {
    document.getElementById('quoteBox').innerText = '“Unable to load quote.”';
  }
}

setInterval(fetchQuote, 60000);
fetchQuote();

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

  const res = await fetch('/upload', {
    method: 'POST',
    body: formData
  });

  const data = await res.json();
  document.getElementById('imagePreview').src = data.link;
  document.getElementById('userInput').value = data.link;
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

  let response;

  try {
    if (feature === 'chat') {
      const res = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input })
      });
      const data = await res.json();
      response = data.reply;
    } else if (['quote', 'motivation', 'advice'].includes(feature)) {
      const res = await fetch(`/${feature}`);
      const data = await res.json();
      response = data[feature];
    } else if (['vision', 'removebg', 'remini'].includes(feature)) {
      const payload = { imageUrl: input };
      if (feature === 'vision') payload.prompt = input;
      const res = await fetch(`/${feature}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      response = data.description || data.imageUrl || 'Image processing failed.';
    } else {
      const res = await fetch(`/image/${feature}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input })
      });
      const data = await res.json();
      response = data.imageUrl ? `Image generated: ${data.imageUrl}` : 'Image generation failed.';
    }
  } catch {
    response = 'Something went wrong. Please try again.';
  }

  const csBubble = document.createElement('div');
  csBubble.className = 'cs-message';
  csBubble.innerText = response;
  chatWindow.appendChild(csBubble);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}
