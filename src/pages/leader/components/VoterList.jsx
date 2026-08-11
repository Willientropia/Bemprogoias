import { useMemo, useState } from 'react';
import { toSearchText } from '../../../utils/normalizers';
import { Icon } from './Icon';
import { VoterCard } from './VoterCard';

const FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'pending', label: 'Pendentes' },
  { id: 'conflict', label: 'Com conflito' }
];

export function VoterList({ voters, onOpen, onNew }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const safeVoters = useMemo(() => Array.isArray(voters)
    ? voters.filter((voter) => voter && typeof voter === 'object')
    : [], [voters]);
  const visible = useMemo(() => {
    const term = search.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    return safeVoters.filter((voter) =>
      (filter === 'all' || voter.syncStatus === filter) && (!term || toSearchText(voter).includes(term))
    );
  }, [safeVoters, search, filter]);

  return (
    <section className="page list-page">
      <header className="standard-header"><div><p>MINHA BASE</p><h1>Eleitores</h1></div><button type="button" className="circle-add" onClick={onNew} aria-label="Novo eleitor"><Icon name="plus" /></button></header>
      <label className="search-box"><Icon name="search" size={19} /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome, RG, título…" /><kbd>{safeVoters.length}</kbd></label>
      <div className="filter-row">
        {FILTERS.map((item) => <button type="button" key={item.id} className={filter === item.id ? 'active' : ''} onClick={() => setFilter(item.id)}>{item.label}</button>)}
      </div>
      <div className="results-label"><span>{visible.length} {visible.length === 1 ? 'resultado' : 'resultados'}</span><span>Mais recentes primeiro</span></div>
      <div className="voter-stack voter-stack--list">
        {visible.map((voter, index) => <VoterCard key={voter.id || `voter-${index}`} voter={voter} onOpen={onOpen} />)}
        {!visible.length && (
          <div className="empty-state"><span><Icon name={search ? 'search' : 'users'} size={28} /></span><h3>{search ? 'Nenhum eleitor encontrado' : 'Nenhum cadastro neste filtro'}</h3><p>{search ? 'Tente outro nome, RG ou título.' : 'Os novos cadastros aparecerão aqui.'}</p>{!search && <button className="text-button" onClick={onNew}>Cadastrar eleitor</button>}</div>
        )}
      </div>
    </section>
  );
}
