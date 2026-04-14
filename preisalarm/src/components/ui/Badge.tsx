type StatusColor = 'green' | 'yellow' | 'red' | 'gray';

interface BadgeProps {
  color: StatusColor;
  children: React.ReactNode;
}

const colorClasses: Record<StatusColor, string> = {
  green: 'bg-green-100 text-green-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  red: 'bg-red-100 text-red-800',
  gray: 'bg-gray-100 text-gray-700',
};

export function Badge({ color, children }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[color]}`}>
      {children}
    </span>
  );
}

export function StatusDot({ color }: { color: StatusColor }) {
  const dotColors: Record<StatusColor, string> = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-400',
    red: 'bg-red-500',
    gray: 'bg-gray-400',
  };
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${dotColors[color]}`} />;
}
