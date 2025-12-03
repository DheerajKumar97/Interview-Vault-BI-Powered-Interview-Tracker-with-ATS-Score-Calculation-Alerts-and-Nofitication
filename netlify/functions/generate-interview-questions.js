// Main handler
export const handler = async (event, context) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { resumeText, jobDescription, companyName, jobTitle, apiKey } = JSON.parse(event.body || '{}');

        if (!resumeText || !jobDescription) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Resume text and job description are required' })
            };
        }

        console.log('🤖 Generating interview questions for:', companyName, '-', jobTitle);

        // Parse GEMINI_API_KEY from env - it can be a JSON array or a single string
        let apiKeys = [];

        if (apiKey) {
            // If user provided a custom key, use it first
            apiKeys = [apiKey];
        } else if (process.env.GEMINI_API_KEY) {
            try {
                // Try to parse as JSON array first
                const parsed = JSON.parse(process.env.GEMINI_API_KEY);
                if (Array.isArray(parsed)) {
                    apiKeys = parsed;
                } else {
                    apiKeys = [process.env.GEMINI_API_KEY];
                }
            } catch (e) {
                // If not JSON, treat as single key
                apiKeys = [process.env.GEMINI_API_KEY];
            }
        }

        if (apiKeys.length === 0) {
            console.error('❌ No GEMINI_API_KEY found');
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({
                    error: 'Gemini API key not configured',
                    requiresKey: true
                })
            };
        }

        console.log(`📋 Found ${apiKeys.length} API key(s) to try`);

        const prompt = `You are an expert technical interviewer. Based on the candidate's resume and the job description below, generate 8-10 highly relevant interview questions with detailed answers.

**Candidate's Resume:**
${resumeText}

**Job Description for ${jobTitle} at ${companyName}:**
${jobDescription}

QUESTION DISTRIBUTION REQUIREMENTS:
- 80% of questions MUST be practical/technical questions directly related to the job description and resume
- 20% can be behavioral or conceptual questions
- Focus heavily on hands-on skills, coding challenges, and real-world scenarios

QUESTION TYPES BASED ON TECHNOLOGIES:
- If SQL is mentioned: Ask to write SQL queries (SELECT, JOIN, subqueries, optimization, etc.)
- If Python is mentioned: Ask to write Python code (functions, data structures, algorithms, libraries, etc.)
- If Node.js is mentioned: Ask to write Node.js code (async/await, Express, APIs, etc.)
- If Java is mentioned: Ask to write Java code (OOP, collections, streams, etc.)
- If any framework/library is mentioned: Ask practical implementation questions with code
- If business domain is mentioned: Ask domain-specific scenario-based questions
- For data roles: Ask about data manipulation, analysis, visualization with code examples
- For cloud/DevOps: Ask about infrastructure, deployment, CI/CD with practical scenarios

For each question, use EXACTLY this format:

1. [Question text here - make it practical and specific]
Answer: [First paragraph with 4 lines explaining the concept, approach, and key considerations]

[Second paragraph with 4 lines providing concrete examples, code snippets if applicable, and real-world application]

2. [Question text here - make it practical and specific]
Answer: [First paragraph with 4 lines explaining the concept, approach, and key considerations]

[Second paragraph with 4 lines providing concrete examples, code snippets if applicable, and real-world application]

CRITICAL REQUIREMENTS FOR ANSWERS:
- Each answer MUST be EXACTLY 8 lines long (MANDATORY)
- Split into TWO paragraphs of 4 lines each with a blank line between them
- First paragraph: Explain the concept, approach, methodology, and key considerations
- Second paragraph: Provide concrete examples, code snippets (if technical), metrics, and real-world applications
- For coding questions: Include actual code syntax in the second paragraph
- For SQL questions: Show actual SQL query examples
- For Python questions: Show actual Python code examples
- For any technical question: Include working code examples in the appropriate language
- For behavioral questions: Use STAR method (Situation, Task, Action, Result) with specific metrics
- Make answers comprehensive, detailed, and immediately actionable

FORMAT RULES:
- Start each question with just the number and question text
- Follow immediately with "Answer:" on the next line
- Each answer must have exactly 8 lines split into 2 paragraphs (4 lines + blank line + 4 lines)
- Do NOT use asterisks, markdown formatting, or bullet points in answers
- Write in clear, flowing prose
- Focus on questions that would genuinely help the candidate prepare for this specific role`;

        const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent';

        // Try each API key in order until one works
        let lastError = null;
        let questions = null;

        for (let i = 0; i < apiKeys.length; i++) {
            const currentKey = apiKeys[i].trim();
            console.log(`🔑 Trying API key ${i + 1}/${apiKeys.length}...`);

            try {
                const response = await fetch(`${API_URL}?key=${currentKey}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: prompt
                            }]
                        }],
                        generationConfig: {
                            temperature: 0.7,
                            topK: 40,
                            topP: 0.95,
                            maxOutputTokens: 3072,
                        }
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error?.message || `HTTP ${response.status}`);
                }

                const data = await response.json();
                questions = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No questions generated';
                console.log(`✅ Success with API key ${i + 1}/${apiKeys.length}`);
                break; // Success! Exit the loop
            } catch (error) {
                lastError = error;
                const errorMsg = error.message;

                console.log(`❌ API key ${i + 1}/${apiKeys.length} failed: ${errorMsg}`);

                // If this is the last key, we'll handle the error below
                if (i === apiKeys.length - 1) {
                    console.error('❌ All API keys exhausted');
                } else {
                    console.log(`⏭️  Trying next API key...`);
                }
            }
        }

        // If we got questions, return them
        if (questions) {
            console.log('✅ Interview questions generated successfully');
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    questions: questions
                })
            };
        }

        // All keys failed - return error and ask for custom key
        console.error(`❌ All API keys failed. Last error:`, lastError?.message);

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'All API keys exhausted. Please provide your own API key.',
                message: lastError?.message || 'Failed to generate interview questions',
                requiresKey: true // Tell frontend to ask for custom key
            })
        };

    } catch (error) {
        console.error('❌ Unexpected error in generate-interview-questions:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message,
                requiresKey: false
            })
        };
    }
};
