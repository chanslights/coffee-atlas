import type { CoffeeShop, Drink, Temp, Texture, Topping } from '@/types/coffee'

/** 前端 API 客户端：所有和后端的通信都收敛在这个文件里 */

export async function fetchCollection(): Promise<CoffeeShop[]> {
  const res = await fetch('/api/collection')
  if (!res.ok) throw new Error('加载收藏失败')
  return res.json()
}

export interface LayerInput {
  name: string
  color: string
  ratio: number
  texture?: Texture
  annotations: string[]
}

export interface NewDrinkInput {
  shopId?: string
  newShop?: { name: string; city: string }
  drink: {
    name: string
    subtitle: string
    temps: Temp[]
    alcohol: number
    date?: string
    photo?: string
    cardPhoto?: string
    topping?: Topping | null
    layers: LayerInput[]
  }
}

export async function createDrink(payload: NewDrinkInput): Promise<string> {
  const res = await fetch('/api/drinks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error ?? '保存失败')
  return body.id as string
}

/** 上传打卡照片：文件二进制直接作为请求体，文件名走 X-Filename 头 */
export async function uploadPhoto(file: File): Promise<string> {
  const res = await fetch('/api/photos', {
    method: 'POST',
    headers: { 'X-Filename': encodeURIComponent(file.name) },
    body: file,
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error ?? '上传失败')
  return body.path as string
}

export type { Drink }
