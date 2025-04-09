/**
 * LLM provider configuration for PushScript
 * Configures multiple AI providers for commit message generation
 */

import fetch from 'node-fetch';

// Define types for provider configuration
export interface LLMProviderConfig {
  apiEndpoint: string;
  defaultModel?: string;
  headerTemplate: (apiKey: string) => Record<string, string>;
  responseHandler: (data: any) => string;
  requestBuilder: (prompt: string, model?: string, maxTokens?: number) => any;
}

export interface ProviderDetails {
  name: string;
  apiKey: string;
  model?: string;
  config: LLMProviderConfig;
}

// Provider configurations with default models and API endpoints
export const LLM_PROVIDERS: Record<string, LLMProviderConfig> = {
  groq: {
    apiEndpoint: 'https://api.groq.com/openai/v1/chat/completions',
    defaultModel: 'llama-3.3-70b-versatile',
    headerTemplate: (apiKey: string) => ({ 
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }),
    responseHandler: (data: any) => data.choices[0].message.content.trim(),
    requestBuilder: (prompt: string, model?: string, maxTokens?: number) => ({
      // Groq requires the model parameter, so use default if not specified
      model: model || 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a senior software developer. Create a concise, conventional commit message that strictly follows the Conventional Commits format: 
          
          <type>(<scope>): <description>
          
          Valid types: feat, fix, docs, style, refactor, perf, test, chore
          
          Example formats:
          - feat(ui): add new button component
          - fix(auth): resolve login issue with expired tokens
          - docs(readme): update installation instructions
          
          Use lowercase for type and scope. Keep the first line under 80 characters.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: maxTokens || 500
    })
  },
  openai: {
    apiEndpoint: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4o',
    headerTemplate: (apiKey: string) => ({ 
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }),
    responseHandler: (data: any) => data.choices[0].message.content.trim(),
    requestBuilder: (prompt: string, model?: string, maxTokens?: number) => ({
      // OpenAI may also require model parameter, so use default if not specified
      model: model || 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a senior software developer. Create a concise, conventional commit message that strictly follows the Conventional Commits format: 
          
          <type>(<scope>): <description>
          
          Valid types: feat, fix, docs, style, refactor, perf, test, chore
          
          Example formats:
          - feat(ui): add new button component
          - fix(auth): resolve login issue with expired tokens
          - docs(readme): update installation instructions
          
          Use lowercase for type and scope. Keep the first line under 80 characters.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: maxTokens || 500
    })
  },
  anthropic: {
    apiEndpoint: 'https://api.anthropic.com/v1/messages',
    defaultModel: 'claude-3.7-sonnet',
    headerTemplate: (apiKey: string) => ({ 
      'x-api-key': apiKey, 
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    }),
    responseHandler: (data: any) => data.content[0].text,
    requestBuilder: (prompt: string, model?: string, maxTokens?: number) => ({
      // Anthropic also requires the model parameter
      model: model || 'claude-3.7-sonnet',
      messages: [
        { 
          role: 'user', 
          content: `Create a concise, conventional commit message that strictly follows the Conventional Commits format: 
          
          <type>(<scope>): <description>
          
          Valid types: feat, fix, docs, style, refactor, perf, test, chore
          
          Example formats:
          - feat(ui): add new button component
          - fix(auth): resolve login issue with expired tokens
          - docs(readme): update installation instructions
          
          Use lowercase for type and scope. Keep the first line under 80 characters.
          
          For the following changes: ${prompt}` 
        }
      ],
      max_tokens: maxTokens || 500
    })
  },
  gemini: {
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    defaultModel: 'gemini-2.0-flash',
    headerTemplate: (apiKey: string) => {
      // If API key doesn't start with "AIza", it's not properly formatted for Google APIs
      const formattedKey = apiKey.startsWith('AIza') ? apiKey : `AIza${apiKey}`;
      return {
        'Content-Type': 'application/json',
        'x-goog-api-key': formattedKey
      };
    },
    responseHandler: (data: any) => {
      // Validate response structure before attempting to extract content
      if (!data) {
        throw new Error('Empty response received from Gemini API');
      }
      
      if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
        throw new Error('No candidates found in Gemini API response');
      }
      
      const candidate = data.candidates[0];
      if (!candidate.content) {
        throw new Error('No content found in Gemini API response candidate');
      }
      
      if (!candidate.content.parts || !Array.isArray(candidate.content.parts) || candidate.content.parts.length === 0) {
        throw new Error('No content parts found in Gemini API response');
      }
      
      if (!candidate.content.parts[0].text) {
        throw new Error('No text found in Gemini API response content parts');
      }
      
      // If we've made it here, we have valid text content
      return candidate.content.parts[0].text;
    },
    requestBuilder: (prompt: string, model?: string, maxTokens?: number) => ({
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        maxOutputTokens: maxTokens || 500,
        temperature: 0
      }
    })
  }
};

/**
 * Gets the configured provider details based on environment variables
 * @returns Provider configuration with API key, model, and name
 */
export function getProviderConfig(): ProviderDetails {
  // Check for the provider setting
  const providerName = process.env.PUSHSCRIPT_LLM_PROVIDER || 'openai';
  
  // Check for provider-specific API key
  let apiKey = '';
  let model = '';
  
  // Try provider-specific API key with correct casing
  switch (providerName.toLowerCase()) {
    case 'openai':
      apiKey = process.env.OPENAI_API_KEY || '';
      model = process.env.OPENAI_PUSHSCRIPT_MODEL || LLM_PROVIDERS.openai.defaultModel || '';
      break;
    case 'groq':
      apiKey = process.env.GROQ_API_KEY || '';
      model = process.env.GROQ_PUSHSCRIPT_MODEL || LLM_PROVIDERS.groq.defaultModel || '';
      break;
    case 'anthropic':
      apiKey = process.env.ANTHROPIC_API_KEY || '';
      model = process.env.ANTHROPIC_PUSHSCRIPT_MODEL || LLM_PROVIDERS.anthropic.defaultModel || '';
      break;
    case 'gemini':
      apiKey = process.env.GEMINI_API_KEY || '';
      model = process.env.GEMINI_PUSHSCRIPT_MODEL || LLM_PROVIDERS.gemini.defaultModel || '';
      break;
    default:
      // Unknown provider
      console.warn(`Unknown provider: ${providerName}, falling back to OpenAI`);
  }
  
  // If no provider-specific key found, check for generic key
  if (!apiKey) {
    apiKey = process.env.PUSHSCRIPT_LLM_API_KEY || '';
  }
  
  // If no model specified, check for generic model
  if (!model) {
    model = process.env.PUSHSCRIPT_LLM_MODEL || '';
  }
  
  // Get the provider config
  const providerConfig = LLM_PROVIDERS[providerName.toLowerCase()] || LLM_PROVIDERS.openai;
  
  return {
    name: providerName.toLowerCase(),
    apiKey,
    model,
    config: providerConfig
  };
}

/**
 * Builds the API request configuration for the specified provider
 * @param providerDetails Provider details including name, key, and model
 * @param prompt The prompt to send to the LLM
 * @param maxTokens Maximum tokens to generate
 * @returns Request configuration for fetch including endpoint and request object
 */
export async function buildApiRequest(
  providerDetails: ProviderDetails, 
  prompt: string, 
  maxTokens: number = 500
): Promise<{ endpoint: string; request: RequestInit }> {
  const { name, apiKey, model, config } = providerDetails;
  
  if (!apiKey) {
    throw new Error(`No API key available for ${name}`);
  }
  
  // Get the request headers
  const headers = config.headerTemplate(apiKey);
  
  // Build the request body
  const body = config.requestBuilder(prompt, model, maxTokens);
  
  // Create the request config
  const request: RequestInit = {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  };
  
  return {
    endpoint: config.apiEndpoint,
    request
  };
} 