import Papa from 'papaparse';

export const GOOGLE_SHEETS_CSV_URL = "https://docs.google.com/spreadsheets/d/1HYscvB1agBcWfQg_TavIecQ8kKfz5KOk5GTMvdtNHaU/export?format=csv";

// Ay isimlerini App.jsx'teki indekslere çevirmek için harita
const AY_MAP = {
  'ocak': 1, 'şubat': 2, 'mart': 3, 'nisan': 4, 'mayıs': 5, 'haziran': 6,
  'temmuz': 7, 'ağustos': 8, 'eylül': 9, 'ekim': 10, 'kasım': 11, 'aralık': 12
};

export const fetchPricesFromGoogleSheets = async () => {
  try {
    const response = await fetch(GOOGLE_SHEETS_CSV_URL);
    if (!response.ok) {
      throw new Error(`HTTP hata! durum: ${response.status}`);
    }
    const csvText = await response.text();
    
    return new Promise((resolve) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
          const data = results.data;
          const monthlyPrices = {};
          let latestK1 = null;
          let latestK2 = null;

          data.forEach(row => {
            const tarih = (row['TARİH'] || '').trim().toLowerCase();
            const k1Str = (row['KADEME 1'] || '').trim();
            const k2Str = (row['KADEME 2'] || '').trim();
            
            if (!tarih) return;

            // Fiyattaki virgülü noktaya çevirip parse edelim
            const k1 = k1Str ? parseFloat(k1Str.replace(',', '.')) : null;
            const k2 = k2Str ? parseFloat(k2Str.replace(',', '.')) : null;

            // Ay ismini ayrıştır (örn: "Ocak 2026" -> "ocak")
            const ayIsmi = tarih.split(' ')[0];
            const ayIndex = AY_MAP[ayIsmi];

            if (ayIndex && k1 !== null && k2 !== null && !isNaN(k1) && !isNaN(k2)) {
              monthlyPrices[ayIndex] = { k1, k2 };
              latestK1 = k1;
              latestK2 = k2;
            }
          });

          resolve({
            monthlyPrices,
            latestPrices: { kademe1: latestK1, kademe2: latestK2 }
          });
        },
        error: function(error) {
          console.error("CSV parse hatası:", error);
          resolve(null);
        }
      });
    });
    
  } catch (error) {
    console.error("Google Sheets'ten fiyatlar çekilirken hata oluştu:", error);
    return null;
  }
};
