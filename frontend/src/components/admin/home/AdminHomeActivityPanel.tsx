import React from 'react';

interface AdminHomeActivityItem {
  label: React.ReactNode;
  time: string;
}

interface AdminHomeActivityPanelProps {
  title: string;
  activities: AdminHomeActivityItem[];
}

const AdminHomeActivityRow: React.FC<AdminHomeActivityItem> = ({ label, time }) => (
  <div className="admin-home__activity-row">
    <span className="admin-home__activity-dot" />
    <span className="admin-home__activity-label">{label}</span>
    <span className="admin-home__activity-time">{time}</span>
  </div>
);

const AdminHomeActivityPanel: React.FC<AdminHomeActivityPanelProps> = ({ title, activities }) => (
  <div className="admin-home__panel">
    <h2 className="admin-home__panel-title">{title}</h2>
    {activities.map((activity) => (
      <AdminHomeActivityRow key={`${activity.time}-${String(activity.label)}`} {...activity} />
    ))}
  </div>
);

export default AdminHomeActivityPanel;
