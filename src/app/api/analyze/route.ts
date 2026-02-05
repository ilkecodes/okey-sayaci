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

    const prompt = `Sen deneyimli bir 101 Okey uzmanısın. Bu fotoğrafta 101 Okey oyunundan taşlar (perler) var.

GÖREV: Fotoğraftaki TÜM taşları tespit et, sayılarını ve renklerini belirle.

101 OKEY KURALLARI:
- Perlerin toplam değeri 101 veya daha fazla olmalıdır
- Her taşın puanı kendi sayısına eşittir (örn: 7 taşı = 7 puan)
- Okey (sahte joker) taşı varsa, temsil ettiği taşın değerini kullan
- Sahte okey işareti olan taşlar (yıldızlı taşlar) varsa belirt

HIZLI HESAPLAMA YÖNTEMİ (Bilgi için):
- 3'lü perlerin ortasını al, ortalar 33-34 ederse el açılabilir
- 4'lü/5'lü perlerde: 3'lü kısmın ortası + (yan taşlar toplamı ÷ 3)

SADECE aşağıdaki JSON formatında cevap ver, başka hiçbir şey yazma:

{
  "taslar": [
    {"sayi": 5, "renk": "kirmizi"},
    {"sayi": 7, "renk": "siyah"},
    {"sayi": 13, "renk": "mavi"}
  ],
  "toplam_puan": 25,
  "aciklama": "3 tas tespit edildi. Ornek: 5 kirmizi, 7 siyah, 13 mavi"
}

RENKLER: kirmizi, siyah, mavi, sari (sadece bu 4 renk)
SAYILAR: 1-13 arası (Okey taşları için temsil ettikleri değeri yaz)

ÖNEMLİ:
- Fotoğrafta gördüğün HER taşı listele
- Taşların üzerindeki sayıları dikkatlice oku
- Toplam puanı doğru hesapla (tüm taşların sayılarının toplamı)`;

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
            maxOutputTokens: 2000,
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
