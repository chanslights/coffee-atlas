import { useState } from 'react'
import type { CoffeeShop, Temp, Texture } from '@/types/coffee'
import { createDrink, uploadPhoto, type LayerInput } from '@/api'

const TEMP_OPTIONS: { key: Temp; label: string }[] = [
  { key: 'ice', label: 'ice 冰' },
  { key: 'hot', label: 'hot 热' },
  { key: 'warm', label: 'warm 温' },
]

const TEXTURE_OPTIONS: { value: Texture; label: string }[] = [
  { value: 'wave', label: '波浪（液体）' },
  { value: 'dots', label: '圆点（奶泡）' },
  { value: 'plain', label: '纯色' },
  { value: 'ice-cubes', label: '冰块' },
]

const TOPPING_OPTIONS = [
  { value: '', label: '无装饰' },
  { value: 'dust', label: '撒粉（开心果碎/可可粉）' },
  { value: 'leaf', label: '叶片' },
  { value: 'citrus-slice', label: '柑橘片' },
  { value: 'berry-roll', label: '果卷' },
  { value: 'fruit-bits', label: '碎果粒' },
  { value: 'bubble', label: '大气泡' },
] as const

const inputCls =
  'w-full rounded-lg border border-[#D8CCAF] bg-[#FDF8EA] px-3 py-1.5 text-sm text-[#2E2823] outline-none focus:border-[#A2937A]'
const labelCls = 'mb-1 block text-xs tracking-wider text-[#7A6E5C]'

/** 新增打卡表单：填写数据 → POST /api/drinks → 事务写入 SQLite */
export default function CheckinForm({
  shops,
  onCreated,
  onClose,
}: {
  shops: CoffeeShop[]
  onCreated: () => void
  onClose: () => void
}) {
  // 店铺：选已有 or 新建
  const [shopMode, setShopMode] = useState<'existing' | 'new'>('existing')
  const [shopId, setShopId] = useState(shops[0]?.id ?? '')
  const [newShopName, setNewShopName] = useState('')
  const [newShopCity, setNewShopCity] = useState('')

  // 特调基本信息
  const [name, setName] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [temps, setTemps] = useState<Temp[]>(['ice'])
  const [alcohol, setAlcohol] = useState(0)
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))

  // 打卡照片（选中即上传到 public/photos，拿到可访问路径）
  const [photo, setPhoto] = useState('')
  const [uploading, setUploading] = useState(false)

  async function pickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      setPhoto(await uploadPhoto(file))
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  // 层次（动态行）
  const [layers, setLayers] = useState<LayerInput[]>([
    { name: '', color: '#E8D9B0', ratio: 1, texture: 'wave', annotations: [] },
  ])

  // 装饰
  const [toppingKind, setToppingKind] = useState('')
  const [toppingLabel, setToppingLabel] = useState('')
  const [toppingColor, setToppingColor] = useState('#4A5D3A')

  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const ratioSum = layers.reduce((s, l) => s + (l.ratio || 0), 0)

  function updateLayer(i: number, patch: Partial<LayerInput>) {
    setLayers((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)))
  }

  async function submit() {
    setError('')
    if (Math.abs(ratioSum - 1) > 0.01) {
      setError(`所有层次的比例之和必须等于 1（当前 ${ratioSum.toFixed(2)}）`)
      return
    }
    setSubmitting(true)
    try {
      await createDrink({
        shopId: shopMode === 'existing' ? shopId : undefined,
        newShop: shopMode === 'new' ? { name: newShopName, city: newShopCity } : undefined,
        drink: {
          name,
          subtitle,
          temps,
          alcohol,
          date,
          photo: photo || undefined,
          topping: toppingKind
            ? { kind: toppingKind as any, color: toppingColor, label: toppingLabel || undefined }
            : null,
          layers,
        },
      })
      onCreated()
      onClose()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-[#FAF3E3] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-5 text-xl font-bold text-[#2E2823]">☕ 新增打卡</h3>

        {/* 店铺 */}
        <div className="mb-4 flex gap-2">
          <button
            className={`rounded-full px-3 py-1 text-xs ${shopMode === 'existing' ? 'bg-[#2E2823] text-[#FAF3E3]' : 'bg-[#E3D8BE]'}`}
            onClick={() => setShopMode('existing')}
          >
            选已有店铺
          </button>
          <button
            className={`rounded-full px-3 py-1 text-xs ${shopMode === 'new' ? 'bg-[#2E2823] text-[#FAF3E3]' : 'bg-[#E3D8BE]'}`}
            onClick={() => setShopMode('new')}
          >
            新店
          </button>
        </div>
        {shopMode === 'existing' ? (
          <select className={inputCls} value={shopId} onChange={(e) => setShopId(e.target.value)}>
            {shops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.city} · {s.name}
              </option>
            ))}
          </select>
        ) : (
          <div className="flex gap-2">
            <input className={inputCls} placeholder="店名，如 MINDFO" value={newShopName} onChange={(e) => setNewShopName(e.target.value)} />
            <input className={inputCls} placeholder="城市，如 广州" value={newShopCity} onChange={(e) => setNewShopCity(e.target.value)} />
          </div>
        )}

        {/* 基本信息 */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>特调名 *</label>
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="开心果Dirty" />
          </div>
          <div>
            <label className={labelCls}>副标题</label>
            <input className={inputCls} value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Pistachio Dirty" />
          </div>
          <div>
            <label className={labelCls}>酒精度 vol</label>
            <input className={inputCls} type="number" step="0.1" value={alcohol} onChange={(e) => setAlcohol(+e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>打卡日期</label>
            <input className={inputCls} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        <div className="mt-3 flex gap-4">
          {TEMP_OPTIONS.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-1.5 text-sm text-[#3A3226]">
              <input
                type="checkbox"
                checked={temps.includes(key)}
                onChange={() => setTemps((t) => (t.includes(key) ? t.filter((x) => x !== key) : [...t, key]))}
              />
              {label}
            </label>
          ))}
        </div>

        {/* 打卡照片 */}
        <div className="mt-4 flex items-center gap-3">
          <label className="cursor-pointer rounded-full bg-[#E3D8BE] px-4 py-1.5 text-xs text-[#3A3226]">
            {uploading ? '上传中…' : photo ? '换一张照片' : '📷 上传打卡照片'}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={uploading} onChange={pickPhoto} />
          </label>
          {photo && <img src={photo} alt="打卡照片预览" className="h-12 w-12 rounded-lg object-cover shadow-sm" />}
        </div>

        {/* 层次编辑 */}
        <div className="mt-5 border-t border-[#E3D8BE] pt-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-bold text-[#2E2823]">层次（自上而下）</span>
            <span className={`text-xs ${Math.abs(ratioSum - 1) > 0.01 ? 'text-red-700' : 'text-[#7A6E5C]'}`}>
              比例合计 {ratioSum.toFixed(2)} / 1.00
            </span>
          </div>
          {layers.map((l, i) => (
            <div key={i} className="mb-2 rounded-lg border border-[#E3D8BE] p-2">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="h-8 w-10 cursor-pointer rounded border border-[#D8CCAF] bg-transparent"
                  value={l.color}
                  onChange={(e) => updateLayer(i, { color: e.target.value })}
                />
                <input
                  className={inputCls}
                  placeholder={`第 ${i + 1} 层风味名，如 开心果奶酱`}
                  value={l.name}
                  onChange={(e) => updateLayer(i, { name: e.target.value })}
                />
                <input
                  className="w-16 rounded-lg border border-[#D8CCAF] bg-[#FDF8EA] px-2 py-1.5 text-sm"
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  title="比例"
                  value={l.ratio}
                  onChange={(e) => updateLayer(i, { ratio: +e.target.value })}
                />
                <select
                  className="rounded-lg border border-[#D8CCAF] bg-[#FDF8EA] px-1 py-1.5 text-xs"
                  value={l.texture ?? 'wave'}
                  onChange={(e) => updateLayer(i, { texture: e.target.value as Texture })}
                >
                  {TEXTURE_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                {layers.length > 1 && (
                  <button className="text-xs text-red-700" onClick={() => setLayers((ls) => ls.filter((_, j) => j !== i))}>
                    删
                  </button>
                )}
              </div>
              <input
                className={`${inputCls} mt-2`}
                placeholder="同层标注（逗号分隔），如：佛手柑, 伯爵茶"
                value={l.annotations.join(', ')}
                onChange={(e) =>
                  updateLayer(i, { annotations: e.target.value.split(/[,，]/).map((s) => s.trim()).filter(Boolean) })
                }
              />
            </div>
          ))}
          <button
            className="mt-1 rounded-full bg-[#E3D8BE] px-3 py-1 text-xs text-[#3A3226]"
            onClick={() => setLayers((ls) => [...ls, { name: '', color: '#D9C89A', ratio: 0.2, texture: 'wave', annotations: [] }])}
          >
            ＋ 加一层
          </button>
        </div>

        {/* 装饰 */}
        <div className="mt-4 flex items-center gap-2 border-t border-[#E3D8BE] pt-4">
          <select className={inputCls} value={toppingKind} onChange={(e) => setToppingKind(e.target.value)}>
            {TOPPING_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          {toppingKind && (
            <>
              <input
                type="color"
                className="h-8 w-10 cursor-pointer rounded border border-[#D8CCAF] bg-transparent"
                value={toppingColor}
                onChange={(e) => setToppingColor(e.target.value)}
              />
              <input className={inputCls} placeholder="装饰名，如 开心果碎" value={toppingLabel} onChange={(e) => setToppingLabel(e.target.value)} />
            </>
          )}
        </div>

        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button className="rounded-full px-5 py-2 text-sm text-[#7A6E5C]" onClick={onClose}>
            取消
          </button>
          <button
            className="rounded-full bg-[#2E2823] px-5 py-2 text-sm text-[#FAF3E3] disabled:opacity-50"
            disabled={submitting}
            onClick={submit}
          >
            {submitting ? '保存中…' : '打卡！'}
          </button>
        </div>
      </div>
    </div>
  )
}
