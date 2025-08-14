// pages/index.js
import { useEffect, useState } from 'react';

export default function Home() {
  const [heroes, setHeroes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filterRole, setFilterRole] = useState('All');
  const [sortKey, setSortKey] = useState('winRate');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch('/api/hero-meta')
      .then(r => r.json())
      .then(data => {
        if (!mounted) return;
        if (Array.isArray(data)) setHeroes(data);
        else setHeroes([]);
      })
      .catch(err => {
        console.error('fetch /api/hero-meta failed', err);
        setHeroes([]);
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const roles = ['All', 'Marksman', 'Fighter', 'Tank', 'Assassin', 'Mage', 'Support', 'Unknown'];

  const filtered = heroes
    .filter(h => filterRole === 'All' ? true : (h.role ?? 'Unknown') === filterRole)
    .slice() // copy before sort
    .sort((a, b) => {
      const A = Number(a[sortKey] ?? 0);
      const B = Number(b[sortKey] ?? 0);
      return sortOrder === 'asc' ? (A - B) : (B - A);
    });

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-4xl font-bold mb-6">MLBB 英雄榜（Ridwan API）</h1>

      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="mr-2">角色:</label>
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="bg-gray-800 text-white p-1 rounded">
            {roles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div>
          <label className="mr-2">排序:</label>
          <select value={sortKey} onChange={e => setSortKey(e.target.value)} className="bg-gray-800 text-white p-1 rounded mr-2">
            <option value="winRate">胜率</option>
            <option value="pickRate">登场率</option>
          </select>
          <button onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')} className="bg-gray-700 px-2 py-1 rounded">
            {sortOrder === 'asc' ? '升序' : '降序'}
          </button>
        </div>
      </div>

      {loading ? (
        <div>加载中…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map(hero => (
            <div key={hero.id ?? hero.name} className="bg-gray-800 p-4 rounded-2xl shadow-lg hover:scale-105 transition cursor-pointer" onClick={() => setSelected(hero)}>
              <img src={hero.image} alt={hero.name} className="w-full h-48 object-cover rounded-lg"/>
              <h2 className="text-2xl font-semibold mt-4">{hero.name}</h2>
              <p className="text-sm text-gray-400">{hero.role} {hero.tier ? `| ${hero.tier} Tier` : ''}</p>
              <div className="mt-2 text-sm">
                <p>胜率: {hero.winRate ?? 0}%</p>
                <p>登场率: {hero.pickRate ?? 0}%</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-2xl w-11/12 max-w-2xl relative">
            <button className="absolute top-4 right-4 text-white text-xl font-bold" onClick={() => setSelected(null)}>×</button>
            <h2 className="text-3xl font-bold">{selected.name}</h2>
            <p className="text-gray-400">{selected.role} {selected.tier ? `| ${selected.tier} Tier` : ''}</p>
            <div className="mt-2 text-sm">
              <p>胜率: {selected.winRate ?? 0}%</p>
              <p>登场率: {selected.pickRate ?? 0}%</p>
            </div>

            {Array.isArray(selected.items) && selected.items.length > 0 && (
              <div className="mt-4">
                <h3 className="text-xl font-semibold mb-2">推荐出装</h3>
                <div className="flex gap-4 flex-wrap">
                  {selected.items.map(it => (
                    <div key={it.name} className="flex flex-col items-center">
                      <img src={it.icon} alt={it.name} width={48} height={48}/>
                      <span className="text-xs">{it.winRate ?? 0}%</span>
                      <span className="text-xs">{it.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Array.isArray(selected.skills) && selected.skills.length > 0 && (
              <div className="mt-4">
                <h3 className="text-xl font-semibold mb-2">技能</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selected.skills.map(s => (
                    <div key={s.name} className="flex items-center gap-2 bg-gray-700 p-2 rounded">
                      <img src={s.icon} alt={s.name} width={40} height={40}/>
                      <div>
                        <p className="font-semibold">{s.name}</p>
                        <p className="text-xs">{s.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
