// replacer.js

function Replacer(inputString, replacementObject) {
  const regex = /\[(\w+)]/g;

  const replacedString = inputString.replace(regex, (match, key) => {
    return replacementObject.hasOwnProperty(key) ? replacementObject[key] : match;
  });

  return replacedString;
}

module.exports = Replacer;
