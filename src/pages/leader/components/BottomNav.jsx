import { Icon } from './Icon';

const ITEMS = [
  { id: 'home', label: 'Início', icon: 'home' },
  { id: 'voters', label: 'Eleitores', icon: 'users' },
  { id: 'new', label: 'Cadastrar', icon: 'plus', primary: true },
  { id: 'profile', label: 'Perfil', icon: 'user' }
];

export function BottomNav({ route, onNavigate }) {
  return (
    <nav className="bottom-nav" aria-label="Navegação principal">
      {ITEMS.map((item) => <button type="button" key={item.id} className={`${route === item.id ? 'active' : ''} ${item.primary ? 'bottom-nav__primary' : ''}`} onClick={() => onNavigate(item.id)}><span><Icon name={item.icon} size={item.primary ? 24 : 21} /></span><small>{item.label}</small></button>)}
    </nav>
  );
}
