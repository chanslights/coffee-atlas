/**
 * 咖啡图鉴 API —— 挂在 Vite 开发服务器里的迷你后端
 * 数据库：Node 24 内置 node:sqlite（零依赖），文件存于 server/coffee.db
 *
 * 表结构（DBA 视角：一层一个表，标注是层的子表 —— 标准的一对多建模）：
 *   shops ──< drinks ──< layers ──< layer_annotations
 */
import { DatabaseSync } from 'node:sqlite'
import path from 'node:path'
import fs from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { shops as seedShops } from '../src/data/collection'
import type { CoffeeShop, Drink, DrinkLayer, Temp, Texture, Topping } from '../src/types/coffee'

const DB_PATH = path.join(import.meta.dirname, 'coffee.db')
const db = new DatabaseSync(DB_PATH)

db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS shops (
    id   TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    city TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS drinks (
    id            TEXT PRIMARY KEY,
    shop_id       TEXT NOT NULL REFERENCES shops(id),
    name          TEXT NOT NULL,
    subtitle      TEXT NOT NULL DEFAULT '',
    temps         TEXT NOT NULL DEFAULT '[]',  -- JSON 数组
    alcohol       REAL NOT NULL DEFAULT 0,
    photo         TEXT,
    card_photo    TEXT,
    date          TEXT,
    topping_kind  TEXT,
    topping_color TEXT,
    topping_label TEXT,
    position      INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS layers (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    drink_id TEXT NOT NULL REFERENCES drinks(id),
    name     TEXT NOT NULL,
    color    TEXT NOT NULL,
    ratio    REAL NOT NULL,
    texture  TEXT,
    side     TEXT,
    position INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS layer_annotations (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    layer_id INTEGER NOT NULL REFERENCES layers(id),
    text     TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0
  );
`)

// —— schema 演进（DDL migration）：给已存在的库补新列 ——
// 新装的环境走上面的 CREATE TABLE 已包含全部列？不——CREATE IF NOT EXISTS 不会改老表，
// 所以用 PRAGMA 检查列是否存在，缺则 ALTER TABLE 补上
const drinkCols = db.prepare('PRAGMA table_info(drinks)').all() as { name: string }[]
if (!drinkCols.some((c) => c.name === 'frosted')) {
  db.exec('ALTER TABLE drinks ADD COLUMN frosted INTEGER NOT NULL DEFAULT 0')
  console.log('[coffee-api] migration: drinks 表新增 frosted 列（冰霜杯）')
}

/** 首次启动：把 collection.ts 里的收藏灌进数据库（种子数据） */
function seed() {
  const row = db.prepare('SELECT COUNT(*) AS n FROM shops').get() as { n: number }
  if (row.n > 0) return
  const insShop = db.prepare('INSERT INTO shops (id, name, city) VALUES (?, ?, ?)')
  const insDrink = db.prepare(
    `INSERT INTO drinks (id, shop_id, name, subtitle, temps, alcohol, photo, card_photo, date,
                         topping_kind, topping_color, topping_label, frosted, position)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
  const insLayer = db.prepare(
    'INSERT INTO layers (drink_id, name, color, ratio, texture, side, position) VALUES (?, ?, ?, ?, ?, ?, ?)',
  )
  const insAnno = db.prepare('INSERT INTO layer_annotations (layer_id, text, position) VALUES (?, ?, ?)')

  db.exec('BEGIN')
  try {
    for (const shop of seedShops) {
      insShop.run(shop.id, shop.name, shop.city)
      shop.drinks.forEach((d, di) => {
        insDrink.run(
          d.id, shop.id, d.name, d.subtitle, JSON.stringify(d.temps), d.alcohol,
          d.photo ?? null, d.cardPhoto ?? null, d.date ?? null,
          d.topping?.kind ?? null, d.topping?.color ?? null, d.topping?.label ?? null,
          d.frosted ? 1 : 0, di,
        )
        d.layers.forEach((l, li) => {
          const { lastInsertRowid } = insLayer.run(d.id, l.name, l.color, l.ratio, l.texture ?? null, l.side ?? null, li)
          ;(l.annotations ?? []).forEach((t, ai) => insAnno.run(Number(lastInsertRowid), t, ai))
        })
      })
    }
    db.exec('COMMIT')
    console.log('[coffee-api] 种子数据已导入 SQLite')
  } catch (e) {
    db.exec('ROLLBACK')
    throw e
  }
}
seed()

/** SELECT：JOIN 出完整的嵌套收藏结构（与 CoffeeShop[] 类型对齐） */
export function queryCollection(): CoffeeShop[] {
  const shopRows = db.prepare('SELECT * FROM shops ORDER BY rowid').all() as any[]
  const drinkRows = db.prepare('SELECT * FROM drinks ORDER BY position').all() as any[]
  const layerRows = db.prepare('SELECT * FROM layers ORDER BY position').all() as any[]
  const annoRows = db.prepare('SELECT * FROM layer_annotations ORDER BY position').all() as any[]

  return shopRows.map((s) => ({
    id: s.id,
    name: s.name,
    city: s.city,
    drinks: drinkRows
      .filter((d) => d.shop_id === s.id)
      .map((d): Drink => {
        const topping: Topping | undefined = d.topping_kind
          ? { kind: d.topping_kind, color: d.topping_color, label: d.topping_label ?? undefined }
          : undefined
        return {
          id: d.id,
          name: d.name,
          subtitle: d.subtitle,
          temps: JSON.parse(d.temps) as Temp[],
          alcohol: d.alcohol,
          photo: d.photo ?? undefined,
          cardPhoto: d.card_photo ?? undefined,
          date: d.date ?? undefined,
          frosted: !!d.frosted,
          topping,
          layers: layerRows
            .filter((l) => l.drink_id === d.id)
            .map((l): DrinkLayer => {
              const annotations = annoRows.filter((a) => a.layer_id === l.id).map((a) => a.text)
              return {
                name: l.name,
                color: l.color,
                ratio: l.ratio,
                texture: (l.texture ?? undefined) as Texture | undefined,
                side: l.side ?? undefined,
                annotations: annotations.length ? annotations : undefined,
              }
            }),
        }
      }),
  }))
}

interface NewDrinkPayload {
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
    frosted?: boolean
    topping?: Topping | null
    layers: { name: string; color: string; ratio: number; texture?: string; annotations?: string[] }[]
  }
}

/** INSERT：一杯新特调（店铺 upsert + 四层表写入，包在一个事务里） */
function insertDrink(p: NewDrinkPayload): string {
  if (!p.drink.name.trim()) throw new Error('特调名字不能为空')
  if (!p.shopId && !p.newShop?.name.trim()) throw new Error('必须选择或新建一家店')
  if (!p.drink.layers.length || !p.drink.layers.every((l) => l.name.trim())) throw new Error('至少要有一层且每层要有名字')

  const shopId = p.shopId ?? `shop-${Date.now()}`
  const drinkId = `drink-${Date.now()}`

  db.exec('BEGIN')
  try {
    if (p.newShop) {
      db.prepare('INSERT INTO shops (id, name, city) VALUES (?, ?, ?)').run(
        shopId, p.newShop.name.trim(), p.newShop.city.trim() || '未知城市',
      )
    }
    const pos = (db.prepare('SELECT COUNT(*) AS n FROM drinks WHERE shop_id = ?').get(shopId) as { n: number }).n
    db.prepare(
      `INSERT INTO drinks (id, shop_id, name, subtitle, temps, alcohol, photo, card_photo, date,
                           topping_kind, topping_color, topping_label, frosted, position)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      drinkId, shopId, p.drink.name.trim(), p.drink.subtitle.trim(), JSON.stringify(p.drink.temps),
      p.drink.alcohol, p.drink.photo || null, p.drink.cardPhoto || null, p.drink.date || null,
      p.drink.topping?.kind ?? null, p.drink.topping?.color ?? null, p.drink.topping?.label ?? null,
      p.drink.frosted ? 1 : 0, pos,
    )
    const insLayer = db.prepare('INSERT INTO layers (drink_id, name, color, ratio, texture, position) VALUES (?, ?, ?, ?, ?, ?)')
    const insAnno = db.prepare('INSERT INTO layer_annotations (layer_id, text, position) VALUES (?, ?, ?)')
    p.drink.layers.forEach((l, li) => {
      const { lastInsertRowid } = insLayer.run(drinkId, l.name, l.color, l.ratio, l.texture ?? null, li)
      ;(l.annotations ?? []).filter(Boolean).forEach((t, ai) => insAnno.run(Number(lastInsertRowid), t, ai))
    })
    db.exec('COMMIT')
    return drinkId
  } catch (e) {
    db.exec('ROLLBACK')
    throw e
  }
}

/** UPDATE：整体编辑一杯特调（主表改字段，层次子表删了重插，事务保证） */
function updateDrinkFull(id: string, d: NewDrinkPayload['drink']) {
  if (!d.name.trim()) throw new Error('特调名字不能为空')
  if (!d.layers.length || !d.layers.every((l) => l.name.trim())) throw new Error('至少要有一层且每层要有名字')
  const exists = db.prepare('SELECT id FROM drinks WHERE id = ?').get(id)
  if (!exists) throw new Error('特调不存在')

  db.exec('BEGIN')
  try {
    db.prepare(
      `UPDATE drinks SET name = ?, subtitle = ?, temps = ?, alcohol = ?, photo = ?, card_photo = ?, date = ?,
                         topping_kind = ?, topping_color = ?, topping_label = ?, frosted = ?
       WHERE id = ?`,
    ).run(
      d.name.trim(), d.subtitle.trim(), JSON.stringify(d.temps), d.alcohol,
      d.photo || null, d.cardPhoto || null, d.date || null,
      d.topping?.kind ?? null, d.topping?.color ?? null, d.topping?.label ?? null,
      d.frosted ? 1 : 0, id,
    )
    // 子表重建：先删干净再按新数据插入
    db.prepare('DELETE FROM layer_annotations WHERE layer_id IN (SELECT id FROM layers WHERE drink_id = ?)').run(id)
    db.prepare('DELETE FROM layers WHERE drink_id = ?').run(id)
    const insLayer = db.prepare('INSERT INTO layers (drink_id, name, color, ratio, texture, position) VALUES (?, ?, ?, ?, ?, ?)')
    const insAnno = db.prepare('INSERT INTO layer_annotations (layer_id, text, position) VALUES (?, ?, ?)')
    d.layers.forEach((l, li) => {
      const { lastInsertRowid } = insLayer.run(id, l.name, l.color, l.ratio, l.texture ?? null, li)
      ;(l.annotations ?? []).filter(Boolean).forEach((t, ai) => insAnno.run(Number(lastInsertRowid), t, ai))
    })
    db.exec('COMMIT')
  } catch (e) {
    db.exec('ROLLBACK')
    throw e
  }
}

/** DELETE：删除特调及其层次、标注（级联，事务保证） */
function deleteDrink(id: string) {
  db.exec('BEGIN')
  try {
    db.prepare('DELETE FROM layer_annotations WHERE layer_id IN (SELECT id FROM layers WHERE drink_id = ?)').run(id)
    db.prepare('DELETE FROM layers WHERE drink_id = ?').run(id)
    const r = db.prepare('DELETE FROM drinks WHERE id = ?').run(id)
    if (r.changes === 0) throw new Error('特调不存在')
    db.exec('COMMIT')
  } catch (e) {
    db.exec('ROLLBACK')
    throw e
  }
}

// —— HTTP 中间件：GET /api/collection、POST /api/drinks、POST /api/photos ——
function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

const PHOTOS_DIR = path.join(import.meta.dirname, '..', 'public', 'photos')
const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp']
const MAX_PHOTO_SIZE = 15 * 1024 * 1024 // 15MB

export function coffeeApiPlugin(): Plugin {
  return {
    name: 'coffee-api',
    configureServer(server) {
      server.middlewares.use('/api', (req: IncomingMessage, res: ServerResponse) => {
        const url = (req.url ?? '').replace(/^\//, '')
        if (req.method === 'GET' && url === 'collection') {
          send(res, 200, queryCollection())
          return
        }
        if (req.method === 'POST' && url === 'drinks') {
          let raw = ''
          req.on('data', (c) => (raw += c))
          req.on('end', () => {
            try {
              const payload = JSON.parse(raw) as NewDrinkPayload
              const id = insertDrink(payload)
              send(res, 201, { id })
            } catch (e) {
              send(res, 400, { error: (e as Error).message })
            }
          })
          return
        }
        // 照片上传：请求体是文件二进制，文件名放 X-Filename 头（免 multipart 解析）
        if (req.method === 'POST' && url === 'photos') {
          const rawName = decodeURIComponent(String(req.headers['x-filename'] ?? 'photo.jpg'))
          const ext = path.extname(rawName).toLowerCase()
          if (!ALLOWED_EXT.includes(ext)) {
            send(res, 400, { error: `只支持 ${ALLOWED_EXT.join('/')} 格式` })
            req.resume()
            return
          }
          const chunks: Buffer[] = []
          let size = 0
          req.on('data', (c: Buffer) => {
            size += c.length
            if (size > MAX_PHOTO_SIZE) {
              send(res, 413, { error: '照片不能超过 15MB' })
              req.destroy()
              return
            }
            chunks.push(c)
          })
          req.on('end', () => {
            try {
              const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`
              fs.writeFileSync(path.join(PHOTOS_DIR, name), Buffer.concat(chunks))
              send(res, 201, { path: `/photos/${name}` })
            } catch (e) {
              send(res, 500, { error: (e as Error).message })
            }
          })
          return
        }
        // 自助补全：更新店铺信息（白名单字段，防注入）
        if (req.method === 'POST' && url === 'shops/update') {
          let raw = ''
          req.on('data', (c) => (raw += c))
          req.on('end', () => {
            try {
              const p = JSON.parse(raw) as { id: string; name?: string; city?: string }
              const name = p.name?.trim() ?? ''
              const city = p.city?.trim() ?? ''
              if (!p.id || !name || !city) throw new Error('店铺 id、名字、城市都不能为空')
              const r = db.prepare('UPDATE shops SET name = ?, city = ? WHERE id = ?').run(name, city, p.id)
              if (r.changes === 0) throw new Error('店铺不存在')
              send(res, 200, { ok: true })
            } catch (e) {
              send(res, 400, { error: (e as Error).message })
            }
          })
          return
        }
        // 自助补全：更新特调打卡日期
        if (req.method === 'POST' && url === 'drinks/update') {
          let raw = ''
          req.on('data', (c) => (raw += c))
          req.on('end', () => {
            try {
              const p = JSON.parse(raw) as { id: string; date?: string }
              const date = p.date ?? ''
              if (!p.id || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('需要特调 id 和 YYYY-MM-DD 格式日期')
              const r = db.prepare('UPDATE drinks SET date = ? WHERE id = ?').run(date, p.id)
              if (r.changes === 0) throw new Error('特调不存在')
              send(res, 200, { ok: true })
            } catch (e) {
              send(res, 400, { error: (e as Error).message })
            }
          })
          return
        }
        // 整体编辑：主表 UPDATE + 层次子表删了重插（事务）
        if (req.method === 'POST' && url === 'drinks/update-full') {
          let raw = ''
          req.on('data', (c) => (raw += c))
          req.on('end', () => {
            try {
              const p = JSON.parse(raw) as { id: string; drink: NewDrinkPayload['drink'] }
              updateDrinkFull(p.id, p.drink)
              send(res, 200, { ok: true })
            } catch (e) {
              send(res, 400, { error: (e as Error).message })
            }
          })
          return
        }
        // 删除特调：级联清理层次与标注（事务）
        if (req.method === 'POST' && url === 'drinks/delete') {
          let raw = ''
          req.on('data', (c) => (raw += c))
          req.on('end', () => {
            try {
              const p = JSON.parse(raw) as { id: string }
              if (!p.id) throw new Error('需要特调 id')
              deleteDrink(p.id)
              send(res, 200, { ok: true })
            } catch (e) {
              send(res, 400, { error: (e as Error).message })
            }
          })
          return
        }
        send(res, 404, { error: 'not found' })
      })
    },
  }
}
