import React from 'react';

export const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden ${className}`}>
    {children}
  </div>
);

export const CardHeader = ({ title, subtitle, action }) => (
  <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
    <div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);
