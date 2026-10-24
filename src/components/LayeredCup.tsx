import type { Drink, DrinkLayer, Topping } from '@/types/coffee'

/**
 * LayeredCup —— 特调分层剖面图渲染器
 * 输入结构化的 Drink 数据，输出 JuJu 风格的 SVG 剖面图：
 * 杯壁轮廓 + 分层色块(带纹理) + 两侧风味标注引线 + 顶部装饰物
 */

// —— 杯子几何参数（所有绘制都基于这组数字，改形状只动这里）——
const TOP_Y = 90 // 液面顶部 y
const BOT_Y = 390 // 杯底 y
const H = BOT_Y - TOP_Y // 液体总高度
const TOP_L = 115, TOP_R = 285 // 顶部左右边缘 x
const BOT_L = 130, BOT_R = 270 // 底部左右边缘 x（杯子向内收）

/** 杯子内壁轮廓（用于裁切层次） */
const cupInnerPath = `
  M ${TOP_L} ${TOP_Y}
  L ${TOP_R} ${TOP_Y}
  L ${BOT_R} 355
  Q ${BOT_R - 4} ${BOT_Y} ${BOT_R - 38} ${BOT_Y}
  L ${BOT_L + 38} ${BOT_Y}
  Q ${BOT_L + 4} ${BOT_Y} ${BOT_L} 355
  Z
`

/** 求某一高度 y 处杯壁的 x 坐标（因为杯子有锥度） */
function edgeX(y: number, side: 'left' | 'right') {
  const t = (y - TOP_Y) / H
  const [top, bot] = side === 'left' ? [TOP_L, BOT_L] : [TOP_R, BOT_R]
  return top + (bot - top) * t
}

/** 把 hex 颜色调暗一点，用于纹理线条 */
function shade(hex: string, f = 0.82): string {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.round(((n >> 16) & 255) * f)
  const g = Math.round(((n >> 8) & 255) * f)
  const b = Math.round((n & 255) * f)
  return `rgb(${r},${g},${b})`
}

/** 单个层次：色块 + 纹理 */
function Layer({ prefix, layer, y, h, index }: { prefix: string; layer: DrinkLayer; y: number; h: number; index: number }) {
  const texture = layer.texture ?? 'wave'
  const pid = `${prefix}-tex-${index}` // pattern 的 id 必须全局唯一（多张卡同页会冲突）
  return (
    <g>
      <rect x={TOP_L - 10} y={y} width={TOP_R - TOP_L + 20} height={h + 0.5} fill={layer.color} />
      {texture === 'wave' && (
        <>
          <defs>
            <pattern id={pid} width="26" height="13" patternUnits="userSpaceOnUse">
              <path d="M0 7 Q6.5 1 13 7 T26 7" fill="none" stroke={shade(layer.color)} strokeWidth="1.6" />
            </pattern>
          </defs>
          <rect x={TOP_L - 10} y={y} width={TOP_R - TOP_L + 20} height={h} fill={`url(#${pid})`} opacity="0.55" />
        </>
      )}
      {texture === 'dots' && (
        <>
          <defs>
            <pattern id={pid} width="11" height="11" patternUnits="userSpaceOnUse">
              <circle cx="5.5" cy="5.5" r="1.8" fill={shade(layer.color, 0.75)} />
            </pattern>
          </defs>
          <rect x={TOP_L - 10} y={y} width={TOP_R - TOP_L + 20} height={h} fill={`url(#${pid})`} opacity="0.6" />
        </>
      )}
      {texture === 'ice-cubes' &&
        [0.2, 0.45, 0.7, 0.35, 0.6].map((fx, i) => (
          <rect
            key={i}
            x={TOP_L + fx * (TOP_R - TOP_L)}
            y={y + (0.15 + (i % 3) * 0.3) * h}
            width="34"
            height="34"
            rx="5"
            fill="rgba(255,255,255,0.42)"
            stroke="rgba(255,255,255,0.7)"
            transform={`rotate(${(i * 37) % 50 - 25} ${TOP_L + fx * (TOP_R - TOP_L) + 17} ${y + (0.15 + (i % 3) * 0.3) * h + 17})`}
          />
        ))}
    </g>
  )
}

/** 风味标注：引线 + 文字，分左右两侧 */
function Label({ text, y, side }: { text: string; y: number; side: 'left' | 'right' }) {
  const ex = edgeX(y, side)
  const tx = side === 'left' ? 108 : 292 // 文字锚点 x
  const anchor = side === 'left' ? 'end' : 'start'
  const lx = side === 'left' ? tx + 6 : tx - 6 // 引线靠文字一端
  return (
    <g>
      <line x1={ex + (side === 'left' ? -4 : 4)} y1={y} x2={lx} y2={y - 5} stroke="#3A3226" strokeWidth="1" />
      <text x={tx} y={y - 9} textAnchor={anchor} fontSize="13" fill="#3A3226" style={{ letterSpacing: 1 }}>
        {text}
      </text>
    </g>
  )
}

/** 顶部装饰物 */
function Garnish({ topping }: { topping: Topping }) {
  const cx = 200, cy = 58
  switch (topping.kind) {
    case 'citrus-slice':
      return (
        <g transform={`rotate(12 ${cx} ${cy})`}>
          <ellipse cx={cx} cy={cy} rx="58" ry="16" fill={topping.color} />
          <ellipse cx={cx} cy={cy} rx="46" ry="9" fill={shade(topping.color, 1.08)} opacity="0.7" />
        </g>
      )
    case 'leaf':
      return (
        <g transform={`rotate(-18 ${cx} ${cy})`}>
          <ellipse cx={cx} cy={cy} rx="52" ry="13" fill={topping.color} />
          <line x1={cx - 48} y1={cy} x2={cx + 48} y2={cy} stroke={shade(topping.color, 0.6)} strokeWidth="2" />
        </g>
      )
    case 'berry-roll':
      return (
        <g>
          <circle cx={cx} cy={cy} r="26" fill={topping.color} />
          <circle cx={cx} cy={cy} r="17" fill="none" stroke={shade(topping.color, 0.7)} strokeWidth="3" />
          <circle cx={cx} cy={cy} r="7" fill={shade(topping.color, 0.75)} />
        </g>
      )
    case 'fruit-bits':
      return (
        <g>
          {[-60, -34, -8, 18, 44, 66].map((dx, i) => (
            <circle key={i} cx={cx + dx} cy={cy + (i % 2) * 8 - 4} r="6" fill={topping.color} />
          ))}
          <path d={`M ${cx - 10} ${cy - 8} q 10 -18 22 -22`} stroke="#3D7A4E" strokeWidth="3" fill="none" />
          <path d={`M ${cx - 2} ${cy - 14} q 4 -10 12 -14`} stroke="#3D7A4E" strokeWidth="2" fill="none" />
        </g>
      )
    case 'bubble':
      // 大气泡/泡沫球：半透明球体 + 高光弧线
      return (
        <g>
          <circle cx={cx} cy={cy - 8} r="44" fill="rgba(255,255,255,0.28)" stroke="rgba(255,255,255,0.85)" strokeWidth="2" />
          <path d={`M ${cx - 28} ${cy - 30} a 32 32 0 0 1 20 -10`} stroke="rgba(255,255,255,0.95)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        </g>
      )
  }
}

/** 撒粉装饰：均匀撒在最上层液体表面（开心果碎、可可粉等） */
function Dust({ color }: { color: string }) {
  // 用固定公式生成确定性的"随机"撒点，避免每次渲染位置变化
  const dots = Array.from({ length: 90 }, (_, i) => ({
    x: 140 + ((i * 53) % 120),
    y: TOP_Y + 6 + ((i * 29) % 46),
    r: 0.8 + ((i * 7) % 3) * 0.7,
  }))
  return (
    <g opacity="0.85">
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={color} />
      ))}
    </g>
  )
}

export default function LayeredCup({ drink }: { drink: Drink }) {
  // SVG defs 的 id 命名空间：多张卡同页时避免串色（相当于主键前缀）
  const uid = drink.id.replace(/[^a-zA-Z0-9-]/g, '')

  // 计算每层的 y 起始位置（自上而下堆叠）
  let acc = 0
  const positioned = drink.layers.map((layer) => {
    const y = TOP_Y + acc * H
    acc += layer.ratio
    return { layer, y, h: layer.ratio * H }
  })

  // 把每层的 name + annotations 展平成标注列表（一对多关系的渲染入口）
  const labelEntries = positioned.flatMap((p) => {
    const texts = [p.layer.name, ...(p.layer.annotations ?? [])]
    return texts.map((text, j) => ({
      text,
      y: p.y + (p.h * (j + 1)) / (texts.length + 1), // 同层多个标注均匀分布
      side: p.layer.side,
    }))
  })

  return (
    <svg viewBox="0 0 400 430" className="w-full" role="img" aria-label={drink.name}>
      <defs>
        <clipPath id={`${uid}-clip`}>
          <path d={cupInnerPath} />
        </clipPath>
      </defs>

      {/* 顶部装饰（画在杯口后面） */}
      {drink.topping && drink.topping.kind !== 'dust' && <Garnish topping={drink.topping} />}

      {/* 层次（裁切到杯型内） */}
      <g clipPath={`url(#${uid}-clip)`}>
        {positioned.map((p, i) => (
          <Layer key={i} prefix={uid} layer={p.layer} y={p.y} h={p.h} index={i} />
        ))}
        {/* 撒粉类装饰画在液面上 */}
        {drink.topping?.kind === 'dust' && <Dust color={drink.topping.color} />}
      </g>

      {/* 杯壁 + 杯口沿 */}
      <path d={cupInnerPath} fill="none" stroke="#DCD5C5" strokeWidth="9" strokeLinejoin="round" />
      <rect x="98" y={TOP_Y - 16} width="204" height="15" rx="7.5" fill="#DCD5C5" />

      {/* 冰霜杯：白色雾面霜层 + 沿杯壁的霜花颗粒 */}
      {drink.frosted && (
        <g>
          <path d={cupInnerPath} fill="none" stroke="rgba(240,245,242,0.6)" strokeWidth="12" strokeLinejoin="round" />
          <rect x="98" y={TOP_Y - 16} width="204" height="15" rx="7.5" fill="#E9EEE9" opacity="0.85" />
          {Array.from({ length: 40 }, (_, i) => {
            const y = TOP_Y + 8 + ((i * 37) % (H - 16))
            const side = i % 2 ? 'left' : 'right'
            const x = edgeX(y, side) + (side === 'left' ? -1 : 1) * (2 + ((i * 13) % 6))
            return <circle key={i} cx={x} cy={y} r={0.7 + ((i * 5) % 3) * 0.5} fill="rgba(255,255,255,0.85)" />
          })}
        </g>
      )}

      {/* 风味标注（左右交替，可被 layer.side 覆盖） */}
      {labelEntries.map((e, i) => {
        const side = e.side ?? (i % 2 === 0 ? 'right' : 'left')
        return <Label key={i} text={e.text} y={e.y} side={side} />
      })}
    </svg>
  )
}
