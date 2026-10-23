import type { Drink, Temp } from '@/types/coffee'
import LayeredCup from './LayeredCup'

const TEMPS: { key: Temp; label: string }[] = [
  { key: 'ice', label: 'ice' },
  { key: 'hot', label: 'hot' },
  { key: 'warm', label: 'warm' },
]

/** 一杯特调的完整卡片：温度行 + 标题 + 分层剖面图 */
export default function DrinkCard({ drink }: { drink: Drink }) {
  return (
    <div className="rounded-2xl bg-[#FAF3E3] p-6 shadow-[0_2px_12px_rgba(90,70,40,0.12)] transition-transform hover:-translate-y-1">
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
    </div>
  )
}
