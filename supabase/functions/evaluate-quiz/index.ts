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
          content: 'You are an expert educational evaluator. Provide fair, constructive, and detailed feedback on quiz answers.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
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
          content: 'You are an expert educational evaluator. Provide fair, constructive, and detailed feedback on quiz answers.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
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
          text: `You are an expert educational evaluator. Provide fair, constructive, and detailed feedback on quiz answers.\n\n${prompt}`
        }]
      }],
      generationConfig: {
        temperature: 0.3,
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

async function evaluateWithLLM(prompt: string, config: LLMConfig): Promise<string> {
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { quiz, answers, llmConfig } = await req.json()

    // Default to OpenAI if no config provided
    const config: LLMConfig = llmConfig || {
      provider: 'openai',
      model: 'gpt-4'
    };

    // Prepare evaluation prompt
    const evaluationPrompt = `
    Evaluate the following quiz answers and provide detailed feedback:

    Quiz: ${quiz.title}
    Topic: ${quiz.topic || 'General'}
    Total Questions: ${quiz.total_questions}
    Total Marks: ${quiz.total_marks}

    Questions and Answers:
    ${quiz.questions.map((q: any, index: number) => `
    Question ${index + 1} (${q.marks} marks): ${q.question}
    ${q.type === 'multiple-choice' ? `Options: ${q.options.join(', ')}` : ''}
    ${q.type === 'multiple-choice' ? `Correct Answer: ${q.correctAnswer}` : ''}
    Student Answer: ${answers[q.id] || 'No answer provided'}
    `).join('\n')}

    Additional Evaluation Prompts:
    ${quiz.evaluation_prompts?.join('\n') || 'None'}

    Please provide:
    1. Total score out of ${quiz.total_marks}
    2. Strengths (array of strings)
    3. Weaknesses (array of strings)
    4. Improvement suggestions (array of strings)
    5. Detailed feedback (string)

    Return the response in JSON format:
    {
      "score": number,
      "strengths": ["strength1", "strength2"],
      "weaknesses": ["weakness1", "weakness2"],
      "improvements": ["improvement1", "improvement2"],
      "detailedFeedback": "detailed feedback text"
    }
    `

    const content = await evaluateWithLLM(evaluationPrompt, config);

    // Parse the JSON response
    const evaluation = JSON.parse(content);

    return new Response(
      JSON.stringify(evaluation),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Quiz evaluation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})