import type { CoffeeShop } from '@/types/coffee'

/**
 * 我的咖啡收藏数据
 * 打卡新店 = 在 shops 数组里加一家店 / 一杯特调
 * （以后可以迁移到数据库，结构不变）
 */
export const shops: CoffeeShop[] = [
  {
    id: 'juju',
    name: 'JuJu Coffee',
    city: '贵阳',
    drinks: [
      {
        id: 'nuomi-tuanzi',
        name: '糯米团子',
        subtitle: 'JUJU蜜瓜拼配冷萃',
        temps: ['ice'],
        alcohol: 0,
        topping: { kind: 'citrus-slice', color: '#E8B45A', label: '香橼' },
        layers: [
          { name: '贵州糯米酒', color: '#F5E6C8', ratio: 0.16, texture: 'dots', side: 'left' },
          { name: '日本柚子', color: '#F2C94C', ratio: 0.34, side: 'right' },
          { name: '椰子', color: '#EFBE45', ratio: 0.18, side: 'left' },
          { name: '接骨木花', color: '#E8B23E', ratio: 0.16, side: 'right' },
          { name: '都匀毛尖', color: '#DFA536', ratio: 0.1, side: 'left' },
          { name: '菠萝', color: '#D99A2E', ratio: 0.06, side: 'right' },
        ],
      },
      {
        id: 'boom-boom',
        name: '莓果BOOMBOOMBOOM',
        subtitle: 'JUJU草莓拼配浓缩',
        temps: ['ice', 'hot', 'warm'],
        alcohol: 0,
        topping: { kind: 'berry-roll', color: '#C24A3E', label: '蔓越莓' },
        layers: [
          { name: '红酒', color: '#6E1F2A', ratio: 0.3, side: 'left' },
          { name: '蔓越莓', color: '#661C26', ratio: 0.25, side: 'right' },
          { name: '椰子', color: '#5E1923', ratio: 0.2, side: 'left' },
          { name: '接骨木花', color: '#571620', ratio: 0.15, side: 'right' },
          { name: '神秘材料', color: '#50141D', ratio: 0.1, side: 'left' },
        ],
      },
      {
        id: 'kanas-mist',
        name: '喀纳斯的晨雾',
        subtitle: 'JUJU蜜瓜拼配ESPRESSO',
        temps: ['ice', 'warm'],
        alcohol: 0,
        topping: { kind: 'fruit-bits', color: '#E8912D', label: '沙棘果' },
        layers: [
          { name: '咖啡奶油', color: '#FBF7EF', ratio: 0.28, texture: 'plain', side: 'right' },
          { name: '新疆沙棘', color: '#D9713B', ratio: 0.42, side: 'right' },
          { name: '柠檬草', color: '#CE6532', ratio: 0.2, side: 'left' },
          { name: '粉红胡椒', color: '#C2592A', ratio: 0.1, side: 'right' },
        ],
      },
      {
        id: 'yunnan-dna',
        name: '云南DNA',
        subtitle: 'JUJU草莓拼配ESPRESSO',
        temps: ['ice', 'warm'],
        alcohol: 0,
        topping: { kind: 'leaf', color: '#4E7A3F', label: '酸木瓜叶' },
        layers: [
          { name: '酸木瓜', color: '#E8A04C', ratio: 0.3, texture: 'ice-cubes', side: 'right' },
          { name: '乳酸菌', color: '#E09543', ratio: 0.25, side: 'left' },
          { name: '石榴', color: '#D98A3B', ratio: 0.2, side: 'right' },
          { name: '花椒', color: '#D07F33', ratio: 0.15, side: 'left' },
          { name: '乳清', color: '#C8752C', ratio: 0.06, side: 'left' },
          { name: '肉桂', color: '#C06B25', ratio: 0.04, side: 'right' },
        ],
      },
    ],
  },
  {
    id: 'chuan-na-wan-hai',
    name: '川纳万海',
    city: '成都',
    drinks: [
      {
        id: 'pistachio-dirty',
        name: '开心果Dirty',
        subtitle: 'Pistachio Dirty',
        temps: ['ice'],
        alcohol: 0,
        topping: { kind: 'dust', color: '#3E5A26', label: '开心果碎' },
        photo: '/photos/pistachio-dirty.jpg',
        layers: [
          { name: '浓缩咖啡', color: '#7A4A26', ratio: 0.1, texture: 'dots', side: 'right' },
          { name: '开心果奶酱', color: '#D8DDC0', ratio: 0.18, side: 'left' },
          { name: '冰博客牛奶', color: '#EDEFE2', ratio: 0.72, texture: 'plain', side: 'right' },
        ],
      },
    ],
  },
]
