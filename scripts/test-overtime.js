const fetch = require('node-fetch');

async function testOvertime() {
  const baseUrl = 'http://localhost:3000/api';

  try {
    // Login first
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    });

    const loginData = await loginRes.json();
    console.log('Login response:', loginData);

    if (!loginData.success || !loginData.data?.access_token) {
      console.log('Login failed or no token');
      return;
    }

    const token = loginData.data.access_token;

    // Test overtime endpoint
    const overtimeRes = await fetch(`${baseUrl}/overtime`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const overtimeData = await overtimeRes.json();
    console.log('Overtime response:', overtimeData);
  } catch (error) {
    console.error('Test error:', error);
  }
}

testOvertime();
