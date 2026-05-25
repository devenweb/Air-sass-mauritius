const fs = require('fs');
const path = require('path');

const scaleDown = {
    '32': '16',
    '24': '12',
    '20': '10',
    '16': '8'
};

function processDirectory(dirPath) {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;
            
            const regex = /(["'\s`])([a-z0-9:-]+:)?(-?(?:py|px|pt|pb|pl|pr|my|mx|mt|mb|ml|mr|space-y|space-x|gap|p|m))-(32|24|20|16)(?=["'\s`])/g;
            
            content = content.replace(regex, (match, before, prefix, prop, val) => {
                const newVal = scaleDown[val];
                return `${before}${prefix || ''}${prop}-${newVal}`;
            });

            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

const appDir = path.join(__dirname, '..', 'app');
const compDir = path.join(__dirname, '..', 'components');
processDirectory(appDir);
processDirectory(compDir);
console.log('✅ Compaction script complete!');
