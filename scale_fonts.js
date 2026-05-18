const fs = require('fs');

const file = './frontend/src/components/ResumeTemplates.jsx';
let content = fs.readFileSync(file, 'utf8');

// Replace all occurrences of fontSize: 'Xpx'
content = content.replace(/fontSize:\s*'([\d.]+)px'/g, (match, p1) => {
    let size = parseFloat(p1);
    size = Math.round(size * 1.3); // Scale up by 30%
    return `fontSize: '${size}px'`;
});

// Also replace h1 sizes
content = content.replace(/fontSize:\s*'28px'/g, "fontSize: '34px'");
content = content.replace(/fontSize:\s*'26px'/g, "fontSize: '32px'");

fs.writeFileSync(file, content);
console.log('Font sizes scaled up in ResumeTemplates.jsx');
