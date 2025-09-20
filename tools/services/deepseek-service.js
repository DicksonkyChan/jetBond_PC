const fetch = require('node-fetch');

class DeepSeekService {
  constructor(apiKey) {
    this.apiKey = apiKey || process.env.DEEPSEEK_API_KEY;
    this.baseUrl = 'https://api.deepseek.com/v1';
  }

  async generateEmbedding(text) {
    if (!this.apiKey || this.apiKey === 'your_deepseek_api_key_here') {
      // Fallback to simple text matching
      return this.simpleTextEmbedding(text);
    }

    try {
      const response = await fetch(`${this.baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'text-embedding-ada-002',
          input: text
        })
      });

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      console.error('DeepSeek API error:', error);
      return this.simpleTextEmbedding(text);
    }
  }

  simpleTextEmbedding(text) {
    // Simple keyword-based matching as fallback
    const keywords = text.toLowerCase().split(/\s+/);
    const embedding = new Array(100).fill(0);
    
    keywords.forEach((word, index) => {
      const hash = this.simpleHash(word) % 100;
      embedding[hash] += 1;
    });
    
    return embedding;
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  calculateSimilarity(embedding1, embedding2) {
    // Cosine similarity
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }
}

module.exports = DeepSeekService;