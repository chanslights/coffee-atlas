import type { Drink, DrinkLayer, Topping } from '@/types/coffee'

/**
 * LayeredCup —— 特调分层剖面图渲染器 v2
 * 视觉要点：每层纵向渐变(体积感) + 层间波浪分界线 + 标注色点 + 杯壁高光 + 液面新月线
 * 注意：所有 SVG defs 的 id 都用饮品 id 做命名空间，避免多张卡同页时串色
 */

// —— 杯子几何参数 ——
const TOP_Y = 90
const BOT_Y = 390
const H = BOT_Y - TOP_Y
const TOP_L = 115, TOP_R = 285
const BOT_L = 130, BOT_R = 270

const cupInnerPath = `
  M ${TOP_L} ${TOP_Y}
  L ${TOP_R} ${TOP_Y}
  L ${BOT_R} 355
  Q ${BOT_R - 4} ${BOT_Y} ${BOT_R - 38} ${BOT_Y}
  L ${BOT_L + 38} ${BOT_Y}
  Q ${BOT_L + 4} ${BOT_Y} ${BOT_L} 355
  Z
`

function edgeX(y: number, side: 'left' | 'right') {
  const t = (y - TOP_Y) / H
  const [top, bot] = side === 'left' ? [TOP_L, BOT_L] : [TOP_R, BOT_R]
  return top + (bot - top) * t
}

/** hex 调色：f>1 提亮，f<1 压暗（带 0-255 钳制） */
function shade(hex: string, f = 0.85): string {
  const n = parseInt(hex.slice(1), 16)
  const clamp = (v: number) => Math.min(255, Math.max(0, Math.round(v * f)))
  return `rgb(${clamp((n >> 16) & 255)},${clamp((n >> 8) & 255)},${clamp(n & 255)})`
}

/** 生成一段波浪线（层间分界线用） */
function wavePath(x1: number, x2: number, y: number): string {
  let d = `M ${x1} ${y}`
  for (let x = x1; x < x2; x += 13) d += ' q 6.5 -3.5 13 0'
  return d
}

/** 单个层次：渐变色块 + 纹理 + 顶部波浪分界线 */
function Layer({
  prefix,
  layer,
  y,
  h,
  index,
  isTop,
}: {
  prefix: string
  layer: DrinkLayer
  y: number
  h: number
  index: number
  isTop: boolean
}) {
  const texture = layer.texture ?? 'wave'
  const gid = `${prefix}-grad-${index}`
  const pid = `${prefix}-tex-${index}`
  return (
    <g>
      <defs>
        {/* 纵向渐变：顶部微亮、底部压暗，给液体体积感 */}
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={shade(layer.color, 1.07)} />
          <stop offset="100%" stopColor={shade(layer.color, 0.88)} />
        </linearGradient>
      </defs>
      <rect x={TOP_L - 10} y={y} width={TOP_R - TOP_L + 20} height={h + 0.5} fill={`url(#${gid})`} />

      {texture === 'wave' && (
        <>
          <defs>
            <pattern id={pid} width="26" height="13" patternUnits="userSpaceOnUse">
              <path d="M0 7 Q6.5 1 13 7 T26 7" fill="none" stroke={shade(layer.color, 0.78)} strokeWidth="1.6" />
            </pattern>
          </defs>
          <rect x={TOP_L - 10} y={y} width={TOP_R - TOP_L + 20} height={h} fill={`url(#${pid})`} opacity="0.5" />
        </>
      )}
      {texture === 'dots' && (
        <>
          <defs>
            <pattern id={pid} width="11" height="11" patternUnits="userSpaceOnUse">
              <circle cx="5.5" cy="5.5" r="1.8" fill={shade(layer.color, 0.72)} />
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

      {/* 层间波浪分界线（最顶层不画，那是液面） */}
      {!isTop && (
        <path
          d={wavePath(edgeX(y, 'left') + 4, edgeX(y, 'right') - 4, y + 1)}
          fill="none"
          stroke={shade(layer.color, 0.68)}
          strokeWidth="1.4"
          opacity="0.65"
        />
      )}
    </g>
  )
}

/** 风味标注：颜色圆点 + 引线 + 文字 */
function Label({ text, y, side, color }: { text: string; y: number; side: 'left' | 'right'; color: string }) {
  const ex = edgeX(y, side)
  const tx = side === 'left' ? 108 : 292
  const anchor = side === 'left' ? 'end' : 'start'
  const dotCx = side === 'left' ? tx + 6 : tx - 6 // 色点在文字与引线之间
  const lx = side === 'left' ? tx + 14 : tx - 14
  return (
    <g>
      <line x1={ex + (side === 'left' ? -4 : 4)} y1={y} x2={lx} y2={y - 5} stroke="#3A3226" strokeWidth="1" />
      <circle cx={dotCx} cy={y - 9} r="3.6" fill={color} stroke={shade(color, 0.7)} strokeWidth="1" />
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
      return (
        <g>
          <circle cx={cx} cy={cy - 8} r="44" fill="rgba(255,255,255,0.28)" stroke="rgba(255,255,255,0.85)" strokeWidth="2" />
          <path d={`M ${cx - 28} ${cy - 30} a 32 32 0 0 1 20 -10`} stroke="rgba(255,255,255,0.95)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        </g>
      )
  }
}

/** 撒粉装饰：均匀撒在最上层液体表面 */
function Dust({ color }: { color: string }) {
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
  const uid = drink.id.replace(/[^a-zA-Z0-9-]/g, '') // SVG id 命名空间

  let acc = 0
  const positioned = drink.layers.map((layer) => {
    const y = TOP_Y + acc * H
    acc += layer.ratio
    return { layer, y, h: layer.ratio * H }
  })

  const labelEntries = positioned.flatMap((p) => {
    const texts = [p.layer.name, ...(p.layer.annotations ?? [])]
    return texts.map((text, j) => ({
      text,
      y: p.y + (p.h * (j + 1)) / (texts.length + 1),
      side: p.layer.side,
      color: p.layer.color,
    }))
  })

  return (
    <svg viewBox="0 0 400 430" className="w-full" role="img" aria-label={drink.name}>
      <defs>
        <clipPath id={`${uid}-clip`}>
          <path d={cupInnerPath} />
        </clipPath>
      </defs>

      {/* 顶部装饰 */}
      {drink.topping && drink.topping.kind !== 'dust' && <Garnish topping={drink.topping} />}

      {/* 层次（裁切到杯型内） */}
      <g clipPath={`url(#${uid}-clip)`}>
        {positioned.map((p, i) => (
          <Layer key={i} prefix={uid} layer={p.layer} y={p.y} h={p.h} index={i} isTop={i === 0} />
        ))}
        {drink.topping?.kind === 'dust' && <Dust color={drink.topping.color} />}
        {/* 液面新月线 */}
        <ellipse cx="200" cy={TOP_Y + 3} rx="78" ry="4.5" fill="rgba(255,255,255,0.30)" />
      </g>

      {/* 杯壁 + 杯口沿 */}
      <path d={cupInnerPath} fill="none" stroke="#DCD5C5" strokeWidth="9" strokeLinejoin="round" />
      <rect x="98" y={TOP_Y - 16} width="204" height="15" rx="7.5" fill="#DCD5C5" />

      {/* 杯壁左侧高光（玻璃通透感） */}
      <path
        d={`M ${TOP_L + 10} ${TOP_Y + 18} Q ${TOP_L + 5} 240 ${TOP_L + 12} 345`}
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
        opacity="0.55"
      />

      {/* 风味标注（带颜色圆点） */}
      {labelEntries.map((e, i) => {
        const side = e.side ?? (i % 2 === 0 ? 'right' : 'left')
        return <Label key={i} text={e.text} y={e.y} side={side} color={e.color} />
      })}
    </svg>
  )
}
