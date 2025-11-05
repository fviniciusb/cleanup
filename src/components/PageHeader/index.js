// Em: src/components/PageHeader/PageHeader.jsx
import './pageheader.css';

// 1. Removemos a prop 'toggleSidebar'
export default function PageHeader({ children }) {
  return (
    <header className="page-header">
      
      <div className="page-title-container">
        {children}
      </div>
    </header>
  );
}