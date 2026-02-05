"use client";

import { useState, useRef, useEffect } from 'react';
import { Camera, RotateCw, Calculator, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

export default function OkeyKameraHesaplayici() {
  const [kameraAcik, setKameraAcik] = useState(false);
  const [fotograf, setFotograf] = useState<string | null>(null);
  const [analiz, setAnaliz] = useState<{
    taslar: { sayi: number; renk: string }[];
    toplam_puan: number;
    aciklama: string;
  } | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [kurallarAcik, setKurallarAcik] = useState(false);
  const [hedefPuan, setHedefPuan] = useState(101);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const kameraAc = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      setKameraAcik(true);
    } catch (err) {
      alert('Kamera erisimi reddedildi: ' + (err as Error).message);
    }
  };

  const kameraKapat = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setKameraAcik(false);
  };

  const fotografCek = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setFotograf(imageData);
      kameraKapat();
    }
  };

  const taslariAnaliz = async () => {
    if (!fotograf) return;

    setYukleniyor(true);
    setAnaliz(null);

    try {
      const base64Data = fotograf.split(',')[1];

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: base64Data })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setAnaliz(data);
    } catch (error) {
      console.error("Analiz hatasi:", error);
      setAnaliz({
        taslar: [],
        toplam_puan: 0,
        aciklama: "Taslar taninamadi. Lutfen tekrar deneyin."
      });
    } finally {
      setYukleniyor(false);
    }
  };

  const yenidenBasla = () => {
    setFotograf(null);
    setAnaliz(null);
  };

  useEffect(() => {
    return () => {
      kameraKapat();
    };
  }, []);

  const renkKodlari: Record<string, string> = {
    'kirmizi': '#ef4444',
    'siyah': '#1f2937',
    'mavi': '#3b82f6',
    'sari': '#f59e0b'
  };

  const puanDurumu = analiz ? (
    analiz.toplam_puan >= hedefPuan ? 'gecti' :
    analiz.toplam_puan === hedefPuan - 1 ? 'yakin' : 'eksik'
  ) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-900 via-emerald-800 to-emerald-900">
      {/* Header */}
      <div className="bg-emerald-950/50 backdrop-blur-sm border-b border-emerald-700/50 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-center text-white tracking-tight">
            101 Okey Sayaci
          </h1>
          <p className="text-center text-emerald-300 text-sm mt-1">
            Perlerinizi cekin, puani hesaplayalim
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Hedef Puan Ayari */}
        <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/10">
          <label className="text-emerald-200 text-sm font-medium block mb-2">
            Acilis Baraji
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="101"
              max="200"
              value={hedefPuan}
              onChange={(e) => setHedefPuan(Number(e.target.value))}
              className="flex-1 h-2 bg-emerald-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <span className="bg-amber-500 text-emerald-900 font-bold px-3 py-1 rounded-lg min-w-[60px] text-center">
              {hedefPuan}
            </span>
          </div>
        </div>

        {/* Ana Kart */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Kamera / Fotograf Alani */}
          <div className="p-6">
            {!kameraAcik && !fotograf && (
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-8 text-center border-2 border-dashed border-emerald-200">
                <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Camera className="text-white" size={36} />
                </div>
                <p className="text-emerald-800 font-medium mb-4">
                  Perlerinizi fotograflayin
                </p>
                <button
                  onClick={kameraAc}
                  className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 active:scale-95 transition-all shadow-lg shadow-emerald-600/30"
                >
                  Kamerayi Ac
                </button>
              </div>
            )}

            {kameraAcik && (
              <div className="space-y-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-2xl shadow-lg"
                />
                <div className="flex gap-3">
                  <button
                    onClick={fotografCek}
                    className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Camera size={20} />
                    Cek
                  </button>
                  <button
                    onClick={kameraKapat}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 active:scale-95 transition-all"
                  >
                    Iptal
                  </button>
                </div>
              </div>
            )}

            {fotograf && !analiz && !yukleniyor && (
              <div className="space-y-4">
                <img src={fotograf} alt="Perl fotografi" className="w-full rounded-2xl shadow-lg" />
                <div className="flex gap-3">
                  <button
                    onClick={taslariAnaliz}
                    className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30"
                  >
                    <Calculator size={20} />
                    Hesapla
                  </button>
                  <button
                    onClick={yenidenBasla}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <RotateCw size={18} />
                  </button>
                </div>
              </div>
            )}

            {yukleniyor && (
              <div className="py-12 text-center">
                <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 text-emerald-700 font-medium">Perler analiz ediliyor...</p>
              </div>
            )}

            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>

          {/* Sonuc */}
          {analiz && (
            <div className="border-t border-gray-100">
              {/* Puan Göstergesi */}
              <div className={`p-6 text-center ${
                puanDurumu === 'gecti' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' :
                puanDurumu === 'yakin' ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                'bg-gradient-to-r from-red-500 to-red-600'
              }`}>
                <p className="text-white/80 text-sm font-medium mb-1">Toplam Puan</p>
                <p className="text-6xl font-bold text-white">{analiz.toplam_puan}</p>
                <p className="text-white/90 text-lg mt-2 font-medium">
                  {puanDurumu === 'gecti' ? `${hedefPuan}'i gecti! Acilabilir` :
                   puanDurumu === 'yakin' ? `1 puan eksik!` :
                   `${hedefPuan - analiz.toplam_puan} puan eksik`}
                </p>
              </div>

              {/* Tespit Edilen Taslar */}
              {analiz.taslar && analiz.taslar.length > 0 && (
                <div className="p-6">
                  <h3 className="font-semibold text-gray-800 mb-3">
                    Tespit Edilen Taslar ({analiz.taslar.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {analiz.taslar.map((tas, index) => (
                      <div
                        key={index}
                        className="w-10 h-14 rounded-lg font-bold text-base shadow-md flex items-center justify-center bg-white"
                        style={{
                          color: renkKodlari[tas.renk] || '#000',
                          border: `2px solid ${renkKodlari[tas.renk] || '#000'}`
                        }}
                      >
                        {tas.sayi}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Yeniden Baslat */}
              <div className="p-6 pt-0">
                <button
                  onClick={yenidenBasla}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <RotateCw size={18} />
                  Yeni Fotograf
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Kurallar */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <button
            onClick={() => setKurallarAcik(!kurallarAcik)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <BookOpen className="text-emerald-600" size={22} />
              <span className="font-semibold text-gray-800">101 Oyunu Kurallari</span>
            </div>
            {kurallarAcik ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
          </button>

          {kurallarAcik && (
            <div className="px-6 pb-6 space-y-6 text-sm text-gray-600 border-t border-gray-100 pt-4">
              {/* Temel Kural */}
              <div>
                <h4 className="font-bold text-gray-800 mb-2">Temel Kural</h4>
                <p>
                  101 oyununda acilan perlerin toplam degeri <span className="font-bold text-emerald-600">101 veya daha fazla</span> olmalidir.
                </p>
              </div>

              {/* Ornek */}
              <div className="bg-emerald-50 rounded-xl p-4">
                <h4 className="font-bold text-emerald-800 mb-2">Ornek Hesaplama</h4>
                <div className="space-y-1 text-emerald-700">
                  <p>1+1+1 = <span className="font-bold">3</span></p>
                  <p>10+11+12 = <span className="font-bold">33</span></p>
                  <p>8+9+10 = <span className="font-bold">27</span></p>
                  <p>7+8+9 = <span className="font-bold">24</span></p>
                  <p>5+5+5 = <span className="font-bold">15</span></p>
                  <p className="pt-2 border-t border-emerald-200 font-bold">
                    Toplam: 3+33+27+24+15 = 102
                  </p>
                </div>
              </div>

              {/* Kolay Hesap */}
              <div>
                <h4 className="font-bold text-gray-800 mb-2">Kolay Hesap Yolu (34 Kurali)</h4>
                <p className="mb-3">
                  3lu gruplarin <span className="font-bold">ortasini</span> toplayin. Ortalar <span className="font-bold text-amber-600">34</span> yapiyorsa toplam 102dir ve el acilabilir.
                </p>
                <div className="bg-amber-50 rounded-xl p-4 space-y-2 text-amber-800">
                  <p>1-1-1 serisi → Orta: <span className="font-bold">1</span></p>
                  <p>10-11-12 serisi → Orta: <span className="font-bold">11</span></p>
                  <p>8-9-10 serisi → Orta: <span className="font-bold">9</span></p>
                  <p>7-8-9 serisi → Orta: <span className="font-bold">8</span></p>
                  <p>5-5-5 serisi → Orta: <span className="font-bold">5</span></p>
                  <p className="pt-2 border-t border-amber-200 font-bold">
                    Ortalar: 1+11+9+8+5 = 34 ✓
                  </p>
                </div>
              </div>

              {/* 4lu ve 5li Perler */}
              <div>
                <h4 className="font-bold text-gray-800 mb-2">4lu ve 5li Perler</h4>
                <p className="mb-2">
                  Ilk 3lu grubun ortasini alin, yandaki taslari 3e bolun ve toplayin.
                </p>
                <div className="bg-gray-100 rounded-xl p-4 space-y-3">
                  <div>
                    <p className="font-medium text-gray-800">3-4-5-6-7 serisi:</p>
                    <p>Orta (3-4-5): <span className="font-bold">4</span></p>
                    <p>Yanlar (6+7=13): 13÷3 = <span className="font-bold">4</span></p>
                    <p className="text-emerald-600 font-bold">Deger: 4+4 = 8</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">7-8-9-10 serisi:</p>
                    <p>Orta (7-8-9): <span className="font-bold">8</span></p>
                    <p>Yan (10): 10÷3 = <span className="font-bold">3</span></p>
                    <p className="text-emerald-600 font-bold">Deger: 8+3 = 11</p>
                  </div>
                </div>
              </div>

              {/* Artirmali 101 */}
              <div>
                <h4 className="font-bold text-gray-800 mb-2">Artirmali 101</h4>
                <p>
                  Ilk acan 101 ile acar. Sonraki oyuncu <span className="font-bold">bir fazlasina</span> acmalidir.
                  Ornegin biri 147 actiysa, sonraki oyuncu en az 148 acmalidir.
                </p>
                <p className="mt-2 text-emerald-600 font-medium">
                  Ciftlerde artirma yoktur - herkes 5 ciftle acabilir.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="text-center text-emerald-300/80 text-xs py-4">
          Taslari duz zemine yerlestirin ve iyi isikta cekin
        </div>
      </div>
    </div>
  );
}
