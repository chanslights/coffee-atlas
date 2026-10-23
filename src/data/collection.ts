import type { CoffeeShop } from '../types/coffee'

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
        date: '2026-10-23',
        layers: [
          { name: '浓缩咖啡', color: '#7A4A26', ratio: 0.1, texture: 'dots', side: 'right' },
          { name: '开心果奶酱', color: '#D8DDC0', ratio: 0.18, side: 'left' },
          { name: '冰博客牛奶', color: '#EDEFE2', ratio: 0.72, texture: 'plain', side: 'right' },
        ],
      },
    ],
  },
  {
    id: 'guiyang-251',
    name: '251',
    city: '贵阳',
    drinks: [
      {
        id: 'jiegou-guixia',
        name: '解构瑰夏',
        subtitle: '埃塞 班其玛吉 / 瑰夏 / 日晒',
        temps: ['ice'],
        alcohol: 3.5,
        photo: '/photos/jiegou-guixia.jpg',
        layers: [
          {
            name: '罗勒脐橙汁 28%',
            color: '#E7DCB8',
            ratio: 1,
            texture: 'ice-cubes',
            annotations: [
              '旋蒸咖啡利口酒 19%',
              '樱花 16%',
              '神户居留地汤力水 15%',
              '秋月梨 15%',
              '旋蒸天竺葵金酒 7%',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'fizzle-coffee',
    name: 'fizzle coffee',
    city: '汕头',
    drinks: [
      {
        id: 'summer-syndrome',
        name: '夏日症候群',
        subtitle: '再见一面吧 趁盛夏结束之前',
        temps: ['ice'],
        alcohol: 0,
        photo: '/photos/summer-syndrome.jpg',
        layers: [
          { name: '氮气泡沫', color: '#F7F5EA', ratio: 0.12, texture: 'dots' },
          {
            name: '玫陇瓜',
            color: '#E6E4C2',
            ratio: 0.88,
            texture: 'plain',
            annotations: ['阳光玫瑰', '香水柠檬叶', '茉莉蒸馏液', '荔枝糖', '12H 风之谷冷萃'],
          },
        ],
      },
      {
        id: 'annies-bookshelf',
        name: '安妮的书架',
        subtitle: '我的生命是一块葬满希望的墓地',
        temps: ['ice'],
        alcohol: 0,
        photo: '/photos/annies-bookshelf.jpg',
        layers: [
          { name: '泡沫（喝前摇晃分层）', color: '#F3EEE0', ratio: 0.15, texture: 'dots' },
          {
            name: '红苹果',
            color: '#E9D9BC',
            ratio: 0.85,
            texture: 'plain',
            annotations: ['岩兰草', '肉桂姜黄', '伯爵茶糖', '14H 罕贝拉冷萃'],
          },
        ],
      },
    ],
  },
  {
    id: 'mindfo',
    name: 'MINDFO',
    city: '广州',
    drinks: [
      {
        id: 'ruby',
        name: 'Ruby',
        subtitle: '巴西 · 水洗黄波旁',
        temps: ['ice'],
        alcohol: 0,
        topping: { kind: 'dust', color: '#4A5D3A', label: '青柠碎' },
        photo: '/photos/ruby.jpg',
        layers: [
          { name: '奶盖', color: '#F1E9D2', ratio: 0.28, texture: 'plain' },
          { name: '草莓奶洗咖啡', color: '#8E2F2F', ratio: 0.72, annotations: ['草莓的酸', '咖啡的坚果香'] },
        ],
      },
      {
        id: 'butter-tree',
        name: '黄油树 Butter Tree',
        subtitle: '古籍SOE · 埃塞日晒原生种',
        temps: ['ice'],
        alcohol: 0,
        topping: { kind: 'dust', color: '#4A3226', label: '巧克力碎' },
        photo: '/photos/butter-tree.jpg',
        layers: [
          { name: '黄油牛乳泡沫', color: '#EFE6D2', ratio: 0.2, texture: 'dots' },
          {
            name: '浓缩咖啡 · 黄油饼干',
            color: '#DFC9A4',
            ratio: 0.8,
            texture: 'plain',
            annotations: ['荔枝 / 无花果 / 柠檬复合风味'],
          },
        ],
      },
    ],
  },
  {
    id: 'soulmade',
    name: 'soulmade',
    city: '深圳',
    drinks: [
      {
        id: 'shumei',
        name: '树·莓',
        subtitle: 'soul · made',
        temps: ['ice'],
        alcohol: 0,
        topping: { kind: 'bubble', color: '#FFFFFF', label: '莓果香氛气泡' },
        photo: '/photos/shumei.jpg',
        layers: [
          {
            name: '混合莓果',
            color: '#4A1F2E',
            ratio: 1,
            annotations: ['白桃', '青提', '柑橘', '佛手柑伯爵茶'],
          },
        ],
      },
    ],
  },
  {
    id: 'ops',
    name: 'O.P.S.',
    city: '上海（深圳湾万象城快闪）',
    drinks: [
      {
        id: 'sweet-teeth',
        name: '甜牙齿',
        subtitle: 'Sweet Teeth · 浓缩 厌氧埃塞',
        temps: ['ice'],
        alcohol: 0,
        topping: { kind: 'dust', color: '#E8933A', label: '橙皮碎' },
        photo: '/photos/sweet-teeth.jpg',
        layers: [
          { name: '鲜奶油', color: '#F5EFE0', ratio: 0.22, texture: 'dots' },
          { name: '酸奶 · 水牛奶', color: '#EBDDC2', ratio: 0.45, texture: 'plain' },
          { name: '伯爵茶糖 · 橙子', color: '#D9B98F', ratio: 0.33 },
        ],
      },
      {
        id: 'useless-magic',
        name: '蜜瓜 Useless Magic',
        subtitle: '冲煮 · 水洗肯尼亚',
        temps: ['ice'],
        alcohol: 0,
        topping: { kind: 'leaf', color: '#4E7A3F', label: '薄荷叶' },
        photo: '/photos/useless-magic.jpg',
        layers: [
          { name: '泡沫', color: '#F0E8D8', ratio: 0.1, texture: 'dots' },
          {
            name: '新鲜蜜瓜',
            color: '#DD8F4A',
            ratio: 0.9,
            annotations: ['百香果', '紫苏', '少许青柠'],
          },
        ],
      },
      {
        id: 'punch',
        name: '橘手 Punch',
        subtitle: '浓缩 · 水洗埃塞（60ml 小杯）',
        temps: ['ice'],
        alcohol: 0,
        topping: { kind: 'dust', color: '#F5F2E8', label: '椰蓉' },
        photo: '/photos/punch.jpg',
        layers: [
          {
            name: '血橙',
            color: '#C97B3D',
            ratio: 1,
            annotations: ['佛手柑', '伯爵茶', '椰奶 · 牛奶'],
          },
        ],
      },
    ],
  },
]
