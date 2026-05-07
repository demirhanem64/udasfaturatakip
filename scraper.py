import requests
from bs4 import BeautifulSoup
import re
import os

URL = "https://www.udas.com.tr/dogalgaz-satis-fiyatlari/"

def get_latest_prices():
    try:
        print("UDAŞ fiyatları taranıyor...")
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(URL, headers=headers, timeout=30)
        response.encoding = 'utf-8'
        soup = BeautifulSoup(response.text, 'html.parser')
        
        extracted_data = {} # {month_idx: {'k1': price, 'k2': price}}
        
        # Sayfadaki her KADEME bölümünü ayrı ayrı işle
        # UDAŞ sitesinde KADEME 1 ve KADEME 2 genellikle ayrı başlıklardır
        tables = soup.find_all('table')
        
        for table in tables:
            # Tablonun üstündeki başlığa bakarak K1 mi K2 mi olduğunu anla
            prev_text = ""
            for sibling in table.find_previous_siblings(['h1','h2','h3','h4','p','strong']):
                prev_text = sibling.get_text(strip=True).upper()
                if "KADEME" in prev_text:
                    break
            
            current_kademe = "k1" if "KADEME 1" in prev_text else ("k2" if "KADEME 2" in prev_text else None)
            if not current_kademe: continue
            
            rows = table.find_all('tr')
            if not rows: continue
            
            # Başlık satırından "Satış Fiyatı TL/Sm3" kolonunu bul
            target_idx = -1
            header_cols = [c.get_text(strip=True).upper() for c in rows[0].find_all(['th', 'td'])]
            for i, h in enumerate(header_cols):
                if "SATIŞ" in h and "TL/SM3" in h:
                    target_idx = i
                    break
            
            if target_idx == -1: continue
            
            for row in rows[1:]:
                cols = row.find_all('td')
                if len(cols) > target_idx:
                    period_text = cols[0].get_text(strip=True)
                    # 2026 yılı ve ay ismini ara
                    if "2026" in period_text:
                        month_match = re.search(r'(Ocak|Şubat|Mart|Nisan|Mayıs|Haziran|Temmuz|Ağustos|Eylül|Ekim|Kasım|Aralık)', period_text, re.I)
                        if month_match:
                            month_name = month_match.group(1).capitalize()
                            month_idx = ["", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"].index(month_name)
                            
                            # Tüketim aralığı "0-100.000" olanı seç (Evsel tüketim)
                            range_text = cols[1].get_text(strip=True)
                            if "0-100.000" in range_text:
                                val_text = cols[target_idx].get_text(strip=True).replace(',', '.')
                                try:
                                    price = float(val_text)
                                    if month_idx not in extracted_data: extracted_data[month_idx] = {}
                                    extracted_data[month_idx][current_kademe] = price
                                    print(f"BAŞARILI: {month_name} 2026 {current_kademe.upper()} -> {price}")
                                except:
                                    continue
        return extracted_data
    except Exception as e:
        print(f"Hata: {e}")
        return None

def apply_updates(data):
    if not data: return
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()
    
    # Verileri index.html içindeki AYLIK_LIMITLER yapısına işle
    for m, p in data.items():
        for k, v in p.items():
            # Regex: m_idx: { ... k_key: 12.34 ... } yapısını yakala
            pattern = rf"({m}:\s+{{.*?{k}:\s+)[\d\.]+"
            html = re.sub(pattern, rf"\g<1>{v:.6f}", html, flags=re.DOTALL)
    
    # Cache temizlemek için versiyonu artır
    v_match = re.search(r"udas_limits_v(\d+)", html)
    if v_match:
        old_v = int(v_match.group(1))
        html = html.replace(f"udas_limits_v{old_v}", f"udas_limits_v{old_v + 1}")

    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("index.html güncellendi.")

if __name__ == "__main__":
    latest = get_latest_prices()
    if latest:
        apply_updates(latest)
