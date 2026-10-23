import { useState } from 'react'
import type { Drink, Temp } from '@/types/coffee'
import LayeredCup from './LayeredCup'

const TEMPS: { key: Temp; label: string }[] = [
  { key: 'ice', label: 'ice' },
  { key: 'hot', label: 'hot' },
  { key: 'warm', label: 'warm' },
]

/** 卡牌正面：温度行 + 标题 + 分层剖面图 */
function CardFront({ drink }: { drink: Drink }) {
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

      <p className="mt-3 text-center text-[11px] tracking-widest text-[#B8A98C]">点击卡片翻面 →</p>
    </>
  )
}

/** 卡牌背面：实体卡片照 / 实物打卡照 + 打卡信息 */
function CardBack({ drink }: { drink: Drink }) {
  const image = drink.cardPhoto ?? drink.photo
  const label = drink.cardPhoto ? '实体卡片收藏' : '实物打卡照'

  return (
    <div className="relative h-full w-full">
      {image ? (
        <>
          <img src={image} alt={`${drink.name} ${label}`} className="h-full w-full object-cover" />
          {/* 底部渐变信息条 */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-5 pb-4 pt-16 text-left">
            <p className="font-serif text-xl font-bold tracking-wide text-[#FAF3E3]">{drink.name}</p>
            <p className="mt-1 text-xs tracking-wider text-[#D8CCAF]">
              {label} 📷{drink.date ? ` · 打卡于 ${drink.date}` : ''}
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
export default function DrinkCard({ drink }: { drink: Drink }) {
  const [flipped, setFlipped] = useState(false)

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
          <CardFront drink={drink} />
        </div>
        {/* 背面：预先旋转 180°，与正面互为镜像 */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl bg-[#2E2823] shadow-[0_2px_12px_rgba(90,70,40,0.25)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <CardBack drink={drink} />
        </div>
      </div>
    </div>
  )
}
