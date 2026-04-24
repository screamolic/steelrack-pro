import React, { useState, useMemo, useEffect } from 'react';
import { Calculator, Box, Ruler, RotateCcw, Wrench, Save, Bookmark, X, Trash2, Copy } from 'lucide-react';
import RackViewer from './components/RackViewer';
import { calculateMaterial, solveDimensions, BahanResult } from './lib/calculator';

type Mode = 'bahan' | 'dimensi';
type UnitType = 'cm' | 'mm' | 'm' | 'in';

export default function App() {
  const [mode, setMode] = useState<Mode>('bahan');
  const [unit, setUnit] = useState<UnitType>('cm');
  
  const [pBatangStr, setPBatangStr] = useState('300');
  const [jBatangStr, setJBatangStr] = useState('10');
  
  const [pStr, setPStr] = useState('100');
  const [lStr, setLStr] = useState('40');
  const [tStr, setTStr] = useState('200');
  const [susunStr, setSusunStr] = useState('4');

  // New states for calculation
  const [ketebalanStr, setKetebalanStr] = useState('1.5');
  const [hargaBatangStr, setHargaBatangStr] = useState('45000');
  const [hargaBautStr, setHargaBautStr] = useState('500');
  const [hargaPlatStr, setHargaPlatStr] = useState('1500');
  const [usePlates, setUsePlates] = useState(true);

  // Saved Results state
  const [savedProjects, setSavedProjects] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('rakBesiSaved') || '[]'); } catch { return []; }
  });
  const [showSaved, setShowSaved] = useState(false);
  const [saveNotif, setSaveNotif] = useState(false);
  const [copyNotif, setCopyNotif] = useState(false);

  const unitFactor = unit === 'mm' ? 0.1 : unit === 'cm' ? 1 : unit === 'm' ? 100 : 2.54;

  const pBatang = (parseFloat(pBatangStr) || 0) * unitFactor;
  const jBatang = parseFloat(jBatangStr) || 0;
  const p = pStr === '' ? null : (parseFloat(pStr) * unitFactor);
  const l = lStr === '' ? null : (parseFloat(lStr) * unitFactor);
  const t = tStr === '' ? null : (parseFloat(tStr) * unitFactor);
  const susun = parseInt(susunStr) || 1;
  const ketebalan = parseFloat(ketebalanStr) || 1.5;
  const hargaBatang = parseFloat(hargaBatangStr) || 0;
  const hargaBaut = parseFloat(hargaBautStr) || 0;
  const hargaPlat = parseFloat(hargaPlatStr) || 0;

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUnit = e.target.value as UnitType;
    if (unit === newUnit) return;
    
    // Convert to CM first
    const cmFactor = unit === 'mm' ? 0.1 : unit === 'm' ? 100 : unit === 'in' ? 2.54 : 1;
    // Then convert to new unit
    const toNewUnitFactor = newUnit === 'mm' ? 10 : newUnit === 'm' ? 0.01 : newUnit === 'in' ? 1/2.54 : 1;
    
    const factor = cmFactor * toNewUnitFactor;
    
    setTStr(tStr && tStr !== '' ? String(+(Number(tStr) * factor).toFixed(2)) : '');
    setPStr(pStr && pStr !== '' ? String(+(Number(pStr) * factor).toFixed(2)) : '');
    setLStr(lStr && lStr !== '' ? String(+(Number(lStr) * factor).toFixed(2)) : '');
    setPBatangStr(pBatangStr && pBatangStr !== '' ? String(+(Number(pBatangStr) * factor).toFixed(2)) : '');
    setUnit(newUnit);
  };

  const results = useMemo(() => {
    if (mode === 'bahan') {
      if (!p || !l || !t || !susun || !pBatang) return null;
      return calculateMaterial(p, l, t, susun, pBatang, ketebalan, hargaBatang, hargaBaut, hargaPlat, usePlates);
    } else {
      if (!jBatang || !pBatang || !susun) return null;
      return solveDimensions(jBatang, pBatang, p, l, t, susun, ketebalan, hargaBatang, hargaBaut, hargaPlat, usePlates);
    }
  }, [mode, pBatang, jBatang, p, l, t, susun, ketebalan, hargaBatang, hargaBaut, hargaPlat, usePlates]);

  const bahanRes = mode === 'bahan' ? results as BahanResult : null;
  const dimensiRes = mode === 'dimensi' ? results as any : null;

  // Final dimensions in cm to push to 3D Viewer
  const finalPCm = mode === 'bahan' ? (p || 0) : (dimensiRes?.p || p || 0);
  const finalLCm = mode === 'bahan' ? (l || 0) : (dimensiRes?.l || l || 0);
  const finalTCm = mode === 'bahan' ? (t || 0) : (dimensiRes?.t || t || 0);
  const canPreview = finalPCm > 0 && finalLCm > 0 && finalTCm > 0 && susun > 0;

  const currentLoad = (results && !results.error && results.loadCapacity) ? results.loadCapacity : 0;
  const currentCost = (results && !results.error && results.cost) ? results.cost : 0;

  const handleSave = () => {
    if (results?.error || !results) return;
    const displayP = +(finalPCm / unitFactor).toFixed(2);
    const displayL = +(finalLCm / unitFactor).toFixed(2);
    const displayT = +(finalTCm / unitFactor).toFixed(2);
    const sisaRaw = results.totalSisa !== undefined ? results.totalSisa : 0;
    
    const newProject = {
      id: Date.now(),
      date: new Date().toLocaleString('id-ID'),
      name: `Rak ${displayP}x${displayL}x${displayT} ${unit} (${susun} Susun)`,
      mode,
      unit,
      sticksNeeded: results.sticksNeeded,
      totalBaut: results.totalBaut,
      totalPlat: results.totalPlat,
      totalSisa: +(sisaRaw / unitFactor).toFixed(2),
      cost: results.cost,
      // bins could be saved but might be too large for extensive history, let's keep it small for now
    };
    
    const updated = [newProject, ...savedProjects];
    setSavedProjects(updated);
    localStorage.setItem('rakBesiSaved', JSON.stringify(updated));
    
    setSaveNotif(true);
    setTimeout(() => setSaveNotif(false), 2000);
  };

  const handleExportText = () => {
    if (results?.error || !results) return;

    const displayP = +(finalPCm / unitFactor).toFixed(2);
    const displayL = +(finalLCm / unitFactor).toFixed(2);
    const displayT = +(finalTCm / unitFactor).toFixed(2);

    let text = `=======================================\n`;
    text += `       LAPORAN STEELRACK PRO\n`;
    text += `=======================================\n\n`;

    text += `[ SPESIFIKASI RAK ]\n`;
    text += `Panjang : ${displayP} ${unit}\n`;
    text += `Lebar   : ${displayL} ${unit}\n`;
    text += `Tinggi  : ${displayT} ${unit}\n`;
    text += `Susun   : ${susun} Level\n`;
    text += `Kapasitas Beban: ~${currentLoad} kg/susun\n\n`;

    text += `[ KEBUTUHAN MATERIAL ]\n`;
    text += `Besi Siku Ukuran  : ${pBatangStr} ${unit}\n`;
    
    let reqSticks = mode === 'bahan' ? bahanRes?.sticksNeeded : dimensiRes?.sticksNeeded;
    let reqBaut = mode === 'bahan' ? bahanRes?.totalBaut : dimensiRes?.totalBaut;
    let reqPlat = mode === 'bahan' ? bahanRes?.totalPlat : dimensiRes?.totalPlat;
    let sisaMat = mode === 'bahan' ? bahanRes?.totalSisa : dimensiRes?.totalSisa;
    let resBins = mode === 'bahan' ? bahanRes?.bins : dimensiRes?.bins;

    text += `Total Besi Siku   : ${reqSticks} batang\n`;
    text += `Total Baut & Mur  : ${reqBaut} set\n`;
    if (usePlates) text += `Total Plat Siku   : ${reqPlat} pcs\n`;
    if (sisaMat !== undefined) {
      text += `Total Sisa Bahan  : ${+(sisaMat / unitFactor).toFixed(2)} ${unit}\n`;
    }
    text += `\n`;

    if (hargaBatang || hargaBaut || (hargaPlat && usePlates)) {
      text += `[ ESTIMASI BIAYA ]\n`;
      if (hargaBatang) text += `Besi Siku  : Rp ${(reqSticks! * hargaBatang).toLocaleString('id-ID')}\n`;
      if (hargaBaut) text += `Baut & Mur : Rp ${(reqBaut! * hargaBaut).toLocaleString('id-ID')}\n`;
      if (hargaPlat && usePlates) text += `Plat Siku  : Rp ${(reqPlat! * hargaPlat).toLocaleString('id-ID')}\n`;
      text += `---------------------------------------\n`;
      text += `Total Biaya: Rp ${currentCost.toLocaleString('id-ID')}\n\n`;
    }

    if (resBins && resBins.length > 0) {
      text += `[ PANDUAN PEMOTONGAN BESI ]\n`;
      resBins.forEach((bin: any, index: number) => {
        const cuts = bin.pattern.map((p: number) => +(p / unitFactor).toFixed(2)).join(', ');
        const rSisa = +(bin.remaining / unitFactor).toFixed(2);
        text += `Batang #${index + 1}: Potong [ ${cuts} ] -> Sisa: ${rSisa} ${unit}\n`;
      });
      text += `\n`;
    }

    text += `=======================================\n`;
    text += `Dihasilkan pada: ${new Date().toLocaleString('id-ID')}\n`;

    try {
      // Copy to clipboard
      navigator.clipboard.writeText(text).catch(err => console.error("Gagal menyalin: ", err));
      
      // Trigger download
      const blob = new Blob([text], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Laporan_Rak_Besi_${new Date().toISOString().slice(0,10)}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setCopyNotif(true);
      setTimeout(() => setCopyNotif(false), 2000);
    } catch (err) {
      console.error("Gagal mendownload: ", err);
    }
  };

  const handleDeleteSaved = (id: number) => {
    const updated = savedProjects.filter(p => p.id !== id);
    setSavedProjects(updated);
    localStorage.setItem('rakBesiSaved', JSON.stringify(updated));
  };

  return (
    <div className="bg-slate-900 text-slate-100 font-sans h-screen w-full flex flex-col overflow-hidden selection:bg-amber-400 selection:text-slate-900">
      {/* Header Bar */}
      <header className="border-b border-slate-700 p-4 lg:p-6 flex flex-col sm:flex-row justify-between items-center shrink-0">
        <div className="text-center sm:text-left flex items-center justify-center sm:justify-start gap-4">
          <img src="/favicon.svg" alt="Logo" className="w-10 h-10 lg:w-12 lg:h-12" />
          <div>
            <h1 className="text-3xl lg:text-4xl font-black tracking-tighter uppercase leading-none">
              SteelRack <span className="text-amber-400">Pro</span>
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-1 uppercase tracking-widest text-left">
              Kalkulasi & Layout Rak Siku
            </p>
          </div>
        </div>
        <div className="flex gap-4 mt-4 sm:mt-0">
          <button onClick={() => setShowSaved(true)} className="text-[10px] uppercase font-black bg-slate-800 text-amber-400 px-4 py-2 hover:bg-slate-700 transition-colors border border-slate-700 flex items-center gap-2 tracking-widest duration-200">
            <Bookmark className="w-3 h-3" /> Disimpan ({savedProjects.length})
          </button>
          <div className="text-center sm:text-right">
            <p className="text-[10px] text-slate-500 uppercase font-bold">Mode Sistem</p>
            <p className="text-lg font-mono leading-none text-amber-400 uppercase font-bold">{mode === 'bahan' ? 'Est. Bahan' : 'Cari Dimensi'}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* Left Sidebar: Inputs */}
        <aside className="col-span-1 lg:col-span-3 border-r border-slate-700 bg-slate-800/50 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
          <div className="flex p-1 bg-slate-900 border border-slate-700 shrink-0">
            <button
              onClick={() => setMode('bahan')}
              className={`flex-1 py-3 text-[10px] font-black tracking-widest uppercase transition-all flex justify-center items-center gap-2 ${mode === 'bahan' ? 'bg-amber-400 text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
            >
               Hitung Bahan
            </button>
            <button
              onClick={() => setMode('dimensi')}
              className={`flex-1 py-3 text-[10px] font-black tracking-widest uppercase transition-all flex justify-center items-center gap-2 ${mode === 'dimensi' ? 'bg-amber-400 text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
            >
               Cari Dimensi
            </button>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
               <h2 className="text-xs font-bold text-amber-400 uppercase tracking-widest">Dimensi Target</h2>
               <select value={unit} onChange={handleUnitChange} className="bg-slate-900 border border-slate-600 outline-none text-xs text-white p-1 appearance-none w-16 text-center font-bold">
                 <option value="mm">mm</option>
                 <option value="cm">cm</option>
                 <option value="m">m</option>
                 <option value="in">in</option>
               </select>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-col">
                <label className="text-[10px] text-slate-400 mb-1 uppercase font-bold flex justify-between">
                  <span>Tinggi (T)</span>
                  {mode === 'dimensi' && <button onClick={() => setTStr('')} className="text-amber-500 hover:text-amber-400" title="Bersihkan"><RotateCcw className="w-3 h-3"/></button>}
                </label>
                <input
                  type="number"
                  value={tStr}
                  onChange={(e) => setTStr(e.target.value)}
                  placeholder={mode === 'dimensi' ? 'Opsional' : '200'}
                  className="bg-slate-900 border border-slate-600 p-2 text-xl font-bold font-mono focus:border-amber-400 outline-none transition-colors text-white placeholder-slate-600"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] text-slate-400 mb-1 uppercase font-bold flex justify-between">
                  <span>Panjang (P)</span>
                  {mode === 'dimensi' && <button onClick={() => setPStr('')} className="text-amber-500 hover:text-amber-400" title="Bersihkan"><RotateCcw className="w-3 h-3"/></button>}
                </label>
                <input
                  type="number"
                  value={pStr}
                  onChange={(e) => setPStr(e.target.value)}
                  placeholder={mode === 'dimensi' ? 'Opsional' : '100'}
                  className="bg-slate-900 border border-slate-600 p-2 text-xl font-bold font-mono focus:border-amber-400 outline-none transition-colors text-white placeholder-slate-600"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] text-slate-400 mb-1 uppercase font-bold flex justify-between">
                  <span>Lebar (L)</span>
                  {mode === 'dimensi' && <button onClick={() => setLStr('')} className="text-amber-500 hover:text-amber-400" title="Bersihkan"><RotateCcw className="w-3 h-3"/></button>}
                </label>
                <input
                  type="number"
                  value={lStr}
                  onChange={(e) => setLStr(e.target.value)}
                  placeholder={mode === 'dimensi' ? 'Opsional' : '40'}
                  className="bg-slate-900 border border-slate-600 p-2 text-xl font-bold font-mono focus:border-amber-400 outline-none transition-colors text-white placeholder-slate-600"
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-4">Komponen & Bahan</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <div className="flex flex-col">
                   <label className="text-[10px] text-slate-400 mb-1 uppercase font-bold">Tingkat / Susun</label>
                   <input
                     type="number"
                     value={susunStr}
                     onChange={(e) => setSusunStr(e.target.value)}
                     className="bg-slate-900 border border-slate-600 p-2 text-xl font-bold font-mono outline-none text-white focus:border-amber-400 transition-colors w-full"
                   />
                 </div>
                 <div className="flex flex-col">
                   <label className="text-[10px] text-slate-400 mb-1 uppercase font-bold">Ketebalan Siku (mm)</label>
                   <input
                     type="number" step="0.1"
                     value={ketebalanStr}
                     onChange={(e) => setKetebalanStr(e.target.value)}
                     className="bg-slate-900 border border-slate-600 p-2 text-xl font-bold font-mono outline-none text-white focus:border-amber-400 transition-colors w-full"
                   />
                 </div>
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] text-slate-400 mb-1 uppercase font-bold">Panjang 1 Batang ({unit})</label>
                <input
                  type="number"
                  value={pBatangStr}
                  onChange={(e) => setPBatangStr(e.target.value)}
                  className="bg-slate-900 border border-slate-600 p-2 text-xl font-bold font-mono outline-none text-white focus:border-amber-400 transition-colors"
                />
              </div>
              {mode === 'dimensi' && (
                <div className="flex flex-col">
                  <label className="text-[10px] text-amber-400 mb-1 uppercase font-bold">Total Batang Dimiliki</label>
                  <input
                    type="number"
                    value={jBatangStr}
                    onChange={(e) => setJBatangStr(e.target.value)}
                    className="bg-slate-900 border border-amber-500 p-2 text-xl font-bold font-mono outline-none text-amber-400 focus:border-amber-400"
                  />
                </div>
              )}
              <div className="flex items-center gap-3 bg-slate-900 border border-slate-600 p-3 mt-2">
                <input
                  type="checkbox"
                  id="usePlates"
                  checked={usePlates}
                  onChange={(e) => setUsePlates(e.target.checked)}
                  className="w-4 h-4 cursor-pointer accent-amber-500"
                />
                <label htmlFor="usePlates" className="text-xs text-slate-300 font-bold uppercase cursor-pointer select-none">
                  Gunakan Plat Siku
                </label>
              </div>
            </div>
          </div>

          <div>
             <h2 className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-4 mt-6">Estimasi Biaya</h2>
             <div className="space-y-4">
                <div className="flex flex-col">
                  <label className="text-[10px] text-slate-400 mb-1 uppercase font-bold">Harga per Batang (Rp)</label>
                  <input
                    type="number"
                    value={hargaBatangStr}
                    onChange={(e) => setHargaBatangStr(e.target.value)}
                    className="bg-slate-900 border border-slate-600 p-2 text-lg font-bold font-mono outline-none text-white focus:border-amber-400 transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-[10px] text-slate-400 mb-1 uppercase font-bold">Harga Baut/pcs</label>
                    <input
                      type="number"
                      value={hargaBautStr}
                      onChange={(e) => setHargaBautStr(e.target.value)}
                      className="bg-slate-900 border border-slate-600 p-2 text-lg font-bold font-mono outline-none text-white focus:border-amber-400 transition-colors"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[10px] text-slate-400 mb-1 uppercase font-bold">Harga Plat/pcs</label>
                    <input
                      type="number"
                      value={hargaPlatStr}
                      onChange={(e) => setHargaPlatStr(e.target.value)}
                      className="bg-slate-900 border border-slate-600 p-2 text-lg font-bold font-mono outline-none text-white focus:border-amber-400 transition-colors"
                    />
                  </div>
                </div>
             </div>
          </div>
        </aside>

        {/* Main Content: 3D Preview */}
        <div className="col-span-1 lg:col-span-6 relative bg-[radial-gradient(#1e293b_1px,transparent_1px)] bg-[size:20px_20px] flex items-center justify-center p-0 lg:p-8 min-h-[400px] lg:min-h-0 border-b lg:border-b-0 border-slate-700">
          <div className="absolute top-6 left-6 border-l-2 border-slate-600 pl-4 z-10 pointer-events-none hidden sm:block">
            <p className="text-[10px] text-slate-500 uppercase font-bold">Render Isometrik</p>
            <p className="text-sm font-mono text-slate-300">Rak Besi Siku</p>
          </div>
          
          <div className="w-full h-full flex flex-col justify-center relative z-0">
             {canPreview ? (
                <RackViewer p={finalPCm} l={finalLCm} t={finalTCm} susun={susun} displayP={+(finalPCm / unitFactor).toFixed(2)} displayL={+(finalLCm / unitFactor).toFixed(2)} displayT={+(finalTCm / unitFactor).toFixed(2)} unit={unit} usePlates={usePlates}/>
             ) : (
                <div className="flex h-full items-center justify-center text-slate-600 font-mono text-sm uppercase tracking-widest font-bold">
                  Menunggu Dimensi Valid...
                </div>
             )}
          </div>
        </div>

        {/* Right Sidebar: Calculations */}
        <aside className="col-span-1 lg:col-span-3 border-l border-slate-700 p-6 flex flex-col overflow-y-auto custom-scrollbar">
          <h2 className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-6">Daftar Material / Hasil</h2>
          
          <div className="space-y-8 flex-1">
            {results?.error ? (
              <div className="border border-red-500/50 bg-red-900/20 p-4">
                 <p className="text-xs text-red-400 font-mono leading-relaxed">{results.error}</p>
              </div>
            ) : (
              <>
                {mode === 'bahan' && bahanRes && (
                  <>
                    <div className="border-b border-slate-700 pb-4">
                      <p className="text-xs text-slate-500 uppercase font-bold">Total Batang Diperlukan</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-5xl font-black italic tracking-tighter text-amber-400">{bahanRes.sticksNeeded}</p>
                        <p className="text-lg font-bold uppercase text-slate-400">Batang</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {usePlates && (
                        <div className="flex flex-col border-b border-slate-700/50 pb-3 mb-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-400 uppercase tracking-wider font-bold">Plat Siku (Corner Plates)</span>
                            <span className="font-mono text-xl font-bold text-slate-200">x {bahanRes.totalPlat}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest text-right">
                            (Susun atas & bawah × 4 sudut × 2 plat)
                          </span>
                        </div>
                      )}
                      <div className="flex flex-col border-b border-slate-700/50 pb-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-400 uppercase tracking-wider font-bold">Sekrup / Baut & Mur</span>
                          <span className="font-mono text-xl font-bold text-slate-200">x {bahanRes.totalBaut}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest text-right">
                          {usePlates && susun >= 2 
                            ? `(Atas/Bawah: 6 baut/sudut, Tengah: 2 baut/sudut)`
                            : usePlates && susun === 1 
                            ? `(6 baut per sudut dengan plat)`
                            : `(2 baut per sudut tanpa plat)`}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-400 uppercase tracking-wider font-bold">Sisa Bahan Keseluruhan</span>
                        <span className="font-mono text-xl font-bold text-slate-200">{bahanRes.totalSisa !== undefined ? +(bahanRes.totalSisa / unitFactor).toFixed(2) : 0} {unit}</span>
                      </div>
                    </div>

                    <div className="bg-slate-800 border-l-2 border-slate-600 p-4 mt-6">
                      <p className="text-[10px] text-slate-400 font-mono mb-2 uppercase font-bold">Detail Potongan Bahan</p>
                      <div className="text-xs text-slate-500 font-mono space-y-2">
                         {bahanRes.bins?.map((bin, i) => (
                           <div key={i} className="border-b border-slate-700/50 pb-2 mb-2 last:border-0 last:pb-0 last:mb-0">
                             <div className="text-slate-300 font-bold mb-1">Batang #{i+1}</div>
                             <div className="flex justify-between items-center text-[10px] sm:text-xs">
                               <span>Potong: [{bin.pattern.map(p => +(p/unitFactor).toFixed(2)).join(', ')}]</span>
                               <span className="text-amber-400 font-bold">Sisa: {+(bin.remaining/unitFactor).toFixed(2)} {unit}</span>
                             </div>
                           </div>
                         ))}
                      </div>
                    </div>
                  </>
                )}

                {mode === 'dimensi' && dimensiRes && (
                  <>
                    <div className="border-b border-slate-700 pb-4">
                      <p className="text-xs text-slate-500 uppercase font-bold">Dimensi Maksimal Diizinkan</p>
                      <div className="mt-4 space-y-2">
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tinggi (T)</span>
                          <span className={`text-3xl font-black italic tracking-tighter ${tStr === '' ? 'text-amber-400' : 'text-slate-300'}`}>{+(dimensiRes.t / unitFactor).toFixed(2)} <span className="text-sm font-normal not-italic tracking-normal text-slate-500">{unit}</span></span>
                        </div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Panjang (P)</span>
                          <span className={`text-3xl font-black italic tracking-tighter ${pStr === '' ? 'text-amber-400' : 'text-slate-300'}`}>{+(dimensiRes.p / unitFactor).toFixed(2)} <span className="text-sm font-normal not-italic tracking-normal text-slate-500">{unit}</span></span>
                        </div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Lebar (L)</span>
                          <span className={`text-3xl font-black italic tracking-tighter ${lStr === '' ? 'text-amber-400' : 'text-slate-300'}`}>{+(dimensiRes.l / unitFactor).toFixed(2)} <span className="text-sm font-normal not-italic tracking-normal text-slate-500">{unit}</span></span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-400 uppercase tracking-wider font-bold">Total Batang Diperlukan</span>
                        <div className="text-right">
                           <span className="font-mono text-xl font-bold text-slate-200">{dimensiRes.sticksNeeded} </span>
                           <span className="text-xs text-slate-500">dari {jBatang}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-400 uppercase tracking-wider font-bold">Sisa Bahan Keseluruhan</span>
                        <span className="font-mono text-xl font-bold text-slate-200">{dimensiRes.totalSisa !== undefined ? +(dimensiRes.totalSisa / unitFactor).toFixed(2) : 0} {unit}</span>
                      </div>
                    </div>
                    
                    <div className="bg-slate-800 p-4 border border-slate-700 mt-4">
                      <p className="text-[10px] text-amber-500 uppercase mb-1 font-bold">Info Kalkulasi</p>
                      <p className="text-xs text-slate-400 mt-2 font-mono leading-relaxed">
                        {dimensiRes.t === pBatang || dimensiRes.l === pBatang || dimensiRes.p === pBatang 
                           ? "Dimensi mentok di batas maksimal ukuran 1 batang besi (tidak disarankan untuk disambung)."
                           : "Dimensi dihitung secara otomatis menggunakan simulasi pemotongan (bin packing) agar menghemat bahan sejauh mungkin."} 
                        Penggunaan spesifik dihitung sejumlah {dimensiRes.sticksNeeded} batang.
                      </p>
                      <button 
                        onClick={() => {
                          setPStr(String(+(dimensiRes.p / unitFactor).toFixed(2)));
                          setLStr(String(+(dimensiRes.l / unitFactor).toFixed(2)));
                          setTStr(String(+(dimensiRes.t / unitFactor).toFixed(2)));
                          setMode('bahan');
                        }}
                        className="mt-4 w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 uppercase tracking-widest text-[10px] flex justify-center items-center transition-colors duration-200"
                      >
                        Gunakan Hasil Ini ke Hitung Bahan
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          <div className="mt-auto pt-6">
             <div className="p-4 border-2 border-dashed border-slate-700">
               <p className="text-[10px] text-slate-500 uppercase text-center font-bold mb-2">Estimasi Biaya</p>
               
               {results && !results.error && mode === 'bahan' && (
                 <div className="space-y-1 mb-4 text-xs font-mono text-slate-400 border-b border-slate-700 pb-3">
                   <div className="flex justify-between"><span>{bahanRes.sticksNeeded}x Besi Siku</span><span>Rp {(bahanRes.sticksNeeded! * hargaBatang).toLocaleString('id-ID')}</span></div>
                   <div className="flex justify-between"><span>{bahanRes.totalBaut}x Baut & Mur</span><span>Rp {(bahanRes.totalBaut! * hargaBaut).toLocaleString('id-ID')}</span></div>
                   {usePlates && <div className="flex justify-between"><span>{bahanRes.totalPlat}x Plat Siku</span><span>Rp {(bahanRes.totalPlat! * hargaPlat).toLocaleString('id-ID')}</span></div>}
                 </div>
               )}
               {results && !results.error && mode === 'dimensi' && (
                 <div className="space-y-1 mb-4 text-xs font-mono text-slate-400 border-b border-slate-700 pb-3">
                   <div className="flex justify-between"><span>{dimensiRes.sticksNeeded}x Besi Siku</span><span>Rp {(dimensiRes.sticksNeeded! * hargaBatang).toLocaleString('id-ID')}</span></div>
                   <div className="flex justify-between"><span>{dimensiRes.totalBaut}x Baut & Mur</span><span>Rp {(dimensiRes.totalBaut! * hargaBaut).toLocaleString('id-ID')}</span></div>
                   {usePlates && <div className="flex justify-between"><span>{dimensiRes.totalPlat}x Plat Siku</span><span>Rp {(dimensiRes.totalPlat! * hargaPlat).toLocaleString('id-ID')}</span></div>}
                 </div>
               )}

               <p className="text-3xl font-black text-center mt-1 text-white">
                 <span className="text-lg">Rp</span>{currentCost.toLocaleString('id-ID')}
               </p>
               {!results?.error && (
                 <div className="flex gap-2 mt-4">
                   <button onClick={handleExportText} className="flex-[3] bg-slate-700 hover:bg-slate-600 text-slate-300 font-black py-3 px-2 uppercase tracking-widest text-[10px] flex justify-center items-center relative transition-colors duration-200">
                     {copyNotif ? <span className="text-amber-400">Diekspor!</span> : <span>Export TXT</span>}
                   </button>
                   <button onClick={handleSave} title="Simpan" className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-900 font-black py-3 px-0 flex justify-center items-center transition-colors duration-200">
                     {saveNotif ? <Bookmark className="w-5 h-5 fill-slate-900 text-slate-900" /> : <Save className="w-5 h-5" />}
                   </button>
                 </div>
               )}
             </div>
          </div>
        </aside>
      </main>

      {/* Footer Bar */}
      <footer className="h-8 bg-amber-400 px-6 flex flex-wrap sm:flex-nowrap items-center justify-between shrink-0 mt-auto">
        <div className="flex gap-4 sm:gap-8 min-w-0">
          <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter truncate">SIAP DIRAKIT</span>
          <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter sm:block hidden truncate">ESTIMASI BEBAN: ~{currentLoad}KG/SUSUN</span>
        </div>
        <span className="text-[10px] font-mono text-slate-900 font-bold uppercase truncate">{canPreview && !results?.error ? 'Status Sistem: Optimal' : 'Status Sistem: Menunggu Input'}</span>
      </footer>

      {/* Saved Projects Modal */}
      {showSaved && (
        <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-slate-800 w-full max-w-2xl text-slate-200 rounded shadow-2xl border border-slate-700 max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50 block">
              <h3 className="font-black text-amber-400 flex items-center gap-2 uppercase tracking-widest"><Bookmark className="w-5 h-5"/> Hasil Tersimpan</h3>
              <button onClick={() => setShowSaved(false)} className="text-slate-400 hover:text-white p-1 bg-slate-800 rounded"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
               {savedProjects.length === 0 ? (
                 <p className="text-slate-500 text-center py-12 font-mono uppercase tracking-widest text-sm">Belum ada hasil yang disimpan.</p>
               ) : (
                 savedProjects.map(proj => (
                   <div key={proj.id} className="bg-slate-900 p-5 rounded flex flex-col sm:flex-row justify-between items-start gap-4 border border-slate-700">
                     <div className="flex-1">
                        <h4 className="font-bold text-white mb-1 uppercase tracking-widest text-sm text-amber-400">{proj.name}</h4>
                        <p className="text-[10px] font-mono text-slate-400 mb-4">{proj.date} &bull; {proj.mode === 'bahan' ? 'Hitung Bahan' : 'Cari Dimensi'}</p>
                        
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
                           <div>
                              <p className="text-slate-500 mb-1">Batang</p>
                              <p className="font-bold text-white text-lg">{proj.sticksNeeded}</p>
                           </div>
                           <div>
                              <p className="text-slate-500 mb-1">Sisa ({proj.unit})</p>
                              <p className="font-bold text-white text-lg">{proj.totalSisa}</p>
                           </div>
                           <div>
                              <p className="text-slate-500 mb-1">Baut/Mur</p>
                              <p className="font-bold text-white text-lg">{proj.totalBaut}</p>
                           </div>
                           <div>
                              <p className="text-slate-500 mb-1">Plat</p>
                              <p className="font-bold text-white text-lg">{proj.totalPlat}</p>
                           </div>
                        </div>
                     </div>
                     <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3">
                        <span className="bg-slate-800 border border-slate-600 px-3 py-1.5 text-xs font-black text-white shrink-0 tracking-widest">
                          Rp {proj.cost?.toLocaleString('id-ID')}
                        </span>
                        <button onClick={() => handleDeleteSaved(proj.id)} className="text-red-400 hover:text-white text-xs flex items-center gap-1 uppercase font-bold tracking-widest bg-red-900/20 px-3 py-1.5 border border-red-900/50 hover:bg-red-900 transition-colors"><Trash2 className="w-3 h-3"/> Hapus</button>
                     </div>
                   </div>
                 ))
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

