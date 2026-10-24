import { useState } from 'react'
import { createPortal } from 'react-dom'
import type { Drink, Temp } from '@/types/coffee'
import LayeredCup from './LayeredCup'

const TEMPS: { key: Temp; label: string }[] = [
  { key: 'ice', label: 'ice' },
  { key: 'hot', label: 'hot' },
  { key: 'warm', label: 'warm' },
]

/** 卡牌正面：温度行 + 标题 + 分层剖面图 + 编辑/删除入口 */
function CardFront({
  drink,
  onEdit,
  onDelete,
}: {
  drink: Drink
  onEdit?: () => void
  onDelete?: () => void
}) {
  return (
    <>
      {/* 顶部行：温度勾选 + 酒精度 */}
      <div className="mb-2 flex items-center justify-between text-[13px] text-[#3A3226]">
        <div className="flex gap-4">
          {TEMPS.map(({ key, label }) => (
            <span key={key} className="flex items-center gap-1.5">
              <span
                className={`inline-flex h-4 w-4 items-center justify-center border border-[#3A3226] text-[11px] leading-none ${
                  drink.temps.includes(key) ? 'bg-[#3A3226] text-[#FAF3E3]' : ''
                }`}
              >
                {drink.temps.includes(key) ? '✓' : ''}
              </span>
              {label}
            </span>
          ))}
        </div>
        <span>{drink.alcohol.toFixed(1)}vol</span>
      </div>

      {/* 标题 */}
      <h2 className="text-center font-serif text-3xl font-bold tracking-wide text-[#2E2823]">
        {drink.name}
      </h2>
      <p className="mb-2 text-center text-[13px] tracking-widest text-[#7A6E5C]">{drink.subtitle}</p>

      {/* 分层剖面图 */}
      <LayeredCup drink={drink} />

      <div className="mt-3 flex items-center justify-between">
        <button
          className="rounded-full px-2 py-0.5 text-[11px] text-[#B8A98C] transition-colors hover:bg-[#E3D8BE] hover:text-[#3A3226]"
          onClick={(e) => {
            e.stopPropagation() // 阻止冒泡，别触发翻面
            onEdit?.()
          }}
        >
          ✏️ 编辑
        </button>
        <p className="text-[11px] tracking-widest text-[#B8A98C]">点击卡片翻面 →</p>
        <button
          className="rounded-full px-2 py-0.5 text-[11px] text-[#B8A98C] transition-colors hover:bg-red-100 hover:text-red-700"
          onClick={(e) => {
            e.stopPropagation()
            onDelete?.()
          }}
        >
          🗑 删除
        </button>
      </div>
    </>
  )
}

/** 卡牌背面：饮料照为主图，实体卡片照以小图钉在角落；点击照片可放大 */
function CardBack({ drink, onZoom }: { drink: Drink; onZoom: (src: string) => void }) {
  const image = drink.photo ?? drink.cardPhoto
  const inset = drink.photo && drink.cardPhoto ? drink.cardPhoto : null // 有主图时的角落小图

  return (
    <div className="relative h-full w-full">
      {image ? (
        <>
          <img
            src={image}
            alt={`${drink.name} 收藏照`}
            className="h-full w-full cursor-zoom-in object-cover"
            onClick={(e) => {
              e.stopPropagation() // 别触发翻面
              onZoom(image)
            }}
          />
          {inset && (
            <img
              src={inset}
              alt={`${drink.name} 实体卡片`}
              className="absolute right-3 top-3 h-20 w-20 cursor-zoom-in rounded-lg border-2 border-[#FAF3E3] object-cover shadow-lg"
              onClick={(e) => {
                e.stopPropagation()
                onZoom(inset)
              }}
            />
          )}
          {/* 底部渐变信息条 */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-5 pb-4 pt-16 text-left">
            <p className="font-serif text-xl font-bold tracking-wide text-[#FAF3E3]">{drink.name}</p>
            <p className="mt-1 text-xs tracking-wider text-[#D8CCAF]">
              {drink.photo ? '饮料打卡照 🥤' : '实体卡片收藏 🃏'}
              {inset ? ' + 实体卡片 🃏' : ''}
              {drink.date ? ` · 打卡于 ${drink.date}` : ''}
            </p>
          </div>
        </>
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-[#7A6E5C]">
          <span className="text-4xl">📷</span>
          <p className="text-sm tracking-widest">还没有实体卡片 / 实物照片</p>
          <p className="text-xs text-[#5C5344]">下次去店里记得拍一张</p>
        </div>
      )}
    </div>
  )
}

/** 可翻面的特调收藏卡：正面图鉴，背面照片 */
export default function DrinkCard({
  drink,
  onEdit,
  onDelete,
}: {
  drink: Drink
  onEdit?: () => void
  onDelete?: () => void
}) {
  const [flipped, setFlipped] = useState(false)
  const [zoom, setZoom] = useState<string | null>(null) // 放大镜里的照片路径

  return (
    // perspective 给容器提供 3D 景深
    <div
      className="cursor-pointer select-none [perspective:1400px]"
      onClick={() => setFlipped((f) => !f)}
    >
      {/* preserve-3d 让正反面在同一 3D 空间旋转 */}
      <div
        className={`relative transition-transform duration-700 [transform-style:preserve-3d] ${
          flipped ? '[transform:rotateY(180deg)]' : ''
        }`}
      >
        {/* 正面：backface-hidden 保证翻到背面时正面不可见 */}
        <div className="rounded-2xl bg-[#FAF3E3] p-6 shadow-[0_2px_12px_rgba(90,70,40,0.12)] [backface-visibility:hidden]">
          <CardFront drink={drink} onEdit={onEdit} onDelete={onDelete} />
        </div>
        {/* 背面：预先旋转 180°，与正面互为镜像 */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl bg-[#2E2823] shadow-[0_2px_12px_rgba(90,70,40,0.25)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <CardBack drink={drink} onZoom={setZoom} />
        </div>
      </div>

      {/* 照片放大镜：用 Portal 挂到 body，避免被翻牌的 3D transform 困住 */}
      {zoom &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex cursor-zoom-out items-center justify-center bg-black/85 p-6"
            onClick={() => setZoom(null)}
          >
            <img src={zoom} alt="放大查看" className="max-h-full max-w-full rounded-xl object-contain shadow-2xl" />
            <p className="absolute bottom-6 text-xs tracking-widest text-white/60">点击任意处关闭</p>
          </div>,
          document.body,
        )}
    </div>
  )
}
