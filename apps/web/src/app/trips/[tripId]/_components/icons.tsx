type IconProps = { className?: string };

function Icon({ children, className }: IconProps & { children: React.ReactNode }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>;
}

export function PlanIcon(props: IconProps) {
  return <Icon {...props}><path d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z"/><path d="m9 15 2 2 4-5"/></Icon>;
}

export function MapIcon(props: IconProps) {
  return <Icon {...props}><path d="m3 6 5-3 8 3 5-3v15l-5 3-8-3-5 3Z"/><path d="M8 3v15M16 6v15"/></Icon>;
}

export function BudgetIcon(props: IconProps) {
  return <Icon {...props}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M16 12h5M7 9h4M7 13h2"/></Icon>;
}

export function PeopleIcon(props: IconProps) {
  return <Icon {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></Icon>;
}

export function PlusIcon(props: IconProps) {
  return <Icon {...props}><path d="M12 5v14M5 12h14"/></Icon>;
}

export function TrashIcon(props: IconProps) {
  return <Icon {...props}><path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v5M14 11v5"/></Icon>;
}

export function PencilIcon(props: IconProps) {
  return <Icon {...props}><path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z"/><path d="m13.5 7.5 3 3"/></Icon>;
}

export function ArrowIcon(props: IconProps) {
  return <Icon {...props}><path d="m15 18-6-6 6-6"/></Icon>;
}
