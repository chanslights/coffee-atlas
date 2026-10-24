import type { CoffeeShop, Drink } from '@/types/coffee'
import LayeredCup from './LayeredCup'

interface Entry {
  drink: Drink
  shopName: string
  city: string
}

/** 打卡时间线：按月份分组、日期倒序（对应 SQL: ORDER BY date DESC, GROUP BY 月份） */
export default function Timeline({ groups }: { groups: { shop: CoffeeShop; drinks: Drink[] }[] }) {
  // 拍平成 (特调, 店名, 城市) 记录
  const entries: Entry[] = groups.flatMap(({ shop, drinks }) =>
    drinks.map((drink) => ({ drink, shopName: shop.name, city: shop.city })),
  )

  // 有日期的按日期倒序，没日期的沉底
  const dated = entries.filter((e) => e.drink.date).sort((a, b) => b.drink.date!.localeCompare(a.drink.date!))
  const undated = entries.filter((e) => !e.drink.date)

  // 按 YYYY-MM 分桶
  const buckets = new Map<string, Entry[]>()
  for (const e of dated) {
    const month = e.drink.date!.slice(0, 7)
    if (!buckets.has(month)) buckets.set(month, [])
    buckets.get(month)!.push(e)
  }
  if (undated.length) buckets.set('未记录日期', undated)

  return (
    <div className="mx-auto max-w-3xl">
      {[...buckets.entries()].map(([month, list]) => (
        <section key={month} className="relative pl-8">
          {/* 时间轴竖线 */}
          <div className="absolute bottom-0 left-2 top-2 w-px bg-[#D8CCAF]" />
          {/* 月份标题 */}
          <h3 className="relative mb-4 mt-8 text-lg font-bold tracking-widest text-[#2E2823]">
            <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 border-[#2E2823] bg-[#F3EBD8]" />
            {month === '未记录日期' ? month : `${month.replace('-', ' 年 ')} 月`}
            <span className="ml-3 text-xs font-normal text-[#A2937A]">{list.length} 杯</span>
          </h3>
          {/* 该月的打卡记录 */}
          <div className="space-y-4 pb-2">
            {list.map(({ drink, shopName, city }) => (
              <div
                key={drink.id}
                className="flex items-center gap-4 rounded-2xl bg-[#FAF3E3] p-4 shadow-[0_2px_10px_rgba(90,70,40,0.10)]"
              >
                <div className="w-16 shrink-0">
                  <LayeredCup drink={drink} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-bold text-[#2E2823]">{drink.name}</p>
                  <p className="truncate text-xs tracking-wider text-[#7A6E5C]">
                    {city} · {shopName}
                  </p>
                  <p className="mt-1 text-xs text-[#A2937A]">
                    {drink.layers.map((l) => l.name).join(' / ')}
                  </p>
                </div>
                <div className="shrink-0 text-right text-xs text-[#A2937A]">
                  {drink.date && <p className="mb-1 rounded-full bg-[#E3D8BE] px-2 py-0.5">{drink.date.slice(5)}</p>}
                  <p>{drink.cardPhoto ? '🃏' : ''}{drink.photo ? '📷' : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
