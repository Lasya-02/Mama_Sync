import { Outlet, Link } from 'react-router-dom';
import './css/Layout.css';

export default function Dashboard() {
  return (
    <div className="dashboard-layout">
      {/* Sidebar Navigation */}
      <aside className="icon-sidebar">
        <Link to="/dashboard" className="sidebar-item" title="Dashboard">
          <i className="bi bi-house-door"></i>
          <span>Dashboard</span>
        </Link>
        <Link to="/reminder" className="sidebar-item" title="Reminder">
          <i className="bi bi-calendar-check"></i>
          <span>Reminder</span>
        </Link>
        <Link to="/guide" className="sidebar-item" title="Guide">
          <i className="bi bi-book"></i>
          <span>Guide</span>
        </Link>
        <Link to="/community" className="sidebar-item" title="Community">
          <i className="bi bi-chat-dots"></i>
          <span>Community</span>
        </Link>
        <Link to="/hospitals" className="sidebar-item" title="Hospitals">
          <i className="bi bi-hospital"></i>
          <span>Hospitals</span>
        </Link>
      </aside>

      {/* Main Content */}
      <div className="dashboard-main">
        <header className="dashboard-header">
          <h1 className="header">MamaSync</h1>
          <div className="global-icons">
            <Link to="/profile" title="Profile">
              <i className="bi bi-person-circle"></i>
            </Link>
          </div>
          
        </header>

        {/* This renders the nested page content */}
        <div className="dashboard-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
