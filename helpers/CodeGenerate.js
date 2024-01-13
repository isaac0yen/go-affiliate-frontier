const HTML = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';

  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters.charAt(randomIndex);
  }

  return code;
};

// Export the function for CommonJS
module.exports = HTML;

// Example usage:
// const HTML = require('./path-to-your-file');
// const generatedCode = HTML();
// console.log(generatedCode);
