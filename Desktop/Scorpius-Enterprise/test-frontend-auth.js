const testAuth = async () => {
  console.log('🔐 Testing frontend-backend authentication...');
  
  try {
    // Test the exact endpoint the frontend uses
    const loginUrl = 'http://localhost:3001/api/auth/login';
    const loginData = {
      email: 'admin@scorpiusx.io',
      password: 'scorpius123'
    };

    console.log('📡 Sending login request to:', loginUrl);
    console.log('📝 Login data:', loginData);

    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData)
    });

    console.log('📊 Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Login successful!');
      console.log('🎟️ Token received:', data.token ? data.token.substring(0, 20) + '...' : 'No token');
      console.log('👤 User data:', data.user ? data.user.name : 'No user data');
      
      // Test token storage (simulating frontend behavior)
      if (data.token) {
        localStorage.setItem('scorpius_auth_token', data.token);
        console.log('💾 Token stored in localStorage');
        
        // Test token parsing (like frontend does)
        if (data.token.includes('.')) {
          console.log('🔍 Token appears to be JWT format');
        } else {
          console.log('🔍 Token appears to be simple format');
        }
      }
    } else {
      const errorData = await response.text();
      console.error('❌ Login failed:', response.status, errorData);
    }
  } catch (error) {
    console.error('💥 Error during authentication test:', error);
  }
};

// Run the test
testAuth();
