// Test the actual server endpoint
import https from 'https';
import http from 'http';

const testPayload = {
    resumeText: "Software Engineer with 5 years experience in JavaScript, React, Node.js. Built scalable web applications.",
    jobDescription: "Looking for a Senior Full Stack Developer with React and Node.js experience. Must have experience with REST APIs.",
    companyName: "Test Company",
    jobTitle: "Senior Full Stack Developer"
};

const postData = JSON.stringify(testPayload);

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/generate-interview-questions',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

console.log('🧪 Testing server endpoint: http://localhost:3001/api/generate-interview-questions\n');

const req = http.request(options, (res) => {
    console.log(`✅ Response Status: ${res.statusCode}\n`);

    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const response = JSON.parse(data);
            console.log('📦 Response Body:');
            if (response.success) {
                console.log('✅ SUCCESS!');
                console.log('Provider:', response.provider);
                console.log('Model:', response.model);
                console.log('Execution Time:', response.executionTime + 'ms');
                console.log('\n📝 Generated Questions Preview:');
                console.log(response.questions.substring(0, 500) + '...\n');
            } else {
                console.log('❌ ERROR:', response.error);
                console.log('Message:', response.message);
                console.log('Hint:', response.hint);
            }
        } catch (e) {
            console.log('Raw response:', data);
        }
    });
});

req.on('error', (e) => {
    console.error('❌ Request failed:', e.message);
    console.log('\n💡 Make sure the server is running: npm run server');
});

req.write(postData);
req.end();
