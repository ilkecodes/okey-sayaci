import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ error: 'Resim bulunamadi' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key yapilandirilmamis' }, { status: 500 });
    }

    const prompt = `Bu fotoğrafta Okey 101 oyunundan taşlar var. Lütfen fotoğraftaki TÜM taşları tespit et ve say. Her taşın sayısını ve rengini belirle (kırmızı, siyah, mavi, sarı).

SADECE aşağıdaki JSON formatında cevap ver, başka hiçbir şey yazma:

{
  "taslar": [
    {"sayi": 5, "renk": "kirmizi"},
    {"sayi": 7, "renk": "siyah"}
  ],
  "toplam_puan": 12,
  "aciklama": "2 taş tespit edildi"
}

Renkleri şöyle belirt: kirmizi, siyah, mavi, sari
Her taşın puanı kendi sayısına eşittir. Toplam puanı hesapla.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: image,
                  },
                },
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1000,
          },
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      console.error('Gemini API error:', data.error);
      return NextResponse.json({ error: data.error.message }, { status: 500 });
    }

    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // JSON'u cikar
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return NextResponse.json(result);
    } else {
      return NextResponse.json({
        taslar: [],
        toplam_puan: 0,
        aciklama: 'Taslar taninamadi. Lutfen tekrar deneyin.',
      });
    }
  } catch (error) {
    console.error('Analiz hatasi:', error);
    return NextResponse.json(
      { error: 'Analiz sirasinda hata olustu' },
      { status: 500 }
    );
  }
}
