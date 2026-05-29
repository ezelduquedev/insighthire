import OpenAI from 'openai';

if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// Detectamos si estamos usando Groq
const isGroq = !!process.env.GROQ_API_KEY;

const apiKey = (isGroq ? process.env.GROQ_API_KEY : process.env.OPENAI_API_KEY) || 'dummy-api-key-for-build';

// Configuramos el cliente único basado en la disponibilidad de la API Key
export const client = new OpenAI({
  apiKey,
  baseURL: isGroq ? 'https://api.groq.com/openai/v1' : 'https://api.openai.com/v1',
});

// Definimos los modelos dinámicamente
export const MODEL = isGroq 
  ? 'llama-3.3-70b-versatile' 
  : 'gpt-4o-mini';

export const EMBEDDING_MODEL = 'text-embedding-3-small';

// Exportaciones unificadas para mantener compatibilidad total:
// 1. Exportamos como openaiClient (para mantener consistencia)
// 2. Exportamos como groqClient (para evitar romper tus imports actuales)
export { client as openaiClient };
export { client as groqClient };