import { shops } from '@/data/collection'
import DrinkCard from '@/components/DrinkCard'

/** 首页：我的咖啡收藏夹 */
export default function Home() {
  const totalDrinks = shops.reduce((n, s) => n + s.drinks.length, 0)

  return (
    <div className="min-h-screen bg-[#F3EBD8] px-6 py-10 font-serif">
      {/* 页头 */}
      <header className="mx-auto mb-12 max-w-5xl text-center">
        <h1 className="text-5xl font-bold tracking-wider text-[#2E2823]">咖啡图鉴</h1>
        <p className="mt-3 text-sm tracking-[0.3em] text-[#7A6E5C]">MY COFFEE ATLAS</p>
        <p className="mt-4 text-sm text-[#7A6E5C]">
          已打卡 {shops.length} 家店 · 收集 {totalDrinks} 杯特调
        </p>
      </header>

      {/* 按店铺分组展示 */}
      {shops.map((shop) => (
        <section key={shop.id} className="mx-auto mb-16 max-w-6xl">
          <div className="mb-6 flex items-baseline gap-3 border-b border-[#D8CCAF] pb-3">
            <h2 className="text-2xl font-bold text-[#2E2823]">{shop.name}</h2>
            <span className="text-sm text-[#7A6E5C]">{shop.city}</span>
            <span className="ml-auto text-xs text-[#A2937A]">{shop.drinks.length} 杯已打卡</span>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {shop.drinks.map((drink) => (
              <DrinkCard key={drink.id} drink={drink} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
