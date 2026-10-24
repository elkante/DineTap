import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { TableNfcTag, NfcStatus } from '../../types';
import { 
  checkWebNfcSupport, 
  writeNfcUrlPayload, 
  generateQrDataUrl 
} from '../../utils/nfc';
import { 
  Nfc, 
  QrCode, 
  Printer, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw, 
  Copy, 
  Check, 
  Smartphone,
  ChevronLeft
} from 'lucide-react';

export const NfcQrManager: React.FC = () => {
  const { 
    activeRestaurant, 
    registerTableTag, 
    updateTableStatus, 
    replaceDamagedTag, 
    simulateNfcTap,
    setCurrentView,
    showNotification 
  } = useApp();

  const [selectedTable, setSelectedTable] = useState<TableNfcTag | null>(activeRestaurant.tables[0] || null);
  const [qrCodeMap, setQrCodeMap] = useState<Record<string, string>>({});
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false);
  const [isWriteNfcModalOpen, setIsWriteNfcModalOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [printPreviewMode, setPrintPreviewMode] = useState(false);

  // Form states
  const [newTableNum, setNewTableNum] = useState('');
  const [newTableLabel, setNewTableLabel] = useState('');
  const [newTableSection, setNewTableSection] = useState('Main Dining');
  const [newNfcSerial, setNewNfcSerial] = useState('');
  const [replacementSerial, setReplacementSerial] = useState('');
  const [nfcWriteStatus, setNfcWriteStatus] = useState<{ loading: boolean; msg: string; error?: boolean } | null>(null);

  const nfcSupport = checkWebNfcSupport();

  // Generate QR code data URL for all tables
  useEffect(() => {
    let isMounted = true;
    const generateAll = async () => {
      const map: Record<string, string> = {};
      for (const tbl of activeRestaurant.tables) {
        try {
          map[tbl.id] = await generateQrDataUrl(tbl.urlPayload);
        } catch (e) {
          console.warn('QR generation error', tbl.tableNumber, e);
        }
      }
      if (isMounted) {
        setQrCodeMap(map);
      }
    };
    generateAll();
    return () => {
      isMounted = false;
    };
  }, [activeRestaurant.tables]);

  const handleCopyPayload = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    showNotification('URL copied to clipboard');
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handleRegisterTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNum.trim()) return;

    registerTableTag(
      newTableNum.trim(),
      newTableLabel.trim() || `${newTableNum} Stand`,
      newTableSection,
      newNfcSerial.trim()
    );

    setNewTableNum('');
    setNewTableLabel('');
    setNewNfcSerial('');
    setIsRegisterModalOpen(false);
  };

  const handleConfirmReplacement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable || !replacementSerial.trim()) return;

    replaceDamagedTag(selectedTable.id, replacementSerial.trim());
    setSelectedTable(prev => prev ? { ...prev, ntagSerial: replacementSerial.trim(), nfcStatus: 'active' } : null);
    setIsReplaceModalOpen(false);
    setReplacementSerial('');
  };

  const handleDirectWebNfcWrite = async () => {
    if (!selectedTable) return;
    setNfcWriteStatus({ loading: true, msg: 'Hold phone against Digital Card chip...' });

    const result = await writeNfcUrlPayload(selectedTable.urlPayload);
    if (result.success) {
      setNfcWriteStatus({ loading: false, msg: result.message });
      showNotification('Digital Card written successfully!');
    } else {
      setNfcWriteStatus({ loading: false, msg: result.message, error: true });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentView('flipbook')}
            className="p-1.5 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-neutral-600 shrink-0"
            title="Back to menu"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-neutral-900">QR & Digital Table Cards</h1>
            <p className="text-[11px] text-neutral-500">{activeRestaurant.name} · {activeRestaurant.tables.length} Tables</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPrintPreviewMode(!printPreviewMode)}
            className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-semibold flex items-center gap-1"
          >
            <Printer className="w-3.5 h-3.5 text-neutral-600" />
            <span className="hidden xs:inline">{printPreviewMode ? 'Exit' : 'Print'}</span>
          </button>

          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Add Table</span>
          </button>
        </div>
      </div>

      {/* PRINT VIEW */}
      {printPreviewMode ? (
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between no-print text-xs">
            <span className="font-semibold text-amber-900">Print Table Tent Cards & Labels</span>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-neutral-900 text-white rounded-lg font-bold flex items-center gap-1"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" /> Print Now
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeRestaurant.tables.map((tbl) => (
              <div
                key={tbl.id}
                className="bg-white border-2 border-neutral-800 rounded-2xl p-5 text-center flex flex-col items-center justify-between min-h-[320px] break-inside-avoid"
              >
                <div>
                  <div className="text-2xl mb-1">{activeRestaurant.logo}</div>
                  <h3 className="font-extrabold text-sm text-neutral-900">{activeRestaurant.name}</h3>
                </div>

                <div className="my-2 px-3 py-1 bg-neutral-900 text-white font-mono text-xs font-bold rounded-md">
                  {tbl.tableNumber}
                </div>

                <div className="w-32 h-32 bg-neutral-50 p-2 rounded-xl border border-neutral-200 flex items-center justify-center my-1">
                  {qrCodeMap[tbl.id] ? (
                    <img src={qrCodeMap[tbl.id]} alt={tbl.tableNumber} className="w-full h-full object-contain" />
                  ) : (
                    <QrCode className="w-20 h-20 text-neutral-400" />
                  )}
                </div>

                <div className="pt-2 border-t border-neutral-200 w-full text-[10px] space-y-0.5">
                  <div className="font-bold text-neutral-900 flex items-center justify-center gap-1">
                    <Nfc className="w-3.5 h-3.5 text-amber-600" />
                    <span>TAP PHONE HERE OR SCAN QR</span>
                  </div>
                  <div className="text-neutral-400">UID: {tbl.ntagSerial}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* MOBILE-FIRST TABLES LIST & QUICK ACTIONS */
        <div className="space-y-3">
          {activeRestaurant.tables.map((tbl) => {
            const isSelected = selectedTable?.id === tbl.id;
            return (
              <div
                key={tbl.id}
                onClick={() => setSelectedTable(tbl)}
                className={`bg-white rounded-2xl border p-4 shadow-xs transition-all ${
                  isSelected ? 'border-amber-500 ring-1 ring-amber-500' : 'border-neutral-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-900 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      {tbl.tableNumber.replace('Table ', 'T')}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-neutral-900 flex items-center gap-2">
                        <span>{tbl.tableNumber}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                          tbl.nfcStatus === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {tbl.nfcStatus}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-500">{tbl.label} · {tbl.section}</div>
                    </div>
                  </div>

                  {/* Scan/Tap Counts */}
                  <div className="text-right text-[11px] font-mono text-neutral-500">
                    <span className="font-bold text-amber-800">{tbl.totalTaps}</span> taps
                  </div>
                </div>

                {/* Details Accordion / Actions when selected */}
                {isSelected && (
                  <div className="mt-3 pt-3 border-t border-neutral-100 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-neutral-500 font-mono bg-neutral-50 p-2 rounded-lg">
                      <span>Digital Card UID:</span>
                      <span className="font-bold text-neutral-800">{tbl.ntagSerial}</span>
                    </div>

                    {/* QR Code Preview */}
                    {qrCodeMap[tbl.id] && (
                      <div className="flex items-center gap-3 p-2 bg-neutral-50 rounded-xl border border-neutral-200/80">
                        <img src={qrCodeMap[tbl.id]} alt={`QR ${tbl.tableNumber}`} className="w-16 h-16 object-contain bg-white p-1 rounded-lg border border-neutral-200" />
                        <div className="text-[10px] text-neutral-600 min-w-0 flex-1">
                          <div className="font-bold text-neutral-900 mb-0.5">Scannable QR Destination</div>
                          <div className="break-all font-mono text-neutral-500 line-clamp-2">{tbl.urlPayload}</div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 xs:grid-cols-4 gap-1.5">
                      <button
                        onClick={() => simulateNfcTap(tbl.tableNumber)}
                        className="py-2 px-2 bg-neutral-900 text-white rounded-xl text-[11px] font-bold text-center"
                      >
                        ⚡ Test Tap
                      </button>

                      <button
                        onClick={() => setIsWriteNfcModalOpen(true)}
                        className="py-2 px-2 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-[11px] font-bold text-center"
                      >
                        Write NFC
                      </button>

                      <button
                        onClick={() => handleCopyPayload(tbl.urlPayload)}
                        className="py-2 px-2 bg-neutral-100 text-neutral-700 rounded-xl text-[11px] font-medium text-center"
                      >
                        {copiedUrl ? 'Copied!' : 'Copy URL'}
                      </button>

                      <button
                        onClick={() => setIsReplaceModalOpen(true)}
                        className="py-2 px-2 bg-neutral-100 text-neutral-700 rounded-xl text-[11px] font-medium text-center"
                      >
                        Replace Tag
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Register New Table */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-neutral-200">
            <h3 className="text-sm font-bold text-neutral-900 mb-1">Add Table & Tag</h3>
            <p className="text-[11px] text-neutral-500 mb-3">Generates permanent QR code and NFC payload.</p>

            <form onSubmit={handleRegisterTable} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Table Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Table 06"
                  value={newTableNum}
                  onChange={(e) => setNewTableNum(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Label</label>
                <input
                  type="text"
                  placeholder="e.g. Patio Booth"
                  value={newTableLabel}
                  onChange={(e) => setNewTableLabel(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-3 py-1.5 text-neutral-600 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 text-white font-bold rounded-xl text-xs shadow-xs"
                >
                  Save Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Replace Damaged Tag */}
      {isReplaceModalOpen && selectedTable && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-neutral-200">
            <h3 className="text-sm font-bold text-neutral-900 mb-1">Replace Tag for {selectedTable.tableNumber}</h3>
            <p className="text-[11px] text-neutral-500 mb-3">
              Assign a new Digital Card UID serial. The table URL remains identical.
            </p>

            <form onSubmit={handleConfirmReplacement} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">New Tag Serial UID *</label>
                <input
                  type="text"
                  required
                  placeholder="04:AB:12:CD:34:EF:56"
                  value={replacementSerial}
                  onChange={(e) => setReplacementSerial(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl font-mono focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsReplaceModalOpen(false)}
                  className="px-3 py-1.5 text-neutral-600 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 text-white font-bold rounded-xl text-xs shadow-xs"
                >
                  Activate Replacement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Write NFC Tag */}
      {isWriteNfcModalOpen && selectedTable && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-neutral-200 text-xs">
            <h3 className="text-sm font-bold text-neutral-900 mb-1">Program {selectedTable.tableNumber} Tag</h3>
            <p className="text-[11px] text-neutral-500 mb-3">Permanent NDEF URL payload:</p>

            <div className="p-2.5 bg-neutral-100 rounded-xl font-mono text-[10px] break-all mb-3 text-neutral-700">
              {selectedTable.urlPayload}
            </div>

            {nfcSupport.supported ? (
              <button
                onClick={handleDirectWebNfcWrite}
                className="w-full py-2.5 bg-neutral-900 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow mb-2"
              >
                <Nfc className="w-4 h-4 text-amber-400" />
                <span>Write via Web NFC Now</span>
              </button>
            ) : null}

            {nfcWriteStatus && (
              <div className="p-2 text-[11px] text-center font-medium bg-neutral-100 rounded-lg mb-2">
                {nfcWriteStatus.msg}
              </div>
            )}

            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-[11px] text-neutral-600 space-y-1">
              <div className="font-bold text-neutral-800">Or use free "NFC Tools" app:</div>
              <div>1. Copy the URL payload above.</div>
              <div>2. Open NFC Tools → Write → Add Record → URL.</div>
              <div>3. Hold phone against Digital Card to write!</div>
            </div>

            <div className="flex justify-end pt-3 border-t border-neutral-100 mt-3">
              <button
                onClick={() => {
                  setIsWriteNfcModalOpen(false);
                  setNfcWriteStatus(null);
                }}
                className="px-4 py-2 bg-neutral-100 text-neutral-700 font-bold rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
