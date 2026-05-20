'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Plus, X, Trash2, AlertCircle, CheckCircle, ChevronDown, ChevronUp, Layers } from 'lucide-react';

interface Item { id: string; sku: string; name: string; uom: string; stock: number; itemType: string; }
interface BOMLine { materialId: string; quantityPerUnit: number; uom: string; material?: { sku: string; name: string; uom: string; stock: number; }; }
interface BOM {
  id: string; bomCode: string; description: string; active: boolean;
  finishedGood: { sku: string; name: string; uom: string; };
  finishedGoodId: string;
  lines: BOMLine[];
}

const emptyLine = (): BOMLine => ({ materialId: '', quantityPerUnit: 1, uom: 'pcs' });

export default function BOMPage() {
  const [boms, setBoms] = useState<BOM[]>([]);
  const [fgItems, setFgItems] = useState<Item[]>([]);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Modal
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [selectedFgId, setSelectedFgId] = useState('');
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState<BOMLine[]>([emptyLine()]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bomRes, itemRes] = await Promise.all([
        api.get('/production/boms', { params: { limit: 100 } }),
        api.get('/inventory/items', { params: { limit: 200 } }),
      ]);
      setBoms(bomRes.data.data || []);
      const items: Item[] = itemRes.data.data || [];
      setAllItems(items);
      setFgItems(items.filter((i) => i.itemType === 'finished_good'));
    } catch {
      setBoms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // FG items with active BOM
  const fgWithBom = new Set(boms.filter((b) => b.active).map((b) => b.finishedGoodId));
  const fgWithoutBom = fgItems.filter((fg) => !fgWithBom.has(fg.id));
  const rawMaterials = allItems.filter((i) => i.itemType === 'raw_material');

  function openModal(fgId = '') {
    setSelectedFgId(fgId);
    setDescription('');
    setLines([emptyLine()]);
    setFormError('');
    setModal(true);
  }

  function setLine(i: number, patch: Partial<BOMLine>) {
    setLines((prev) => prev.map((l, idx) => {
      if (idx !== i) return l;
      const updated = { ...l, ...patch };
      if (patch.materialId) {
        const mat = allItems.find((it) => it.id === patch.materialId);
        if (mat) updated.uom = mat.uom;
      }
      return updated;
    }));
  }

  async function save() {
    setFormError('');
    if (!selectedFgId) return setFormError('Pilih item Barang Jadi terlebih dahulu.');
    if (lines.some((l) => !l.materialId || l.quantityPerUnit <= 0)) return setFormError('Semua baris material harus diisi.');
    setSaving(true);
    try {
      await api.post('/production/boms', {
        finishedGoodId: selectedFgId,
        description,
        lines: lines.map((l) => ({ materialId: l.materialId, quantityPerUnit: l.quantityPerUnit, uom: l.uom })),
      });
      setModal(false);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(msg || 'Gagal membuat BOM.');
    } finally { setSaving(false); }
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bill of Materials</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Komposisi bahan baku untuk setiap produk jadi</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={16} />Buat BOM
        </button>
      </div>

      {/* FG items without BOM */}
      {!loading && fgWithoutBom.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={16} className="text-amber-600 dark:text-amber-400" />
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
              {fgWithoutBom.length} item Barang Jadi belum punya BOM aktif
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {fgWithoutBom.map((fg) => (
              <button
                key={fg.id}
                onClick={() => openModal(fg.id)}
                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700 rounded-xl text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors"
              >
                <Plus size={12} />
                {fg.name} <span className="text-amber-400 dark:text-amber-600">({fg.sku})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {!loading && fgItems.length === 0 && (
        <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada item bertipe <strong>Barang Jadi</strong> di Inventory.</p>
          <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">Buka Inventory → edit item → ubah tipe ke &quot;Barang Jadi&quot; terlebih dahulu.</p>
        </div>
      )}

      {/* BOM list */}
      <div className="space-y-3">
        {loading && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-5 py-10 text-center text-gray-300 dark:text-gray-700 text-sm">
            Memuat...
          </div>
        )}
        {!loading && boms.length === 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-5 py-10 text-center text-gray-300 dark:text-gray-700 text-sm">
            Belum ada BOM
          </div>
        )}
        {boms.map((bom) => {
          const isOpen = expanded === bom.id;
          return (
            <div key={bom.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : bom.id)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors text-left"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Layers size={16} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 dark:text-white text-sm">{bom.finishedGood.name}</span>
                      <span className="font-mono text-xs text-gray-400 dark:text-gray-600">{bom.bomCode}</span>
                      {bom.active
                        ? <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 font-medium"><CheckCircle size={10} />Aktif</span>
                        : <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500 font-medium">Nonaktif</span>
                      }
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">
                      {bom.finishedGood.sku} · {bom.lines.length} material
                      {bom.description && ` · ${bom.description}`}
                    </p>
                  </div>
                </div>
                {isOpen ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
              </button>

              {isOpen && (
                <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-4">
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wide mb-3">Komposisi Material</p>
                  <div className="space-y-2">
                    {bom.lines.map((line, i) => (
                      <div key={i} className="flex items-center justify-between py-2 px-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                        <div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{line.material?.name}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-600 ml-2">{line.material?.sku}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="font-semibold text-gray-700 dark:text-gray-300">{line.quantityPerUnit} {line.uom}</span>
                          <span className={`px-2 py-0.5 rounded-full font-medium ${(line.material?.stock ?? 0) > 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400'}`}>
                            stok: {line.material?.stock ?? 0}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <button
                      onClick={() => openModal(bom.finishedGoodId)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      + Buat BOM baru untuk item ini (akan menonaktifkan yang lama)
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-start justify-center p-4 pt-8 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-xl border border-gray-100 dark:border-gray-800 mb-8">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Layers size={16} className="text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Buat BOM</h3>
              </div>
              <button onClick={() => setModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Finished Good */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Barang Jadi (Finished Good) *</label>
                <select
                  value={selectedFgId}
                  onChange={(e) => setSelectedFgId(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Pilih item Barang Jadi...</option>
                  {fgItems.map((fg) => (
                    <option key={fg.id} value={fg.id}>
                      {fg.name} ({fg.sku}) {!fgWithBom.has(fg.id) ? '⚠ Belum ada BOM' : ''}
                    </option>
                  ))}
                </select>
                {fgItems.length === 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Belum ada item Barang Jadi. Set itemType ke &quot;finished_good&quot; di Inventory terlebih dahulu.</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Deskripsi</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contoh: Resep standar v1.0"
                  className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Material lines */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Komposisi Bahan Baku *</label>
                  <button onClick={() => setLines((p) => [...p, emptyLine()])}
                    className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
                    <Plus size={12} />Tambah Material
                  </button>
                </div>

                {rawMaterials.length === 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">Belum ada item Bahan Baku. Set itemType ke &quot;raw_material&quot; di Inventory.</p>
                )}

                <div className="space-y-2">
                  {lines.map((line, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-6">
                        <select value={line.materialId} onChange={(e) => setLine(i, { materialId: e.target.value })}
                          className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option value="">Pilih bahan baku...</option>
                          {allItems.filter((it) => it.itemType === 'raw_material').map((it) => (
                            <option key={it.id} value={it.id}>{it.name} ({it.sku}) — stok: {it.stock}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-3">
                        <input type="number" min={0.001} step={0.001} value={line.quantityPerUnit}
                          onChange={(e) => setLine(i, { quantityPerUnit: Number(e.target.value) })}
                          placeholder="Qty"
                          className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div className="col-span-2">
                        <input value={line.uom} onChange={(e) => setLine(i, { uom: e.target.value })}
                          placeholder="UOM"
                          className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <button onClick={() => setLines((p) => p.filter((_, idx) => idx !== i))}
                          disabled={lines.length === 1}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-30">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {formError && (
                <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400">
                  {formError}
                </div>
              )}
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
              <button onClick={() => setModal(false)}
                className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Batal
              </button>
              <button onClick={save} disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-sm font-medium transition-colors disabled:opacity-60">
                {saving ? 'Menyimpan...' : 'Simpan BOM'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
