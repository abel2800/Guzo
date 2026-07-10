'use client';

import { useParams, useRouter } from 'next/navigation';
import { LogOut, User as UserIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';
import { initials } from '@/lib/utils';
import type { RoleSlug } from '@/lib/roles';

export function UserMenu() {
  const router = useRouter();
  const params = useParams();
  const slug = (params.role as RoleSlug) ?? 'customer';
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const refreshToken = useAuthStore((s) => s.refreshToken);

  async function logout() {
    try {
      await api.post('/auth/logout', { refreshToken });
    } catch {}
    clear();
    router.replace('/login');
  }

  function openProfile() {
    router.push(`/dashboard/${slug}/settings`);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="outline-none">
        <Avatar className="border border-border bg-muted/50">
          {user?.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="Profile" /> : null}
          <AvatarFallback className="bg-transparent text-foreground">
            {initials(user?.firstName, user?.lastName)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 border-border bg-guzo-bg/95 backdrop-blur-xl">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">
              {user?.firstName} {user?.lastName}
            </span>
            <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={openProfile} className="cursor-pointer">
          <UserIcon /> Profile & settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
          <LogOut /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
