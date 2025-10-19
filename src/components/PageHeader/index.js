import { FiMenu } from 'react-icons/fi';
import './pageheader.css';

// 1. Recebe a função 'toggleSidebar' e os 'children'
// (Os children serão o seu componente <Title>)
export default function PageHeader({ toggleSidebar, children }) {
  return (
    <header className="page-header">
      {/* 2. O botão que aciona a função */}
      <button className="toggle-btn" onClick={toggleSidebar}>
        <FiMenu size={24} color="#121212" />
      </button>

      {/* 3. Renderiza o que for passado (o <Title>) */}
      <div className="page-title-container">
        {children}
      </div>
    </header>
  );
}