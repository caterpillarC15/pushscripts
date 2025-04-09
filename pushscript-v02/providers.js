/**
 * LLM provider configuration for PushScript
 * Configures multiple AI providers for commit message generation
 */

import fetch from 'node-fetch';

// Provider configurations with default models and API endpoints
export const LLM_PROVIDERS = {
  groq: {
    apiEndpoint: 'https://api.groq.com/openai/v1/chat/completions',
    defaultModel: 'llama-3.3-70b-versatile',
    headerTemplate: (apiKey) => ({ 
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }),
    responseHandler: (data) => data.choices[0].message.content.trim(),
    requestBuilder: (prompt, model, maxTokens) => ({
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
      max_tokens: maxTokens
    })
  },
  openai: {
    apiEndpoint: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4o',
    headerTemplate: (apiKey) => ({ 
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }),
    responseHandler: (data) => data.choices[0].message.content.trim(),
    requestBuilder: (prompt, model, maxTokens) => ({
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
      max_tokens: maxTokens
    })
  },
  anthropic: {
    apiEndpoint: 'https://api.anthropic.com/v1/messages',
    defaultModel: 'claude-3.7-sonnet',
    headerTemplate: (apiKey) => ({ 
      'x-api-key': apiKey, 
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    }),
    responseHandler: (data) => data.content[0].text,
    requestBuilder: (prompt, model, maxTokens) => ({
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
      max_tokens: maxTokens
    })
  },
  gemini: {
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    headerTemplate: (apiKey) => {
      // If API key doesn't start with "AIza", it's not properly formatted for Google APIs
      const formattedKey = apiKey.startsWith('AIza') ? apiKey : `AIza${apiKey}`;
      return {
        'Content-Type': 'application/json',
        'x-goog-api-key': formattedKey
      };
    },
    responseHandler: (data) => {
      // Debug the raw response to help diagnose issues
      console.log('Raw Gemini API response:', JSON.stringify(data, null, 2));
      
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
    requestBuilder: (prompt, model, maxTokens) => ({
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
        maxOutputTokens: maxTokens,
        temperature: 0
      }
    })
  }
};

/**
 * Lists available models for the Gemini API
 * This helper function can be used to troubleshoot model availability issues
 * @param {string} apiKey - The Gemini API key
 * @returns {Promise<Array>} List of available models
 */
export async function listGeminiModels(apiKey) {
  try {
    // Ensure API key has proper format
    const formattedKey = apiKey.startsWith('AIza') ? apiKey : `AIza${apiKey}`;
    
    // Call the ListModels endpoint
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models',
      {
        method: 'GET',
        headers: {
          'x-goog-api-key': formattedKey
        }
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to list models: ${errorText}`);
    }
    
    const data = await response.json();
    
    // Filter for text generation models and sort by name
    const validModels = data.models
      .filter(model => 
        model.supportedGenerationMethods && 
        model.supportedGenerationMethods.includes('generateContent')
      )
      .sort((a, b) => a.name.localeCompare(b.name));
    
    return validModels;
  } catch (error) {
    console.error('Error listing Gemini models:', error.message);
    return [];
  }
}

/**
 * Get the provider configuration using environment variables
 * @returns {Object} Provider configuration and related settings
 */
export function getProviderConfig() {
  // Get provider from environment, fallback to 'groq'
  const providerName = process.env.PUSHSCRIPT_LLM_PROVIDER || 'groq';
  
  // Check if provider exists
  if (!LLM_PROVIDERS[providerName]) {
    console.warn(`\x1b[33mWarning: Invalid PushScript LLM provider "${providerName}". Using default (groq).\x1b[0m`);
  }
  
  // Get provider config or fallback to groq
  const providerConfig = LLM_PROVIDERS[providerName] || LLM_PROVIDERS.groq;
  
  // Get API key, trying different environment variables for backward compatibility
  // First try the provider-specific variable
  let apiKey = process.env[`${providerName.toUpperCase()}_API_KEY`];
  
  // If not found, try the generic variable, but only if it doesn't look like a provider name
  if (!apiKey && process.env.PUSHSCRIPT_LLM_API_KEY) {
    const genericKey = process.env.PUSHSCRIPT_LLM_API_KEY;
    // Don't use the value if it's just the name of a provider (common misconfiguration)
    const isProviderName = Object.keys(LLM_PROVIDERS).includes(genericKey.toLowerCase());
    if (!isProviderName) {
      apiKey = genericKey;
    } else {
      console.warn(`\x1b[33mWarning: PUSHSCRIPT_LLM_API_KEY seems to contain a provider name (${genericKey}) rather than an API key.\x1b[0m`);
      console.warn(`\x1b[33mPlease check your configuration. Using ${providerName.toUpperCase()}_API_KEY instead.\x1b[0m`);
    }
  }
  
  // Look for provider-specific model environment variables first, then fall back to generic
  const model = process.env[`${providerName.toUpperCase()}_PUSHSCRIPT_MODEL`] || 
               process.env.PUSHSCRIPT_LLM_MODEL ||
               null;
  
  return {
    name: providerName,
    config: providerConfig,
    apiKey,
    model
  };
}

/**
 * Builds an API request for a given provider
 * @param {Object} providerDetails - The provider configuration from getProviderConfig
 * @param {String} prompt - The input prompt for the LLM
 * @param {Number} maxTokens - Maximum tokens for the response
 * @returns {Object} Request configuration for fetch API
 */
export async function buildApiRequest(providerDetails, prompt, maxTokens = 500) {
  const { config, apiKey, model } = providerDetails;
  
  // Generate request body with or without model
  const requestBody = config.requestBuilder(prompt, model, maxTokens);
  
  // Create the base request object
  let request = {
    method: 'POST',
    headers: config.headerTemplate(apiKey),
    body: JSON.stringify(requestBody)
  };
  
  // For providers like Gemini that have model in the URL
  let endpoint = config.apiEndpoint;
  
  // Special handling for providers that need model in endpoint
  if (config.getEndpoint && apiKey) {
    endpoint = config.getEndpoint(apiKey);
  } else if (endpoint.includes('{model}') && model) {
    // Replace {model} placeholder in endpoint
    endpoint = endpoint.replace('{model}', model);
  } else if (endpoint.includes('{model}') && !model) {
    // For Gemini, we must have a model in URL, so use default if not specified
    endpoint = endpoint.replace('{model}', config.defaultModel);
  }
  
  // Return the request with the endpoint
  return { request, endpoint };
} 