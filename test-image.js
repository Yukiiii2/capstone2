// Test file to verify image path
console.log('Testing image path...');
try {
  const image = require('./assets/Speaksy.png');
  console.log('Image found at:', require.resolve('./assets/Speaksy.png'));
} catch (error) {
  console.error('Error loading image:', error.message);
  console.log('Current working directory:', process.cwd());
  console.log('Trying to list assets directory...');
  const fs = require('fs');
  try {
    console.log('Assets directory contents:', fs.readdirSync('./assets'));
  } catch (e) {
    console.error('Error reading assets directory:', e.message);
  }
}
