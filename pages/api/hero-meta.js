// pages/api/hero-meta.js
// 说明：该文件在 Next.js 的 API 路由下运行（Node 环境）
// 它会从 Ridwan 的 API 拉取 hero-rank 列表并做字段映射，返回前端可直接消费的 JSON。
// 包含：5 分钟内缓存、错误回退与字段防护。

const RIDWAN_URL = 'https://mlbb-stats.ridwaanhall.com/api/hero-rank/';
const CACHE_TTL_MS = 5 * 60 * 1000; // 缓存 5 分钟

let cache = {
  ts: 0,
  data: null,
};

const FALLBACK = [
  {
    id: 1,
    name: "Alucard",
    role: "Fighter",
    tier: "S",
    winRate: 54.3,
    pickRate: 12.1,
    image: "https://via.placeholder.com/200",
    items: [
      { name: "Swift Boots", icon: "https://via.placeholder.com/48", winRate: 52.1 }
    ],
    skills: [
      { name: "Pursuit", icon: "https://via.placeholder.com/40", description: "Fallback skill" }
    ]
  }
];

function safeString(v, fallback = '') {
  if (v === undefined || v === null) return fallback;
  return String(v);
}

export default async function handler(req, res) {
  try {
    const now = Date.now();

    // Return cache if valid
    if (cache.data && (now - cache.ts) < CACHE_TTL_MS) {
      res.setHeader('x-cache', 'HIT');
      return res.status(200).json(cache.data);
    }

    // Fetch from Ridwan API
    const resp = await fetch(RIDWAN_URL, { method: 'GET' });
    if (!resp.ok) {
      // 如果 API 返回非 2xx，记录并回退
      console.error(`Ridwan API 返回状态: ${resp.status}`);
      if (cache.data) {
        res.setHeader('x-cache', 'STALE');
        return res.status(200).json(cache.data);
      }
      return res.status(502).json({ error: '外部数据源不可用', code: resp.status, fallback: FALLBACK });
    }

    const raw = await resp.json();

    // raw 可能不是数组，做保护
    const list = Array.isArray(raw) ? raw : (raw?.data && Array.isArray(raw.data) ? raw.data : []);

    // 规范化字段映射（尽可能覆盖不同命名）
    const heroes = list.map(h => {
      // 尽可能从不同字段名取值
      const id = h.id ?? h.hero_id ?? h.heroId ?? h.heroId ?? null;
      const name = safeString(h.name ?? h.hero_name ?? h.hero ?? h.title ?? 'Unknown');
      const role = safeString(h.role ?? h.position ?? h.primary ?? 'Unknown');
      const tier = safeString(h.tier ?? h.rank ?? '');
      const winRate = Number(h.winRate ?? h.win_rate ?? h.wr ?? h.win ?? 0);
      const pickRate = Number(h.pickRate ?? h.pick_rate ?? h.pr ?? h.pick ?? 0);

      // 图片字段可能是 full URL 或相对路径
      let image = h.image ?? h.icon ?? h.avatar ?? '';
      if (image && !image.startsWith('http')) {
        // 如果是相对路径，尝试常见前缀（不保证总是有效）
        image = image.startsWith('/') ? `https://mobilelegends.com${image}` : `https://mobilelegends.com/${image}`;
      }
      if (!image) image = 'https://via.placeholder.com/200';

      // items/skills 防护（可能为 undefined）
      const itemsRaw = h.items ?? h.build ?? [];
      const items = Array.isArray(itemsRaw) ? itemsRaw.map(it => {
        let icon = it.icon ?? it.image ?? '';
        if (icon && !icon.startsWith('http')) {
          icon = icon.startsWith('/') ? `https://mobilelegends.com${icon}` : `https://mobilelegends.com/${icon}`;
        }
        if (!icon) icon = 'https://via.placeholder.com/48';
        return {
          name: safeString(it.name ?? it.title ?? 'item'),
          icon,
          winRate: Number(it.winRate ?? it.win_rate ?? it.wr ?? 0)
        };
      }) : [];

      const skillsRaw = h.skills ?? h.abilities ?? [];
      const skills = Array.isArray(skillsRaw) ? skillsRaw.map(s => {
        let icon = s.icon ?? s.image ?? '';
        if (icon && !icon.startsWith('http')) {
          icon = icon.startsWith('/') ? `https://mobilelegends.com${icon}` : `https://mobilelegends.com/${icon}`;
        }
        if (!icon) icon = 'https://via.placeholder.com/40';
        return {
          name: safeString(s.name ?? s.title ?? 'skill'),
          icon,
          description: safeString(s.description ?? s.desc ?? '')
        };
      }) : [];

      return {
        id,
        name,
        role,
        tier,
        winRate,
        pickRate,
        image,
        items,
        skills
      };
    });

    // 如果解析后没有数据，回退
    const out = (heroes && heroes.length > 0) ? heroes : FALLBACK;

    // 更新缓存
    cache = { ts: now, data: out };

    res.setHeader('x-cache', 'MISS');
    res.status(200).json(out);

  } catch (err) {
    console.error('hero-meta handler error:', err);
    // 如果有缓存就返回缓存
    if (cache.data) {
      res.setHeader('x-cache', 'ERROR_STALE');
      return res.status(200).json(cache.data);
    }
    // 最后退回 fallback
    res.status(500).json({ error: '内部服务器错误', message: String(err), fallback: FALLBACK });
  }
}
