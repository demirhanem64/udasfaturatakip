// UŞAK ili için EPDK tarafından belirlenen aylık/günlük tüketim limitleri (Sm3)
// Kaynak: UDAŞ - https://www.udas.com.tr/konutlarda-kademeli-fiyat-uygulamasi/

export const AYLIK_LIMITLER = {
  1:  { ay: 'Ocak',    aylik: 292.34, gunluk: 9.43,  k1: 10.600615, k2: 18.000000 },
  2:  { ay: 'Şubat',   aylik: 296.99, gunluk: 10.61, k1: 10.600615, k2: 18.000000 },
  3:  { ay: 'Mart',    aylik: 252.67, gunluk: 8.15,  k1: 10.600615, k2: 18.000000 },
  4:  { ay: 'Nisan',   aylik: 199.05, gunluk: 6.64,  k1: 10.625000, k2: 21.067632 },
  5:  { ay: 'Mayıs',   aylik: 106.21, gunluk: 3.43,  k1: 10.625000, k2: 21.124296 },
  6:  { ay: 'Haziran', aylik: 43.10,  gunluk: 1.44,  k1: 10.625000, k2: 21.124296 },
  7:  { ay: 'Temmuz',  aylik: 25.73,  gunluk: 0.83,  k1: 10.625000, k2: 21.124296 },
  8:  { ay: 'Ağustos', aylik: 21.47,  gunluk: 0.69,  k1: 10.625000, k2: 21.124296 },
  9:  { ay: 'Eylül',   aylik: 21.49,  gunluk: 0.72,  k1: 10.625000, k2: 21.124296 },
  10: { ay: 'Ekim',    aylik: 38.41,  gunluk: 1.24,  k1: 10.625000, k2: 21.124296 },
  11: { ay: 'Kasım',   aylik: 108.05, gunluk: 3.60,  k1: 10.625000, k2: 21.124296 },
  12: { ay: 'Aralık',  aylik: 215.15, gunluk: 6.94,  k1: 10.625000, k2: 21.124296 },
};

export const KDV_ORANI = 0.20;

export const AY_ISIMLERI = [
  '', 'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];
