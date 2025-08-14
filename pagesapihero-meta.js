export default async function handler(req, res) {
  try {
    const response = await fetch('https://mlbb-stats.ridwaanhall.com/api/hero-rank/');
    if (!response.ok) throw new Error(`API 请求失败: ${response.status}`);
    const data = await response.json();

    const heroes = data.map(hero => ({
      id: hero.id,
      name: hero.name,
      role: hero.role,
      tier: hero.tier,
      winRate: hero.winRate,
      pickRate: hero.pickRate,
      image: hero.image.startsWith('http') ? hero.image : `https://mobilelegends.com${hero.image}`,
      items: hero.items?.map(item => ({
        name: item.name,
        icon: item.icon.startsWith('http') ? item.icon : `https://mobilelegends.com${item.icon}`,
        winRate: item.winRate
      })) || [],
      skills: hero.skills?.map(skill => ({
        name: skill.name,
        icon: skill.icon.startsWith('http') ? skill.icon : `https://mobilelegends.com${skill.icon}`,
        description: skill.description
      })) || []
    }));

    res.status(200).json(heroes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '无法获取英雄数据' });
  }
}
