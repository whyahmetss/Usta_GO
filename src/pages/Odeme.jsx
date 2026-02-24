import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, ShieldCheck } from 'lucide-react';

const Odeme = () => {
  const navigate = useNavigate();
  const [selectedAmount, setSelectedAmount] = useState(500);

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 pt-4">
        <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-2xl shadow-sm">
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <h1 className="text-2xl font-black text-gray-900">Bakiye Yükle</h1>
      </div>

      <div className="max-w-md mx-auto space-y-6">
        {/* Tutar Seçimi */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
          <p className="font-bold text-gray-800 mb-4">Yüklenecek Tutar</p>
          <div className="grid grid-cols-2 gap-3">
            {[200, 500, 1000, 2000].map((tutar) => (
              <button 
                key={tutar}
                onClick={() => setSelectedAmount(tutar)}
                className={`py-4 rounded-2xl font-bold transition-all border-2 ${
                  selectedAmount === tutar 
                  ? 'border-blue-600 bg-blue-50 text-blue-600' 
                  : 'border-gray-50 text-gray-400'
                }`}
              >
                {tutar} TL
              </button>
            ))}
          </div>
        </div>

        {/* Kart Bilgileri (Simüle) */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <CreditCard size={20} />
            <span className="font-bold">Kart Bilgileri</span>
          </div>
          <input type="text" placeholder="Kart Üzerindeki İsim" className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 transition-all" />
          <input type="text" placeholder="0000 0000 0000 0000" className="w-full p-4 bg-gray-50 rounded-2xl border-none" />
          <div className="flex gap-3">
            <input type="text" placeholder="AA/YY" className="w-1/2 p-4 bg-gray-50 rounded-2xl border-none" />
            <input type="text" placeholder="CVC" className="w-1/2 p-4 bg-gray-50 rounded-2xl border-none" />
          </div>
        </div>

        {/* Ödeme Butonu */}
        <button className="w-full bg-blue-600 text-white py-5 rounded-[28px] font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all">
          {selectedAmount} TL Öde
        </button>

        <div className="flex items-center justify-center gap-2 text-gray-400 text-xs font-medium">
          <ShieldCheck size={14} />
          256-bit SSL ile güvenli ödeme
        </div>
      </div>
    </div>
  );
};

export default Odeme;
