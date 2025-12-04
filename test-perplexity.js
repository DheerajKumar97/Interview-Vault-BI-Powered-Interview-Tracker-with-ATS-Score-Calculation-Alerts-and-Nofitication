import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Test Perplexity API with TEST_KEY
async function testPerplexityAPI() {
  console.log('🧪 Testing Perplexity API\n');
  console.log('='.repeat(50));

  const TEST_KEY = process.env.TEST_KEY;

  if (!TEST_KEY) {
    console.error('❌ TEST_KEY not found in .env file');
    process.exit(1);
  }

  const maskedKey = TEST_KEY.substring(0, 8) + '...' + TEST_KEY.substring(TEST_KEY.length - 4);
  console.log(`🔑 Using TEST_KEY: ${maskedKey}\n`);

  // Simple test prompt for interview questions
  const prompt = `Generate 3 interview questions for a Software Engineer position at Google.

Resume: 5 years of experience in JavaScript, React, Node.js, and AWS.

Job: Senior Software Engineer - Full Stack Development

Format:
- Q1-2: Conceptual (2 paragraph answers)
- Q3: Coding (code + brief explanation)

Output as:
Question 1: [question]
Answer: [answer]
...
Question 3: [question]
Answer: [answer]`;

  const startTime = Date.now();

  try {
    console.log('📤 Sending request to Perplexity API...\n');

    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model: 'sonar',
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: 0.7,
        max_tokens: 2048
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_KEY}`
        },
        timeout: 30000 // 30 seconds
      }
    );

    const executionTime = Date.now() - startTime;
    const questions = response.data.choices?.[0]?.message?.content;

    console.log('✅ SUCCESS! Perplexity API is working!\n');
    console.log('='.repeat(50));
    console.log(`⏱️  Execution time: ${executionTime}ms`);
    console.log(`📊 Model: ${response.data.model || 'sonar'}`);
    console.log(`📝 Response length: ${questions?.length || 0} characters\n`);
    console.log('='.repeat(50));
    console.log('📋 Generated Questions:\n');
    console.log(questions);
    console.log('\n' + '='.repeat(50));
    console.log('✅ Test completed successfully!');

  } catch (error) {
    const executionTime = Date.now() - startTime;

    console.error('\n❌ TEST FAILED!\n');
    console.error('='.repeat(50));
    console.error(`⏱️  Execution time: ${executionTime}ms`);

    if (error.response) {
      console.error(`📛 HTTP Status: ${error.response.status}`);
      console.error(`📛 Status Text: ${error.response.statusText}`);
      console.error('\n📄 Error Response:');
      console.error(JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('📛 No response received from server');
      console.error('📛 Error:', error.message);
    } else {
      console.error('📛 Error:', error.message);
    }

    console.error('\n' + '='.repeat(50));
    console.error('\n💡 Troubleshooting Tips:');
    console.error('1. Check if TEST_KEY is valid and not expired');
    console.error('2. Verify you have sufficient credits in your Perplexity account');
    console.error('3. Check if the API key has proper permissions');
    console.error('4. Try generating a new API key from https://www.perplexity.ai/settings/api');

    process.exit(1);
  }
}

// Run the test
testPerplexityAPI();
