/**
 * 咖啡图鉴 —— 核心数据模型
 * 一杯特调 = 若干层次(Layer) + 顶部装饰(Topping) + 元信息
 */

/** 饮用温度：冰 / 热 / 温 */
export type Temp = 'ice' | 'hot' | 'warm'

/** 层次纹理：波浪(液体) / 圆点(奶泡) / 纯色 / 冰块 */
export type Texture = 'wave' | 'dots' | 'plain' | 'ice-cubes'

/** 一个风味层次 */
export interface DrinkLayer {
  name: string // 风味名称，如 "日本柚子"
  color: string // 层次颜色，如 "#F2C94C"
  ratio: number // 占液面高度的比例，所有层 ratio 之和 = 1
  texture?: Texture // 默认 'wave'
  side?: 'left' | 'right' // 标注引线放在哪一侧，不填则自动交替
}

/** 顶部装饰物 */
export interface Topping {
  kind: 'citrus-slice' | 'leaf' | 'berry-roll' | 'fruit-bits' | 'dust'
  color: string
  label?: string
}

/** 一杯特调 */
export interface Drink {
  id: string
  name: string // 糯米团子
  subtitle: string // JUJU蜜瓜拼配冷萃
  temps: Temp[] // 可选温度
  alcohol: number // 酒精度，0 表示无酒精
  layers: DrinkLayer[] // 从上到下排列
  topping?: Topping
  photo?: string // 实物打卡照路径（可选）
}

/** 一家咖啡店及其被打卡的特调 */
export interface CoffeeShop {
  id: string
  name: string
  city: string
  drinks: Drink[]
}
