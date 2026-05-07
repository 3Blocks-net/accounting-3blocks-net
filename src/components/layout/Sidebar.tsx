'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { href: '/transactions', label: 'Transaktionen', icon: '⇄' },
  { href: '/portfolio', label: 'Portfolio', icon: '◈' },
  { href: '/spam-tokens', label: 'Token Review', icon: '⊘' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 flex flex-col bg-[#0E1116] border-r border-white/[0.06]">
      {/* Wordmark */}
      <div className="px-5 pt-6 pb-5 border-b border-white/[0.06]">
        <span
          className="block text-base font-semibold text-white tracking-tight leading-none"
          style={{ fontFamily: "'Chillax', var(--font-geist-sans, sans-serif)" }}
        >
          3blocks
        </span>
        <span className="block text-[11px] text-[#63749C] mt-1 font-medium tracking-wide">
          Wallet Accounting
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-0.5 p-3 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-[#4568D0] text-white shadow-sm'
                  : 'text-[#63749C] hover:bg-white/[0.05] hover:text-[#A8B4CC]',
              )}
            >
              <span className="text-base leading-none opacity-70">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/[0.06]">
        <span className="text-[10px] text-[#414C66] tracking-wide">
          Internal · No auth
        </span>
      </div>
    </aside>
  );
}
