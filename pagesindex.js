import { useEffect, useState } from 'react';

export default function Home() {
  const [heroes, setHeroes] = useState([]);
  const [selectedHero, setSelectedHero] = useState(null);
  const [filterRole, setFilterRole] = useState('All');
  const [sortKey, setSortKey] = useState('winRate');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetch('/api/hero-meta')
      .then(res => res.json())
      .then(data => setHeroes(data));
  }, []);

  const roles = ['All', 'Marksman', 'Fighter', 'Tank', 'Assassin', 'Mage', 'Support'];

  const filteredHeroes = heroes
    .filter(hero => filterRole === 'All' || hero.role === filterRole)
    .sort((a, b) => sortOrder === 'asc' ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-4xl font-bold mb-6">MLBB 英雄榜</h1>

      {/* 筛选 */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="mr-2">角色:</label>
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="bg-gray-800 text-white p-1 rounded">
            {roles.map(role => <option key={role} value={role}>{role}</option>)}
          </select>
        </div>

        <div>
          <label className="mr-2">排序:</label>
          <select value={sortKey} onChange={e => setSortKey(e.target.value)} className="bg-gray-800 text-white p-1 rounded mr-2">
            <option value="winRate">胜率</option>
            <option value="pickRate">登场率</option>
          </select>
          <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className="bg-gray-700 px-2 py-1 rounded">
            {sortOrder === 'asc' ? '升序' : '降序'}
          </button>
        </div>
      </div>

      {/* 英雄卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredHeroes.map(hero => (
          <div key={hero.id} className="bg-gray-800 p-4 rounded-2xl shadow-lg hover:scale-105 transition cursor-pointer" onClick={() => setSelectedHero(hero)}>
            <img src={hero.image} alt={hero.name} className="w-full h-48 object-cover rounded-lg"/>
            <h2 className="text-2xl font-semibold mt-4">{hero.name}</h2>
            <p className="text-sm text-gray-400">{hero.role}</p>
          </div>
        ))}
      </div>

      {/* 弹窗 */}
      {selectedHero && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-2xl w-11/12 max-w-2xl relative">
            <button className="absolute top-4 right-4 text-white text-xl font-bold" onClick={() => setSelectedHero(null)}>×</button>
            <h2 className="text-3xl font-bold">{selectedHero.name}</h2>
            <p className="text-gray-400">{selectedHero.role} | {selectedHero.tier} Tier</p>
            <div className="mt-2 text-sm">
              <p>胜率: {selectedHero.winRate}%</p>
              <p>登场率: {selectedHero.pickRate}%</p>
            </div>

            {selectedHero.items.length > 0 && (
              <div className="mt-4">
                <h3 className="text-xl font-semibold mb-2">推荐出装</h3>
                <div className="flex gap-4 flex-wrap">
                  {selectedHero.items.map(item => (
                    <div key={item.name} className="flex flex-col items-center">
                      <img src={item.icon} alt={item.name} width={48} height={48}/>
                      <span className="text-xs">{item.winRate}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedHero.skills.length > 0 && (
              <div className="mt-4">
                <h3 className="text-xl font-semibold mb-2">技能</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedHero.skills.map(skill => (
                    <div key={skill.name} className="flex items-center gap-2 bg-gray-700 p-2 rounded">
                      <img src={skill.icon} alt={skill.name} width={40} height={40}/>
                      <div>
                        <p className="font-semibold">{skill.name}</p>
                        <p className="text-xs">{skill.description}</p>
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
