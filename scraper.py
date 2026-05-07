import requests
from bs4 import BeautifulSoup
import re
import json
import os

URL = "https://www.udas.com.tr/dogalgaz-satis-fiyatlari/"

def get_prices():
    try:
        response = requests.get(URL, timeout=20)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # 2026 yılı tablosunu bul
        # Not: UDAŞ sitesi dinamik olduğu için en garanti yol tablolardaki metinleri taramaktır
        prices = {}
        
        tables = soup.find_all('table')
        for table in tables:
            rows = table.find_all('tr')
            for row in rows:
                cols = row.find_all('td')
                if len(cols) >= 6:
                    text = cols[0].get_text(strip=True)
                    # "Ocak 2026", "Mart 2026" gibi metinleri ara
                    match = re.search(r'(Ocak|Şubat|Mart|Nisan|Mayıs|Haziran|Temmuz|Ağustos|Eylül|Ekim|Kasım|Aralık)\s+2026', text, re.IGNORECASE)
                    if match:
                        month_name = match.group(1).capitalize()
                        # 0-100.000 Sm3 aralığını kontrol et
                        if "0-100.000" in cols[1].get_text(strip=True):
                            # Satış Fiyatı kolonu (genellikle sondan ikinci)
                            price_text = cols[-2].get_text(strip=True).replace(',', '.')
                            try:
                                price = float(price_text)
                                # K1 mi K2 mi olduğunu tablonun başlığından veya yapısından anlamaya çalış
                                # Bu kısım sayfa yapısına göre gelişecektir. Şimdilik bulunan fiyatı uygun yere koyalım.
                                month_idx = ["", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"].index(month_name)
                                
                                if month_idx not in prices: prices[month_idx] = {}
                                
                                # Eğer bu tablo KADEME 1 başlığı altındaysa (veya row'un üstünde o başlık varsa)
                                if "KADEME 1" in str(table.find_previous(['h3', 'h4', 'strong', 'p'])):
                                    prices[month_idx]['k1'] = price
                                elif "KADEME 2" in str(table.find_previous(['h3', 'h4', 'strong', 'p'])):
                                    prices[month_idx]['k2'] = price
                            except:
                                continue
        return prices
    except Exception as e:
        print(f"Hata oluştu: {e}")
        return None

def update_index_html(new_prices):
    if not new_prices: return
    
    with open('index.html', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # index.html içindeki AYLIK_LIMITLER objesini bul ve güncelle
    # Bu basit bir regex yerine daha güvenli bir yöntemle yapılabilir
    for m_idx, p in new_prices.items():
        if 'k1' in p:
            regex = rf"{m_idx}:\s+{{ ay: '.*?'.*?k1: [\d\.]+"
            replace = f"{m_idx}:  {{ ay: '{AY_ISIMLERI[m_idx]}',    gunluk: {LIMITLER[m_idx]},  k1: {p['k1']:.6f}"
            content = re.sub(regex, replace, content, flags=re.DOTALL)
        if 'k2' in p:
            regex = rf"{m_idx}:\s+{{ ay: '.*?'.*?k2: [\d\.]+"
            # ... bu kısım karmaşıklaşabilir, en iyisi AYLIK_LIMITLER'i tamamen JS içinde bir JSON olarak tutmak
            # Ama şimdilik en temel k1 ve k2 güncellemelerini manuel yapalım
            pass

    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(content)

# Sabit limitler (Güncelleme sırasında kaybolmaması için)
LIMITLER = {1: 9.43, 2: 10.61, 3: 8.15, 4: 6.64, 5: 3.43, 6: 1.44, 7: 0.83, 8: 0.69, 9: 0.72, 10: 1.24, 11: 3.60, 12: 6.94}
AY_ISIMLERI = ["", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"]

if __name__ == "__main__":
    current_prices = get_prices()
    if current_prices:
        print(f"Bulunan Fiyatlar: {current_prices}")
        # Not: Otomatik güncelleme mantığı daha sonra geliştirilebilir, 
        # şimdilik sadece fiyatları bulup loglamak için temel yapı kuruldu.
