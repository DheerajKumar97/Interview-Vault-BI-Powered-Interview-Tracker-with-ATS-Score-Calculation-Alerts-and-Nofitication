// Test script to verify Netlify function locally
const testPayload = {
    resumeText: "Software Engineer with 5 years experience in JavaScript, React, Node.js",
    jobDescription: "Looking for a Senior Full Stack Developer with React and Node.js experience",
    companyName: "Test Company",
    jobTitle: "Senior Full Stack Developer"
};

// Simulate Netlify function call
const event = {
    httpMethod: 'POST',
    body: JSON.stringify(testPayload)
};

// Import and test the function
import('./netlify/functions/generate-interview-questions.js')
    .then(module => {
        console.log('✅ Function loaded successfully');
        console.log('🔑 Checking PERPLEXITY_API_KEY:', process.env.PERPLEXITY_API_KEY ? 'SET' : 'NOT SET');

        return module.handler(event, {});
    })
    .then(response => {
        console.log('\n✅ Function Response:');
        console.log('Status Code:', response.statusCode);
        console.log('Body:', response.body);
    })
    .catch(error => {
        console.error('\n❌ Error testing function:');
        console.error(error.message);
        console.error(error.stack);
    });
