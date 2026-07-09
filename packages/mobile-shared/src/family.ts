import { apiGet, apiPost } from './api';
import { getMe } from './auth';

export interface FamilyMember {
  id: string;
  memberUserId: string;
  relation: string;
  label?: string | null;
  member?: {
    firstName: string;
    lastName: string;
    phone?: string | null;
    guzoId?: string | null;
  } | null;
}

export async function listFamilyMembers(): Promise<FamilyMember[]> {
  const me = await getMe();
  return apiGet<FamilyMember[]>(`/family/${me.id}`);
}

export function linkFamilyMember(input: {
  memberUserId: string;
  relation: string;
  label?: string;
}): Promise<FamilyMember> {
  return getMe().then((me) =>
    apiPost<FamilyMember>('/family/link', {
      ownerUserId: me.id,
      memberUserId: input.memberUserId,
      relation: input.relation,
      label: input.label,
    }),
  );
}
