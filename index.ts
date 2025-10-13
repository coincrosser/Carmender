import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const SYSTEM_PROMPT = `You are a personal financial assistant helping users manage their bills, track expenses, and achieve their financial goals.

Your role is to:
1. Conduct daily check-ins with the user about their financial situation
2. ALWAYS ask about their goals and track daily progress towards them
3. Ask about their to-do lists and how they're managing their time
4. Discuss their income and expenses
5. Help them set and achieve financial goals
6. Provide personalized guidance on prioritizing time and money
7. Be supportive, encouraging, and non-judgmental
8. Offer practical, actionable advice

IMPORTANT - Daily Goal Check-Ins:
- At the start of each conversation, ask about their goals for the day
- Check progress on their active financial goals
- Ask specific questions like: "How are you doing with [goal name]?" or "Did you make progress on [goal] today?"
- Celebrate small wins and progress
- If they haven't made progress, help them identify what blocked them and how to overcome it
- Always end conversations by setting expectations for tomorrow

Remember:
- Be conversational and friendly
- Ask follow-up questions to understand their situation better
- Help them see connections between their daily choices and long-term goals
- Celebrate their wins, no matter how small
- Be patient and understanding about setbacks
- Keep responses concise and focused (2-4 sentences usually)
- Use empathy and encouragement`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { message } = await req.json();

    if (!message) {
      throw new Error('Message is required');
    }

    const { data: chatHistory } = await supabaseClient
      .from('chat_history')
      .select('message, role, created_at')
      .order('created_at', { ascending: true })
      .limit(20);

    const { data: recentBills } = await supabaseClient
      .from('bills')
      .select('date, description, amount, type, status')
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date')
      .limit(10);

    const { data: goals } = await supabaseClient
      .from('user_goals')
      .select('goal, target_amount, target_date, status')
      .eq('status', 'active')
      .limit(5);

    const today = new Date().toISOString().split('T')[0];
    const { data: todayCheckIn } = await supabaseClient
      .from('daily_check_ins')
      .select('goals_discussed, progress_notes')
      .eq('check_in_date', today)
      .maybeSingle();

    const goalsDiscussedToday = todayCheckIn?.goals_discussed || false;
    const previousNotes = todayCheckIn?.progress_notes || '';

    let contextInfo = `\n\nUser Context:\n- Upcoming Bills: ${recentBills?.length || 0} bills\n- Active Goals: ${goals?.length || 0} goals\n${goals?.length ? '- Goals: ' + goals.map(g => g.goal).join(', ') : ''}`;

    if (!goalsDiscussedToday && goals && goals.length > 0) {
      contextInfo += `\n\nIMPORTANT: You have NOT discussed goals with the user today yet. Please ask about their progress on: ${goals.map(g => g.goal).join(', ')}`;
    } else if (goalsDiscussedToday && previousNotes) {
      contextInfo += `\n\nGoals discussed today. Previous notes: ${previousNotes}`;
    }

    const conversationHistory = [
      { role: 'system', content: SYSTEM_PROMPT + contextInfo },
      ...(chatHistory || []).slice(-10).map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.message
      })),
      { role: 'user', content: message }
    ];

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: conversationHistory.map(msg => ({
            role: msg.role === 'system' ? 'user' : msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
          })),
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          },
        }),
      }
    );

    const geminiData = await geminiResponse.json();
    
    if (!geminiData.candidates || !geminiData.candidates[0]) {
      throw new Error('No response from AI');
    }

    const reply = geminiData.candidates[0].content.parts[0].text;

    const goalsKeywords = ['goal', 'progress', 'working on', 'achieved', 'trying to'];
    const mentionedGoals = goalsKeywords.some(keyword =>
      message.toLowerCase().includes(keyword) || reply.toLowerCase().includes(keyword)
    );

    if (mentionedGoals && goals && goals.length > 0) {
      await supabaseClient
        .from('daily_check_ins')
        .upsert({
          user_id: user.id,
          check_in_date: today,
          goals_discussed: true,
          progress_notes: `${previousNotes ? previousNotes + ' | ' : ''}${message}`,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,check_in_date'
        });
    }

    return new Response(
      JSON.stringify({ reply }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});