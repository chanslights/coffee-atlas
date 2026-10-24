import { useState } from 'react'
import type { CoffeeShop, Drink, Temp, Texture } from '@/types/coffee'
import { createDrink, updateDrinkFull, uploadPhoto, type LayerInput } from '@/api'

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

/**
 * 打卡表单（双模式）：
 *  - 无 editTarget：新增打卡（POST /api/drinks）
 *  - 有 editTarget：整体编辑（POST /api/drinks/update-full，店铺不可改）
 */
export default function CheckinForm({
  shops,
  onCreated,
  onClose,
  editTarget,
}: {
  shops: CoffeeShop[]
  onCreated: () => void
  onClose: () => void
  editTarget?: { drink: Drink; shopId: string }
}) {
  const editing = !!editTarget
  const init = editTarget?.drink

  // 店铺：选已有 or 新建（编辑模式下锁定）
  const [shopMode, setShopMode] = useState<'existing' | 'new'>('existing')
  const [shopId, setShopId] = useState(editTarget?.shopId ?? shops[0]?.id ?? '')
  const [newShopName, setNewShopName] = useState('')
  const [newShopCity, setNewShopCity] = useState('')

  // 特调基本信息
  const [name, setName] = useState(init?.name ?? '')
  const [subtitle, setSubtitle] = useState(init?.subtitle ?? '')
  const [temps, setTemps] = useState<Temp[]>(init?.temps ?? ['ice'])
  const [alcohol, setAlcohol] = useState(init?.alcohol ?? 0)
  const [date, setDate] = useState(init?.date ?? new Date().toISOString().slice(0, 10))
  const [frosted, setFrosted] = useState(init?.frosted ?? false)

  // 打卡照片（photo = 饮料照，cardPhoto = 卡片照）
  const [photo, setPhoto] = useState(init?.photo ?? '')
  const [cardPhoto, setCardPhoto] = useState(init?.cardPhoto ?? '')
  const [uploading, setUploading] = useState<'' | 'photo' | 'cardPhoto'>('')

  function pickPhoto(kind: 'photo' | 'cardPhoto') {
    return async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      setUploading(kind)
      setError('')
      try {
        const path = await uploadPhoto(file)
        if (kind === 'photo') setPhoto(path)
        else setCardPhoto(path)
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setUploading('')
      }
    }
  }

  // 层次（动态行）
  const [layers, setLayers] = useState<LayerInput[]>(
    init?.layers.map((l) => ({
      name: l.name,
      color: l.color,
      ratio: l.ratio,
      texture: l.texture ?? 'wave',
      annotations: l.annotations ?? [],
    })) ?? [{ name: '', color: '#E8D9B0', ratio: 1, texture: 'wave', annotations: [] }],
  )

  // 装饰
  const [toppingKind, setToppingKind] = useState(init?.topping?.kind ?? '')
  const [toppingLabel, setToppingLabel] = useState(init?.topping?.label ?? '')
  const [toppingColor, setToppingColor] = useState(init?.topping?.color ?? '#4A5D3A')

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
      const drink = {
        name,
        subtitle,
        temps,
        alcohol,
        date,
        photo: photo || undefined,
        cardPhoto: cardPhoto || undefined,
        frosted,
        topping: toppingKind
          ? { kind: toppingKind as any, color: toppingColor, label: toppingLabel || undefined }
          : null,
        layers,
      }
      if (editing) {
        await updateDrinkFull(editTarget.drink.id, drink)
      } else {
        await createDrink({
          shopId: shopMode === 'existing' ? shopId : undefined,
          newShop: shopMode === 'new' ? { name: newShopName, city: newShopCity } : undefined,
          drink,
        })
      }
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
        <h3 className="mb-5 text-xl font-bold text-[#2E2823]">{editing ? '✏️ 编辑打卡' : '☕ 新增打卡'}</h3>

        {/* 店铺（编辑模式下锁定展示） */}
        {editing ? (
          <p className="mb-1 text-sm text-[#7A6E5C]">
            店铺：{shops.find((s) => s.id === shopId)?.city} · {shops.find((s) => s.id === shopId)?.name}
          </p>
        ) : (
          <>
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
          </>
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
          <label className="flex items-center gap-1.5 text-sm text-[#3A3226]">
            <input type="checkbox" checked={frosted} onChange={() => setFrosted((f) => !f)} />
            🧊 冰霜杯
          </label>
        </div>

        {/* 打卡照片：饮料照与卡片照分开上传 */}
        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="cursor-pointer rounded-full bg-[#E3D8BE] px-4 py-1.5 text-xs text-[#3A3226]">
              {uploading === 'photo' ? '上传中…' : photo ? '换饮料照' : '🥤 饮料照'}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={uploading !== ''} onChange={pickPhoto('photo')} />
            </label>
            {photo && <img src={photo} alt="饮料照预览" className="h-12 w-12 rounded-lg object-cover shadow-sm" />}
          </div>
          <div className="flex items-center gap-2">
            <label className="cursor-pointer rounded-full bg-[#E3D8BE] px-4 py-1.5 text-xs text-[#3A3226]">
              {uploading === 'cardPhoto' ? '上传中…' : cardPhoto ? '换卡片照' : '🃏 卡片照'}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={uploading !== ''} onChange={pickPhoto('cardPhoto')} />
            </label>
            {cardPhoto && <img src={cardPhoto} alt="卡片照预览" className="h-12 w-12 rounded-lg object-cover shadow-sm" />}
          </div>
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
            {submitting ? '保存中…' : editing ? '保存修改' : '打卡！'}
          </button>
        </div>
      </div>
    </div>
  )
}
