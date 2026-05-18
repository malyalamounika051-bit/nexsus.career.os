const fs = require('fs');

const file = './frontend/src/components/ResumeTemplates.jsx';
let content = fs.readFileSync(file, 'utf8');

// Replace all occurrences of fontSize: 'Xpx'
content = content.replace(/fontSize:\s*'([\d.]+)px'/g, (match, p1) => {
    let size = parseFloat(p1);
    size = Math.round(size * 1.25); // Scale up by another 25%
    return `fontSize: '${size}px'`;
});

fs.writeFileSync(file, content);
console.log('Font sizes scaled up again in ResumeTemplates.jsx');
