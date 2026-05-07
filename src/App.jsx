import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calculator, 
  Settings, 
  ChevronDown, 
  Info, 
  AlertTriangle,
  Save,
  Edit2,
  TrendingUp,
  CreditCard,
  Layers
} from 'lucide-react';
import { 
  format, 
  differenceInDays, 
  eachDayOfInterval, 
  parseISO, 
  addDays
} from 'date-fns';
import { AYLIK_LIMITLER, KDV_ORANI, AY_ISIMLERI } from './constants';

function App() {
  const [limits, setLimits] = useState(() => {
    const saved = localStorage.getItem('udas_limits_v2'); 
    return saved ? JSON.parse(saved) : AYLIK_LIMITLER;
  });

  const [inputs, setInputs] = useState(() => {
    const saved = localStorage.getItem('udas_inputs');
    if (saved) return JSON.parse(saved);
    
    return {
      startDate: format(new Date(), 'yyyy-MM-dd'),
      startIndex: '',
      endDate: format(new Date(), 'yyyy-MM-dd'),
      endIndex: ''
    };
  });

  const [isLimitsOpen, setIsLimitsOpen] = useState(false);
  const [isEditingLimits, setIsEditingLimits] = useState(false);

  useEffect(() => { localStorage.setItem('udas_limits_v2', JSON.stringify(limits)); }, [limits]);
  useEffect(() => { localStorage.setItem('udas_inputs', JSON.stringify(inputs)); }, [inputs]);

  const results = useMemo(() => {
    if (!inputs.startDate || !inputs.endDate || inputs.startIndex === '' || inputs.endIndex === '') return null;
    const start = parseISO(inputs.startDate);
    const end = parseISO(inputs.endDate);
    const totalDays = differenceInDays(end, start) + 1;
    if (totalDays <= 0) return null;
    const totalM3 = parseFloat(inputs.endIndex) - parseFloat(inputs.startIndex);
    if (isNaN(totalM3) || totalM3 < 0) return null;
    const avgDaily = totalM3 / totalDays;
    const dayInterval = eachDayOfInterval({ start, end });
    const monthDistribution = {};
    dayInterval.forEach(day => {
      const monthKey = day.getMonth() + 1;
      monthDistribution[monthKey] = (monthDistribution[monthKey] || 0) + 1;
    });
    const breakdown = Object.entries(monthDistribution).map(([month, days]) => {
      const monthData = limits[month];
      const isAboveLimit = avgDaily > monthData.gunluk;
      const price = isAboveLimit ? parseFloat(monthData.k2) : parseFloat(monthData.k1);
      const consumption = avgDaily * days;
      const cost = consumption * (isNaN(price) ? 0 : price);
      return { month: parseInt(month), monthName: AY_ISIMLERI[month], days, limit: monthData.gunluk, isAboveLimit, price, consumption, cost };
    });
    const subTotal = breakdown.reduce((acc, curr) => acc + curr.cost, 0);
    const kdv = subTotal * KDV_ORANI;
    return { totalDays, totalM3, avgDaily, breakdown, subTotal, kdv, grandTotal: subTotal + kdv };
  }, [inputs, limits]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleLimitChange = (month, field, value) => {
    setLimits(prev => ({ ...prev, [month]: { ...prev[month], [field]: parseFloat(value) || 0 } }));
  };

  return (
    <div className="app-wrapper">
      <header className="header animate-in">
        <div className="header-badge"><TrendingUp size={14} /> UDAŞ AKILLI FATURA TAKİP</div>
        <h1>Doğalgaz Fatura Tahmini</h1>
        <p>Aylık limitler ve güncel birim fiyatlar otomatik olarak her döneme özel hesaplanır.</p>
      </header>

      <main>
        <section className="card animate-in">
          <div className="card-header">
            <div className="card-icon purple"><Calculator size={20} /></div>
            <div><h2 className="card-title">Endeks Bilgileri</h2><p className="card-subtitle">Okuma tarihlerini ve sayaç değerlerini girin</p></div>
          </div>
          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label">İlk Okuma Tarihi</label>
              <input type="date" name="startDate" value={inputs.startDate} onChange={handleInputChange} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">İlk Endeks</label>
              <div className="input-with-unit">
                <input type="number" name="startIndex" value={inputs.startIndex} onChange={handleInputChange} className="form-input" placeholder="0" />
                <span className="input-unit">m³</span>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Son Okuma Tarihi</label>
              <input type="date" name="endDate" value={inputs.endDate} onChange={handleInputChange} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Son Endeks</label>
              <div className="input-with-unit">
                <input type="number" name="endIndex" value={inputs.endIndex} onChange={handleInputChange} className="form-input" placeholder="0" />
                <span className="input-unit">m³</span>
              </div>
            </div>
          </div>
          {results && (
            <div className="stat-grid">
              <div className="stat-box"><div className="stat-label">Toplam Gün</div><div className="stat-value blue">{results.totalDays}</div><div className="stat-unit">GÜN</div></div>
              <div className="stat-box"><div className="stat-label">Toplam Tüketim</div><div className="stat-value purple">{results.totalM3.toFixed(2)}</div><div className="stat-unit">m³</div></div>
              <div className="stat-box"><div className="stat-label">Günlük Ort.</div><div className="stat-value cyan">{results.avgDaily.toFixed(3)}</div><div className="stat-unit">m³/GÜN</div></div>
            </div>
          )}
        </section>

        {results ? (
          <section className="card animate-in">
            <div className="card-header"><div className="card-icon green"><CreditCard size={20} /></div><div><h2 className="card-title">Hesaplama Özeti</h2><p className="card-subtitle">Ay bazlı dağılım ve toplam bedel</p></div></div>
            <div className="period-breakdown">
              {results.breakdown.map((item, idx) => (
                <div key={idx} className="period-item"><div className="period-item-month">{item.monthName}</div><div className="period-item-days">{item.days} GÜN</div><div className="period-item-sub">Limit: {item.limit}</div></div>
              ))}
            </div>
            <div className="divider" />
            {results.breakdown.map((item, idx) => (
              <div key={idx} className={`kademe-row ${item.isAboveLimit ? 'k2' : 'k1'}`}>
                <div className={`kademe-badge ${item.isAboveLimit ? 'k2' : 'k1'}`}>{item.isAboveLimit ? 'K2' : 'K1'}</div>
                <div className="kademe-info"><div className="kademe-title">{item.monthName} Dönemi ({item.days} Gün)</div><div className="kademe-detail">{item.consumption.toFixed(2)} m³ x {item.price.toFixed(4)} TL <span className="tag">{item.isAboveLimit ? 'Limit Üstü' : 'Limit Altı'}</span></div></div>
                <div className="kademe-amount">{item.cost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</div>
              </div>
            ))}
            <div className="divider" />
            <div className="result-total">
              <div className="result-total-amount">{results.grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</div>
              <div style={{fontSize: '12px', color: 'var(--text-muted)'}}>(KDV Dahil, Matrah: {results.subTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL)</div>
            </div>
          </section>
        ) : (
          <div className="alert warning animate-in"><AlertTriangle size={16} /> Lütfen verileri eksiksiz girin.</div>
        )}

        <section className="card animate-in">
          <div className="limits-toggle" onClick={() => setIsLimitsOpen(!isLimitsOpen)}>
            <div className="card-header" style={{ marginBottom: 0 }}><div className="card-icon cyan"><Layers size={20} /></div><div><h2 className="card-title">Aylık Limitler ve Fiyatlar</h2><p className="card-subtitle">UŞAK EPDK limitleri ve birim fiyatları</p></div></div>
            <ChevronDown size={18} />
          </div>
          {isLimitsOpen && (
            <div className="animate-in">
              <div className="divider" />
              <button className={isEditingLimits ? "btn-save" : "edit-limits-btn"} onClick={() => setIsEditingLimits(!isEditingLimits)}>{isEditingLimits ? "Kaydet" : "Düzenle"}</button>
              {isEditingLimits ? (
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '15px', marginTop: '15px'}}>
                  {Object.entries(limits).map(([m, d]) => (
                    <div key={m} style={{padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border)'}}>
                      <div style={{fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--accent-blue)'}}>{d.ay}</div>
                      <div style={{display: 'grid', gap: '8px'}}>
                        <div className="form-group">
                          <label style={{fontSize: '10px', color: 'var(--text-muted)'}}>GÜNLÜK LİMİT</label>
                          <input type="number" step="0.01" value={d.gunluk} onChange={(e) => handleLimitChange(m, 'gunluk', e.target.value)} className="form-input" />
                        </div>
                        <div className="form-group">
                          <label style={{fontSize: '10px', color: 'var(--text-muted)'}}>KADEME 1 (TL)</label>
                          <input type="number" step="0.000001" value={d.k1} onChange={(e) => handleLimitChange(m, 'k1', e.target.value)} className="form-input" />
                        </div>
                        <div className="form-group">
                          <label style={{fontSize: '10px', color: 'var(--text-muted)'}}>KADEME 2 (TL)</label>
                          <input type="number" step="0.000001" value={d.k2} onChange={(e) => handleLimitChange(m, 'k2', e.target.value)} className="form-input" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="limits-table-wrapper">
                  <table className="limits-table">
                    <thead>
                      <tr>
                        <th>AY</th>
                        <th>GÜNLÜK</th>
                        <th>K1 FİYAT</th>
                        <th>K2 FİYAT</th>
                        <th>DURUM</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(limits).map(([m, d]) => (
                        <tr key={m}>
                          <td style={{textAlign: 'left', fontWeight: '600'}}>{d.ay}</td>
                          <td style={{color: 'var(--accent-blue)'}}>{d.gunluk.toFixed(2)}</td>
                          <td style={{color: 'var(--accent-green)'}}>{d.k1.toFixed(4)}</td>
                          <td style={{color: 'var(--accent-orange)'}}>{d.k2.toFixed(4)}</td>
                          <td><span className={`tag ${results && results.avgDaily > d.gunluk ? 'orange' : 'green'}`}>{results && results.avgDaily > d.gunluk ? 'Limit Üstü' : 'Limit Altı'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
export default App;
