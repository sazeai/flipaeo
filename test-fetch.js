const fetch = require('node-fetch');

async function run() {
  try {
    const res = await fetch('http://localhost:3000/api/generate-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: '42868219-1f23-4834-9c13-09e987e069dd',
        is_mood_board: true
      })
    });
    
    console.log('Status:', res.status);
    console.log('Headers:', res.headers.raw());
    const text = await res.text();
    console.log('Response Body:', text);
  } catch (err) {
    console.error('Fetch Error:', err);
  }
}

run();
