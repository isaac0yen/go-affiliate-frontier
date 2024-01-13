const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: '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' });


const AI = async (prompt) => {

  const gptResponse = await openai.chat.completions.create({
    model: "gpt-3.5-turbo-1106",
    messages: [
      { "role": "system", "content": "You are a helpful assistant." },
      { "role": "user", "content": prompt }
    ],
    max_tokens: 2000
  });

  return gptResponse.choices[0].message.content;
}

module.exports = AI