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
        .order('created_at', { ascending: true })

      if (error) throw error

      if (!data || data.length === 0) {
        return new Response(
          JSON.stringify({ summary: 'Tidak ada catatan update pada periode ini.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      contentText = data
        .map((d) => {
          const dateStr = d.created_at ? new Date(d.created_at).toISOString().split('T')[0] : 'Tanpa Tanggal'
          return `[Tanggal: ${dateStr}] Judul: ${d.title} | Rincian: ${d.description || '(tanpa rincian)'}`
        })
        .join('\n')
    } else if (status === 'todo' || status === 'done') {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, task_history(*)')
        .eq('status', status)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true })

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
          const dateStr = t.created_at ? new Date(t.created_at).toISOString().split('T')[0] : 'Tanpa Tanggal'
          const historyText =
            t.task_history && t.task_history.length > 0
              ? t.task_history.map((h) => h.description).filter(Boolean).join('; ')
              : t.description || '(tanpa deskripsi)'
          return `[Tanggal: ${dateStr}] Tugas: ${t.name} | Catatan/Progres: ${historyText}`
        })
        .join('\n')
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not configured in Supabase Function secrets.')
    }

    const prompt = `Kamu adalah asisten profesional yang bertugas menyusun laporan rekap aktivitas kerja harian (daily activity log).
Berdasarkan data aktivitas berikut (yang sudah diurutkan berdasarkan tanggal/waktu), buatlah laporan pekerjaan yang terstruktur PER HARI / PER TANGGAL (day-by-day/daily log).

Aturan penulisan:
1. Kelompokkan setiap pekerjaan berdasarkan tanggal kejadian (gunakan format header tanggal: "📅 [Hari, DD MMMM YYYY]").
2. Kalimat setiap item pekerjaan JANGAN hanya copy-paste mentah. Tulis ulang / generate ulang (paraphrase & polish) kalimatnya agar terkesan rapi, profesional, jelas dampaknya/progresnya, serta mudah dipahami oleh atasan atau tim (gunakan gaya bahasa bisnis/profesional yang elegan).
3. Jika pada hari tersebut terdapat beberapa pekerjaan/update, sajikan dalam bentuk poin-poin (bullet points) yang rapi.
4. Format output:
   - Judul laporan di baris pertama: "📋 Rekap Aktivitas Pekerjaan".
   - Diikuti header tanggal dan rincian poin-poin pekerjaan yang telah dipoles dengan profesional.
5. PENTING: Langsung keluarkan teks laporan finalnya saja. JANGAN sertakan proses berpikir, analisis aturan, draft awal, atau pengulangan instruksi.

Data Aktivitas:
${contentText}

Laporan Pekerjaan Per Hari:`

    // Query available models for this API key
    const listRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`
    )
    const listData = await listRes.json()

    if (!listRes.ok) {
      throw new Error(`Gemini ListModels Error: ${listData.error?.message || listRes.statusText}`)
    }

    const availableModels: string[] = (listData.models || [])
      .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
      .map((m: any) => m.name.replace('models/', ''))

    // Candidate model priority list
    const candidateOrder = [
      'gemini-3.8-flash',
      'gemini-3.8-flash-exp',
      'gemini-3.8-pro',
      'gemini-3-flash',
      'gemini-3-pro',
      'gemini-2.0-flash',
      'gemini-2.0-pro-exp',
    ]

    const prioritizedModels = [
      ...candidateOrder.filter((m) => availableModels.includes(m)),
      ...availableModels.filter((m) => !candidateOrder.includes(m)),
    ]

    let summary = null
    let lastError = null

    for (const model of prioritizedModels) {
      try {
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: {
                parts: [
                  {
                    text: 'Kamu adalah asisten pelaporan kerja profesional. Tugasmu HANYA menghasilkan teks laporan aktivitas kerja final dalam format Markdown. Jangan pernah menampilkan proses berpikir, analisis aturan, draft rancangan, atau catatan internal.',
                  },
                ],
              },
              contents: [{ parts: [{ text: prompt }] }],
            }),
          }
        )

        const geminiData = await geminiResponse.json()

        if (geminiResponse.ok && geminiData.candidates?.[0]?.content?.parts?.[0]?.text) {
          let text = geminiData.candidates[0].content.parts[0].text.trim()

          // If the model output still contains '📋 Rekap', slice from there
          if (text.includes('📋 Rekap Aktivitas Pekerjaan')) {
            text = text.substring(text.indexOf('📋 Rekap Aktivitas Pekerjaan'))
          }

          // Strip any trailing thinking notes like *(Self-correction...
          if (text.includes('\n*   *Correction:') || text.includes('\n*   Check headers:')) {
            const cutIdx = Math.min(
              text.includes('\n*   *Correction:') ? text.indexOf('\n*   *Correction:') : Infinity,
              text.includes('\n*   Check headers:') ? text.indexOf('\n*   Check headers:') : Infinity
            )
            if (cutIdx !== Infinity) text = text.substring(0, cutIdx).trim()
          }

          summary = text
          break
        } else {
          lastError = geminiData.error?.message || geminiResponse.statusText
        }
      } catch (err: any) {
        lastError = err.message
      }
    }

    if (!summary) {
      throw new Error(`Gemini API Error: ${lastError || 'Gagal menghasilkan rekap aktivitas.'}`)
    }

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