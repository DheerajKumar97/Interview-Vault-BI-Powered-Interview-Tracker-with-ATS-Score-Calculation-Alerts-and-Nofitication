

async function testEndpoint() {
    try {
        console.log('Testing OTP Endpoint...');
        const response = await fetch('http://localhost:3001/api/send-otp-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'interviewvault.2026@gmail.com', // sending to self
                otp: '123456'
            })
        });

        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', data);
    } catch (error) {
        console.error('❌ Request Failed:', error.message);
    }
}

testEndpoint();
