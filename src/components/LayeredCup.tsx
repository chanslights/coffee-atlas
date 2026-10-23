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
function Layer({ layer, y, h, index }: { layer: DrinkLayer; y: number; h: number; index: number }) {
  const texture = layer.texture ?? 'wave'
  const pid = `tex-${index}` // pattern 的 id 必须每层唯一
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
function Label({ layer, y, side }: { layer: DrinkLayer; y: number; side: 'left' | 'right' }) {
  const ex = edgeX(y, side)
  const tx = side === 'left' ? 96 : 304 // 文字锚点 x
  const anchor = side === 'left' ? 'end' : 'start'
  const lx = side === 'left' ? tx + 8 : tx - 8 // 引线靠文字一端
  return (
    <g>
      <line x1={ex + (side === 'left' ? -4 : 4)} y1={y} x2={lx} y2={y - 6} stroke="#3A3226" strokeWidth="1" />
      <text x={tx} y={y - 10} textAnchor={anchor} fontSize="13.5" fill="#3A3226" style={{ letterSpacing: 1 }}>
        {layer.name}
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
  }
}

export default function LayeredCup({ drink }: { drink: Drink }) {
  // 计算每层的 y 起始位置（自上而下堆叠）
  let acc = 0
  const positioned = drink.layers.map((layer) => {
    const y = TOP_Y + acc * H
    acc += layer.ratio
    return { layer, y, h: layer.ratio * H }
  })

  return (
    <svg viewBox="0 0 400 430" className="w-full" role="img" aria-label={drink.name}>
      <defs>
        <clipPath id="cup-clip">
          <path d={cupInnerPath} />
        </clipPath>
      </defs>

      {/* 顶部装饰（画在杯口后面） */}
      {drink.topping && <Garnish topping={drink.topping} />}

      {/* 层次（裁切到杯型内） */}
      <g clipPath="url(#cup-clip)">
        {positioned.map((p, i) => (
          <Layer key={i} layer={p.layer} y={p.y} h={p.h} index={i} />
        ))}
      </g>

      {/* 杯壁 + 杯口沿 */}
      <path d={cupInnerPath} fill="none" stroke="#DCD5C5" strokeWidth="9" strokeLinejoin="round" />
      <rect x="98" y={TOP_Y - 16} width="204" height="15" rx="7.5" fill="#DCD5C5" />

      {/* 风味标注（左右交替，可被 layer.side 覆盖） */}
      {positioned.map((p, i) => {
        const side = p.layer.side ?? (i % 2 === 0 ? 'right' : 'left')
        return <Label key={i} layer={p.layer} y={p.y + p.h / 2} side={side} />
      })}
    </svg>
  )
}
