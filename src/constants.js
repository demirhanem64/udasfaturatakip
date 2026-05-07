// UŞAK ili için EPDK tarafından belirlenen aylık/günlük tüketim limitleri (Sm3)
// Kaynak: UDAŞ - https://www.udas.com.tr/konutlarda-kademeli-fiyat-uygulamasi/

export const AYLIK_LIMITLER = {
  1:  { ay: 'Ocak',    aylik: 292.34, gunluk: 9.43 },
  2:  { ay: 'Şubat',   aylik: 296.99, gunluk: 10.61 },
  3:  { ay: 'Mart',    aylik: 252.67, gunluk: 8.15 },
  4:  { ay: 'Nisan',   aylik: 199.05, gunluk: 6.64 },
  5:  { ay: 'Mayıs',   aylik: 106.21, gunluk: 3.43 },
  6:  { ay: 'Haziran', aylik: 43.10,  gunluk: 1.44 },
  7:  { ay: 'Temmuz',  aylik: 25.73,  gunluk: 0.83 },
  8:  { ay: 'Ağustos', aylik: 21.47,  gunluk: 0.69 },
  9:  { ay: 'Eylül',   aylik: 21.49,  gunluk: 0.72 },
  10: { ay: 'Ekim',    aylik: 38.41,  gunluk: 1.24 },
  11: { ay: 'Kasım',   aylik: 108.05, gunluk: 3.60 },
  12: { ay: 'Aralık',  aylik: 215.15, gunluk: 6.94 },
};

export const KDV_ORANI = 0.20;

export const VARSAYILAN_FIYATLAR = {
  kademe1: '',
  kademe2: '',
};

export const AY_ISIMLERI = [
  '', 'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];
