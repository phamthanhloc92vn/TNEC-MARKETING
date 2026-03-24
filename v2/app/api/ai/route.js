import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { prompt } = await request.json();
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ success: false, error: 'Chưa cấu hình OpenAI API Key.' });
  }

  const systemPrompt = `Bạn là trợ lý marketing chuyên nghiệp. Khi được yêu cầu, hãy đề xuất danh sách sub-tasks hoặc mô tả chi tiết cho công việc marketing.
Trả lời bằng tiếng Việt, ngắn gọn, rõ ràng.
Format: Trả về JSON array gồm các object {name, description} cho mỗi sub-task.`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    const json = await res.json();
    if (json.error) {
      return NextResponse.json({ success: false, error: json.error.message });
    }

    const content = json.choices[0].message.content;
    let suggestions;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      suggestions = [{ name: 'Gợi ý AI', description: content }];
    }

    return NextResponse.json({ success: true, suggestions, rawText: content });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Lỗi kết nối OpenAI: ' + e.message });
  }
}
