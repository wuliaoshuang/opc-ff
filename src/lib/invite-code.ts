import type { AuthAccount, User } from '@/types'

type InviteOwner = Pick<AuthAccount, 'id' | 'name' | 'phone' | 'username' | 'ownInviteCode'>

export function normalizeInviteCode(value?: string) {
  return (value ?? '').trim().toUpperCase().replace(/\s+/g, '')
}

export function getPartnerInviteCode(owner: InviteOwner | User) {
  if ('ownInviteCode' in owner && owner.ownInviteCode) {
    return normalizeInviteCode(owner.ownInviteCode)
  }

  const source = 'username' in owner && owner.username ? owner.username : owner.id
  const suffix = source.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase()
  return `OPC-${suffix || 'PARTNER'}`
}
