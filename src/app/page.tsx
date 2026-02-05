"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Camera, RotateCw, Calculator } from 'lucide-react';

export default function OkeyKameraHesaplayici() {
  const [kameraAcik, setKameraAcik] = useState(false);
  const [fotograf, setFotograf] = useState<string | null>(null);
  const [analiz, setAnaliz] = useState<{
    taslar: { sayi: number; renk: string }[];
    toplam_puan: number;
    aciklama: string;
  } | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
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
      alert('Kamera erisimi reddedildi veya mevcut degil: ' + (err as Error).message);
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
    kameraAc();
  };

  useEffect(() => {
    return () => {
      kameraKapat();
    };
  }, []);

  const renkKodlari: Record<string, string> = {
    'kirmizi': '#dc2626',
    'siyah': '#1f2937',
    'mavi': '#2563eb',
    'sari': '#eab308'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-600 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-2xl p-6">
          <h1 className="text-3xl font-bold text-center text-green-800 mb-2">
            Okey 101 Sayaci
          </h1>
          <p className="text-center text-gray-600 mb-6">
            Taslarinizi kameraya gosterin, otomatik hesaplayalim
          </p>

          <div className="mb-6">
            {!kameraAcik && !fotograf && (
              <div className="bg-gray-100 rounded-lg p-12 text-center">
                <Camera className="mx-auto mb-4 text-gray-400" size={64} />
                <button
                  onClick={kameraAc}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-lg"
                >
                  Kamerayi Ac
                </button>
              </div>
            )}

            {kameraAcik && (
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-lg shadow-lg"
                />
                <div className="mt-4 flex gap-3 justify-center">
                  <button
                    onClick={fotografCek}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg flex items-center gap-2"
                  >
                    <Camera size={20} />
                    Fotograf Cek
                  </button>
                  <button
                    onClick={kameraKapat}
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                  >
                    Iptal
                  </button>
                </div>
              </div>
            )}

            {fotograf && (
              <div>
                <img src={fotograf} alt="Cekilen fotograf" className="w-full rounded-lg shadow-lg mb-4" />
                {!analiz && !yukleniyor && (
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={taslariAnaliz}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-lg flex items-center gap-2"
                    >
                      <Calculator size={20} />
                      Taslari Hesapla
                    </button>
                    <button
                      onClick={yenidenBasla}
                      className="px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                      <RotateCw size={20} />
                      Yeniden Cek
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {yukleniyor && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
              <p className="mt-4 text-gray-600 font-medium">Taslar analiz ediliyor...</p>
            </div>
          )}

          {analiz && (
            <div>
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-lg mb-3">
                  Tespit Edilen Taslar ({analiz.taslar?.length || 0} adet)
                </h3>
                {analiz.taslar && analiz.taslar.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {analiz.taslar.map((tas, index) => (
                      <div
                        key={index}
                        className="w-12 h-16 rounded-lg font-bold text-lg shadow-md flex items-center justify-center"
                        style={{
                          backgroundColor: 'white',
                          color: renkKodlari[tas.renk] || '#000',
                          border: `3px solid ${renkKodlari[tas.renk] || '#000'}`
                        }}
                      >
                        {tas.sayi}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">{analiz.aciklama}</p>
                )}
              </div>

              <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg p-6 text-center mb-4">
                <p className="text-lg mb-2">Toplam Puan</p>
                <p className="text-5xl font-bold">{analiz.toplam_puan || 0}</p>
                <p className="text-sm mt-2 opacity-90">
                  {analiz.toplam_puan > 101 ? '101\'i gecti!' :
                   analiz.toplam_puan === 101 ? 'Tam 101!' :
                   `Kalan: ${101 - analiz.toplam_puan}`}
                </p>
              </div>

              <button
                onClick={yenidenBasla}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCw size={20} />
                Yeni Fotograf Cek
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-4 mt-4 text-sm text-gray-600">
          <p className="font-semibold mb-2">Kullanim Ipuclari:</p>
          <ul className="space-y-1">
            <li>- Taslari duz bir zemine yerlestirin</li>
            <li>- Iyi aydinlatilmis bir ortamda cekin</li>
            <li>- Taslar net gorunsun, bulanik olmasin</li>
            <li>- Sonuc %100 dogru olmayabilir, kontrol edin</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
