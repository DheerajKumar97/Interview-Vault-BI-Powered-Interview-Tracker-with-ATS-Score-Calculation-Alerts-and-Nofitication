const fs = require('fs');
const path = require('path');

// Read the file
const filePath = path.join(__dirname, 'server.js');
let content = fs.readFileSync(filePath, 'utf8');

// Remove the line with "const path = require('path');" inside the production block
content = content.replace(/\/\/ ============================================\r?\n\/\/ PRODUCTION: Serve React Build\r?\n\/\/ ============================================\r?\nif \(process\.env\.NODE_ENV === 'production'\) \{\r?\n  const path = require\('path'\);\r?\n/g,
    `// ============================================
// PRODUCTION: Serve React Build
// ============================================
if (process.env.NODE_ENV === 'production') {
`);

// Write back
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Fixed server.js - removed require(path)');
