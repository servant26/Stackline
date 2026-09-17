import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { period, status } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const now = new Date()
    let startDate = new Date()

    if (period === 'today') {
      startDate.setHours(0, 0, 0, 0)
    } else if (period === 'week') {
      startDate.setDate(now.getDate() - 7)
    } else if (period === 'month') {
      startDate.setMonth(now.getMonth() - 1)
    }

    let contentText = ''

    if (status === 'update') {
      const { data, error } = await supabase
        .from('changes')
        .select('*')
        .gte('created_at', startDate.toISOString())

      if (error) throw error

      if (!data || data.length === 0) {
        return new Response(
          JSON.stringify({ summary: 'Tidak ada catatan update pada periode ini.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      contentText = data
        .map((d) => `- ${d.title}: ${d.description || '(tanpa deskripsi)'}`)
        .join('\n')
    } else if (status === 'todo' || status === 'done') {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, task_history(*)')
        .eq('status', status)
        .gte('created_at', startDate.toISOString())

      if (error) throw error

      if (!data || data.length === 0) {
        return new Response(
          JSON.stringify({
            summary: `Tidak ada tugas dengan status ${status} pada periode ini.`,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      contentText = data
        .map((t) => {
          const historyText =
            t.task_history && t.task_history.length > 0
              ? t.task_history.map((h) => h.description).join('; ')
              : t.description || '(tanpa deskripsi)'
          return `- ${t.name}: ${historyText}`
        })
        .join('\n')
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')

    const prompt = `Kamu adalah asisten yang membuat ringkasan pekerjaan. Berdasarkan data berikut, buat ringkasan singkat (maksimal 4-5 kalimat) dalam Bahasa Indonesia yang menjelaskan fokus dan tema utama pekerjaan ini. Jangan cuma daftar ulang item, tapi simpulkan pola/temanya.

Data:
${contentText}

Ringkasan:`

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    )

    const geminiData = await geminiResponse.json()
    const summary =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Gagal membuat ringkasan.'

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})