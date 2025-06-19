import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LLMConfig {
  provider: 'openai' | 'groq' | 'gemini';
  model: string;
  apiKey?: string;
}

async function callOpenAI(prompt: string, config: LLMConfig) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey || Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert quiz generator. Generate high-quality educational quiz questions.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callGroq(prompt: string, config: LLMConfig) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey || Deno.env.get('GROQ_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert quiz generator. Generate high-quality educational quiz questions.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    throw new Error(`GROQ API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callGemini(prompt: string, config: LLMConfig) {
  const apiKey = config.apiKey || Deno.env.get('GEMINI_API_KEY');
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `You are an expert quiz generator. Generate high-quality educational quiz questions.\n\n${prompt}`
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4000,
      }
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

async function generateWithLLM(prompt: string, config: LLMConfig): Promise<string> {
  switch (config.provider) {
    case 'openai':
      return await callOpenAI(prompt, config);
    case 'groq':
      return await callGroq(prompt, config);
    case 'gemini':
      return await callGemini(prompt, config);
    default:
      throw new Error(`Unsupported LLM provider: ${config.provider}`);
  }
}

function parseJSONFromResponse(content: string): any {
  try {
    // First, try to parse directly as JSON
    return JSON.parse(content);
  } catch (error) {
    try {
      // Try to extract JSON from markdown code block
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      
      // Try to extract JSON from generic code block
      const codeMatch = content.match(/```\s*([\s\S]*?)\s*```/);
      if (codeMatch) {
        return JSON.parse(codeMatch[1]);
      }
      
      // Try to find JSON-like content between curly braces
      const jsonLikeMatch = content.match(/\{[\s\S]*\}/);
      if (jsonLikeMatch) {
        return JSON.parse(jsonLikeMatch[0]);
      }
      
      throw new Error('No valid JSON found in response');
    } catch (parseError) {
      throw new Error(`Failed to parse JSON from LLM response. Original content: ${content.substring(0, 500)}...`);
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { pdfUrl, topic, totalQuestions, llmConfig } = await req.json()

    // Default to OpenAI if no config provided
    const config: LLMConfig = llmConfig || {
      provider: 'openai',
      model: 'gpt-4'
    };

    let prompt = ''
    if (pdfUrl) {
      // For PDF-based quiz generation
      prompt = `Generate ${totalQuestions} quiz questions based on the PDF document at ${pdfUrl}. 
      Create a mix of multiple-choice, short-answer, and essay questions. 
      Each question should have appropriate marks assigned.
      
      IMPORTANT: Return ONLY valid JSON wrapped in a markdown code block like this:
      \`\`\`json
      {
        "questions": [
          {
            "id": "unique_id",
            "question": "question text",
            "type": "multiple-choice|short-answer|essay",
            "options": ["option1", "option2", "option3", "option4"],
            "correctAnswer": "correct answer or option index",
            "marks": number
          }
        ]
      }
      \`\`\`
      
      Do not include any explanatory text before or after the JSON.`
    } else {
      // For topic-based quiz generation
      prompt = `Generate ${totalQuestions} quiz questions on the topic: "${topic}".
      Create a mix of multiple-choice, short-answer, and essay questions.
      Each question should have appropriate marks assigned.
      
      IMPORTANT: Return ONLY valid JSON wrapped in a markdown code block like this:
      \`\`\`json
      {
        "questions": [
          {
            "id": "unique_id",
            "question": "question text",
            "type": "multiple-choice|short-answer|essay",
            "options": ["option1", "option2", "option3", "option4"],
            "correctAnswer": "correct answer or option index",
            "marks": number
          }
        ]
      }
      \`\`\`
      
      Do not include any explanatory text before or after the JSON.`
    }

    const content = await generateWithLLM(prompt, config);

    // Parse the JSON response with enhanced error handling
    const quizData = parseJSONFromResponse(content);

    // Validate the response structure
    if (!quizData.questions || !Array.isArray(quizData.questions)) {
      throw new Error('Invalid response format: missing questions array');
    }

    return new Response(
      JSON.stringify(quizData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Quiz generation error:', error);
    
    // Ensure error message is always a string
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return new Response(
      JSON.stringify({ 
        error: `Quiz generation failed: ${errorMessage}`,
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})