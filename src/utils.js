import Papa from 'papaparse';

export const GOOGLE_SHEETS_CSV_URL = "https://docs.google.com/spreadsheets/d/1HYscvB1agBcWfQg_TavIecQ8kKfz5KOk5GTMvdtNHaU/export?format=csv";

// Türkçe karakterleri ve aksanları normalize eden sağlam fonksiyon
const normalizeText = (text = '') => {
  return String(text)
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/Ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/Ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/Ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/Ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/Ç/g, 'c')
    .toLowerCase()
    .replace(/[\s_\-]/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

const MONTH_INDEX_MAP = {
  'ocak': 1, 'subat': 2, 'mart': 3, 'nisan': 4, 'mayis': 5, 'haziran': 6,
  'temmuz': 7, 'agustos': 8, 'eylul': 9, 'ekim': 10, 'kasim': 11, 'aralik': 12
};

const parseNumeric = (val) => {
  if (val === undefined || val === null) return null;
  const str = String(val).trim().replace(',', '.');
  if (!str) return null;
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
};

export const fetchPricesFromGoogleSheets = async () => {
  try {
    const cacheBuster = `&_t=${Date.now()}`;
    const url = GOOGLE_SHEETS_CSV_URL.includes('?') 
      ? `${GOOGLE_SHEETS_CSV_URL}${cacheBuster}` 
      : `${GOOGLE_SHEETS_CSV_URL}?${cacheBuster.substring(1)}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP hata! durum: ${response.status}`);
    }
    const csvText = await response.text();
    
    return new Promise((resolve) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
          const monthlyData = {};
          let latestK1 = null;
          let latestK2 = null;

          results.data.forEach(row => {
            let tarihRaw = '', k1Raw = '', k2Raw = '', gunlukRaw = '', aylikRaw = '';

            for (const [key, val] of Object.entries(row)) {
              const k = normalizeText(key);
              if (k.includes('tarih') || k.includes('ay') || k.includes('donem')) {
                tarihRaw = val;
              } else if (k.includes('kademe1') || k === 'k1') {
                k1Raw = val;
              } else if (k.includes('kademe2') || k === 'k2') {
                k2Raw = val;
              } else if (k.includes('gunluk')) {
                gunlukRaw = val;
              } else if (k.includes('aylik')) {
                aylikRaw = val;
              }
            }

            if (!tarihRaw) return;

            const rawMonth = normalizeText(tarihRaw.split(/[\s\-_/]/)[0]);
            const monthIdx = MONTH_INDEX_MAP[rawMonth];
            if (!monthIdx) return;

            const k1 = parseNumeric(k1Raw);
            const k2 = parseNumeric(k2Raw);
            const gunluk = parseNumeric(gunlukRaw);
            const aylik = parseNumeric(aylikRaw);

            monthlyData[monthIdx] = {
              ...(k1 !== null ? { k1 } : {}),
              ...(k2 !== null ? { k2 } : {}),
              ...(gunluk !== null ? { gunluk } : {}),
              ...(aylik !== null ? { aylik } : (gunluk !== null ? { aylik: parseFloat((gunluk * 30).toFixed(2)) } : {}))
            };

            if (k1 !== null) latestK1 = k1;
            if (k2 !== null) latestK2 = k2;
          });

          resolve({
            monthlyData,
            monthlyPrices: monthlyData, // Geriye dönük uyumluluk
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
