import { useEffect, useMemo, useState } from 'react'
import type { CoffeeShop, Drink } from '@/types/coffee'
import { fetchCollection } from '@/api'
import DrinkCard from '@/components/DrinkCard'
import CheckinForm from '@/components/CheckinForm'

/** 一杯特调的所有可检索文本：名字 + 副标题 + 每层风味名 + 标注 */
function searchableText(drink: Drink): string {
  return [
    drink.name,
    drink.subtitle,
    drink.topping?.label ?? '',
    ...drink.layers.flatMap((l) => [l.name, ...(l.annotations ?? [])]),
  ].join(' ')
}

/** 首页：收藏夹 + 城市/风味筛选 + 新增打卡 */
export default function Home() {
  // —— 数据来自 SQLite（不再是写死的代码文件）——
  const [shops, setShops] = useState<CoffeeShop[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  async function reload() {
    setShops(await fetchCollection())
    setLoading(false)
  }
  useEffect(() => {
    reload()
  }, [])

  // —— 查询条件（相当于 SQL 的绑定参数）——
  const [city, setCity] = useState<string | null>(null)
  const [keyword, setKeyword] = useState('')

  const cities = useMemo(() => [...new Set(shops.map((s) => s.city))], [shops])

  const filtered: { shop: CoffeeShop; drinks: Drink[] }[] = useMemo(() => {
    const kw = keyword.trim()
    return shops
      .filter((s) => !city || s.city === city)
      .map((s) => ({
        shop: s,
        drinks: kw ? s.drinks.filter((d) => searchableText(d).includes(kw)) : s.drinks,
      }))
      .filter((g) => g.drinks.length > 0)
  }, [shops, city, keyword])

  const totalDrinks = shops.reduce((n, s) => n + s.drinks.length, 0)
  const matchedDrinks = filtered.reduce((n, g) => n + g.drinks.length, 0)
  const filtering = city !== null || keyword.trim() !== ''

  return (
    <div className="min-h-screen bg-[#F3EBD8] px-6 py-10 font-serif">
      {/* 页头 */}
      <header className="mx-auto mb-8 max-w-5xl text-center">
        <h1 className="text-5xl font-bold tracking-wider text-[#2E2823]">咖啡图鉴</h1>
        <p className="mt-3 text-sm tracking-[0.3em] text-[#7A6E5C]">MY COFFEE ATLAS</p>
        <p className="mt-4 text-sm text-[#7A6E5C]">
          {filtering
            ? `命中 ${matchedDrinks} 杯特调`
            : `已打卡 ${shops.length} 家店 · 收集 ${totalDrinks} 杯特调`}
        </p>
        <button
          className="mt-5 rounded-full bg-[#2E2823] px-6 py-2 text-sm tracking-widest text-[#FAF3E3] transition-transform hover:scale-105"
          onClick={() => setShowForm(true)}
        >
          ＋ 新增打卡
        </button>
      </header>

      {/* 筛选栏 */}
      <div className="mx-auto mb-12 flex max-w-5xl flex-col items-center gap-4">
        <div className="flex flex-wrap justify-center gap-2">
          <FilterChip active={city === null} onClick={() => setCity(null)}>
            全部
          </FilterChip>
          {cities.map((c) => (
            <FilterChip key={c} active={city === c} onClick={() => setCity(city === c ? null : c)}>
              {c}
            </FilterChip>
          ))}
        </div>
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜风味试试：伯爵茶 / 蜜瓜 / 奶盖…"
          className="w-72 rounded-full border border-[#D8CCAF] bg-[#FAF3E3] px-5 py-2 text-sm text-[#2E2823] placeholder-[#B8A98C] outline-none focus:border-[#A2937A]"
        />
      </div>

      {/* 内容区 */}
      {loading ? (
        <p className="py-20 text-center text-sm text-[#A2937A]">正在从数据库加载收藏…</p>
      ) : (
        <>
          {filtered.map(({ shop, drinks }) => (
            <section key={shop.id} className="mx-auto mb-16 max-w-6xl">
              <div className="mb-6 flex items-baseline gap-3 border-b border-[#D8CCAF] pb-3">
                <h2 className="text-2xl font-bold text-[#2E2823]">{shop.name}</h2>
                <span className="text-sm text-[#7A6E5C]">{shop.city}</span>
                <span className="ml-auto text-xs text-[#A2937A]">{drinks.length} 杯已打卡</span>
              </div>
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {drinks.map((drink) => (
                  <DrinkCard key={drink.id} drink={drink} />
                ))}
              </div>
            </section>
          ))}
          {filtered.length === 0 && (
            <p className="py-20 text-center text-sm text-[#A2937A]">没有找到匹配的特调，换个关键词试试？</p>
          )}
        </>
      )}

      {/* 新增打卡弹窗 */}
      {showForm && <CheckinForm shops={shops} onCreated={reload} onClose={() => setShowForm(false)} />}
    </div>
  )
}

/** 筛选按钮（chip）：选中态反色 */
function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-sm tracking-wider transition-colors ${
        active
          ? 'border-[#2E2823] bg-[#2E2823] text-[#FAF3E3]'
          : 'border-[#D8CCAF] bg-transparent text-[#7A6E5C] hover:border-[#A2937A]'
      }`}
    >
      {children}
    </button>
  )
}
