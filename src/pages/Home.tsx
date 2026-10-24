import { useEffect, useMemo, useState } from 'react'
import type { CoffeeShop, Drink } from '@/types/coffee'
import { fetchCollection, updateShop } from '@/api'
import DrinkCard from '@/components/DrinkCard'
import CheckinForm from '@/components/CheckinForm'
import Timeline from '@/components/Timeline'

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
  const [view, setView] = useState<'gallery' | 'timeline'>('gallery')

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
        <div className="mt-5 flex items-center justify-center gap-3">
          {/* 视图切换：收藏墙 / 时间线 */}
          <div className="flex rounded-full border border-[#D8CCAF] text-sm">
            <button
              className={`rounded-l-full px-5 py-2 tracking-widest ${view === 'gallery' ? 'bg-[#2E2823] text-[#FAF3E3]' : 'text-[#7A6E5C]'}`}
              onClick={() => setView('gallery')}
            >
              收藏墙
            </button>
            <button
              className={`rounded-r-full px-5 py-2 tracking-widest ${view === 'timeline' ? 'bg-[#2E2823] text-[#FAF3E3]' : 'text-[#7A6E5C]'}`}
              onClick={() => setView('timeline')}
            >
              时间线
            </button>
          </div>
          <button
            className="rounded-full bg-[#2E2823] px-6 py-2 text-sm tracking-widest text-[#FAF3E3] transition-transform hover:scale-105"
            onClick={() => setShowForm(true)}
          >
            ＋ 新增打卡
          </button>
        </div>
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
      ) : view === 'timeline' ? (
        <Timeline groups={filtered} onSaved={reload} />
      ) : (
        <>
          {filtered.map(({ shop, drinks }) => (
            <section key={shop.id} className="mx-auto mb-16 max-w-6xl">
              <ShopHeader shop={shop} count={drinks.length} onSaved={reload} />
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

/** 店铺分组头：名字 + 城市，"待确认"信息支持用户行内补全 */
function ShopHeader({ shop, count, onSaved }: { shop: CoffeeShop; count: number; onSaved: () => void }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(shop.name)
  const [city, setCity] = useState(shop.city === '待确认' ? '' : shop.city)
  const [err, setErr] = useState('')
  const pending = shop.city === '待确认'

  async function save() {
    setErr('')
    try {
      await updateShop(shop.id, name, city)
      setEditing(false)
      onSaved()
    } catch (e) {
      setErr((e as Error).message)
    }
  }

  if (editing) {
    return (
      <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-[#D8CCAF] pb-3">
        <input
          className="rounded-lg border border-[#D8CCAF] bg-[#FDF8EA] px-3 py-1 text-lg font-bold text-[#2E2823]"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="店名"
        />
        <input
          className="w-32 rounded-lg border border-[#D8CCAF] bg-[#FDF8EA] px-3 py-1 text-sm text-[#2E2823]"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="城市，如 成都"
          autoFocus
        />
        <button className="rounded-full bg-[#2E2823] px-4 py-1 text-xs text-[#FAF3E3]" onClick={save}>
          保存
        </button>
        <button className="text-xs text-[#7A6E5C]" onClick={() => setEditing(false)}>
          取消
        </button>
        {err && <span className="text-xs text-red-700">{err}</span>}
      </div>
    )
  }

  return (
    <div className="mb-6 flex items-baseline gap-3 border-b border-[#D8CCAF] pb-3">
      <h2 className="text-2xl font-bold text-[#2E2823]">{shop.name}</h2>
      {pending ? (
        <button
          className="rounded-full bg-amber-200 px-3 py-0.5 text-xs text-amber-900 transition-colors hover:bg-amber-300"
          onClick={() => setEditing(true)}
        >
          城市待确认 ✏️ 点我填写
        </button>
      ) : (
        <span className="text-sm text-[#7A6E5C]">
          {shop.city}
          <button className="ml-1 text-[#C4B696] hover:text-[#7A6E5C]" title="编辑店铺信息" onClick={() => setEditing(true)}>
            ✏️
          </button>
        </span>
      )}
      <span className="ml-auto text-xs text-[#A2937A]">{count} 杯已打卡</span>
    </div>
  )
}
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
