import Link from 'next/link';
import { ReactNode } from 'react';

interface DashboardCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  href: string;
  color: 'blue' | 'green' | 'purple' | 'gray';
}

const colorClasses = {
  blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
  green: 'bg-green-50 text-green-600 hover:bg-green-100',
  purple: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
  gray: 'bg-gray-50 text-gray-600 hover:bg-gray-100',
};

export default function DashboardCard({
  icon,
  title,
  description,
  href,
  color,
}: DashboardCardProps) {
  return (
    <Link
      href={href}
      className={`${colorClasses[color]} p-6 rounded-lg border-2 border-transparent hover:border-current transition-all transform hover:scale-105 cursor-pointer`}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">{icon}</div>
        <div>
          <h3 className="text-xl font-bold mb-2">{title}</h3>
          <p className="text-sm opacity-80">{description}</p>
        </div>
      </div>
    </Link>
  );
}
