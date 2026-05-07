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
        
        # Sayfadaki tüm başlıkları ve tabloları bul
        sections = soup.find_all(['h1', 'h2', 'h3', 'h4', 'strong', 'p'])
        
        current_kademe = None
        for element in soup.find_all(True): # Tüm elementleri sırayla gez
            text = element.get_text(strip=True).upper()
            
            if "KADEME 1" in text:
                current_kademe = "k1"
            elif "KADEME 2" in text:
                current_kademe = "k2"
                
            if element.name == 'table' and current_kademe:
                rows = element.find_all('tr')
                header_row = rows[0]
                cols_headers = [c.get_text(strip=True) for c in header_row.find_all(['th', 'td'])]
                
                # "Satış Fiyatı TL/Sm3" kolonunun indeksini bul
                target_col_idx = -1
                for i, h in enumerate(cols_headers):
                    if "SATIŞ" in h.upper() and "TL/SM3" in h.upper():
                        target_col_idx = i
                        break
                
                if target_col_idx == -1: continue # Kolon bulunamadıysa geç
                
                for row in rows[1:]:
                    cols = row.find_all('td')
                    if len(cols) > target_col_idx:
                        row_text = cols[0].get_text(strip=True)
                        # 2026 yılını ara
                        if "2026" in row_text:
                            # Ay ismini bul
                            month_match = re.search(r'(Ocak|Şubat|Mart|Nisan|Mayıs|Haziran|Temmuz|Ağustos|Eylül|Ekim|Kasım|Aralık)', row_text, re.I)
                            if month_match:
                                month_name = month_match.group(1).capitalize()
                                month_idx = ["", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"].index(month_name)
                                
                                # 0-100.000 aralığını kontrol et
                                range_text = cols[1].get_text(strip=True)
                                if "0-100.000" in range_text:
                                    price_val = cols[target_col_idx].get_text(strip=True).replace(',', '.')
                                    try:
                                        final_price = float(price_val)
                                        if month_idx not in extracted_data: extracted_data[month_idx] = {}
                                        extracted_data[month_idx][current_kademe] = final_price
                                        print(f"Bulundu: {month_name} 2026 {current_kademe.upper()} -> {final_price}")
                                    except:
                                        continue
        return extracted_data
    except Exception as e:
        print(f"Tarama hatası: {e}")
        return None

def apply_updates(new_data):
    if not new_data: return
    
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()
    
    # AYLIK_LIMITLER bloğunu güncelle
    for m_idx, prices in new_data.items():
        for k_key, val in prices.items():
            # Regex ile k1: 10.600615 veya k2: 20.828826 gibi alanları yakala
            pattern = rf"({m_idx}:\s+{{.*?{k_key}:\s+)[\d\.]+"
            replacement = rf"\g<1>{val:.6f}"
            html = re.sub(pattern, replacement, html, flags=re.DOTALL)
    
    # Versiyonu artır ki cache temizlensin
    html = re.sub(r"udas_limits_v\d+", "udas_limits_v" + str(int(re.search(r"udas_limits_v(\d+)", html).group(1)) + 1), html)

    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("index.html başarıyla güncellendi.")

if __name__ == "__main__":
    data = get_latest_prices()
    if data:
        apply_updates(data)
    else:
        print("Güncel veri bulunamadı.")
