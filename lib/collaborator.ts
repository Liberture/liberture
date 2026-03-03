import { prisma } from '@/lib/prisma'

/**
 * Check if a pubkey (hex format) belongs to a whitelisted collaborator.
 * Used by the indexer to auto-set `published = true` for whitelisted authors.
 */
export async function isWhitelisted(pubkeyHex: string): Promise<boolean> {
  const collab = await prisma.collaborator.findUnique({
    where: { pubkeyHex },
    select: { isActive: true }
  })
  return collab?.isActive === true
}

/**
 * Get collaborator by their hex pubkey.
 */
export async function getCollaboratorByPubkey(pubkeyHex: string) {
  return prisma.collaborator.findUnique({
    where: { pubkeyHex }
  })
}

/**
 * Get all active collaborators.
 */
export async function getActiveCollaborators() {
  return prisma.collaborator.findMany({
    where: { isActive: true },
    orderBy: { approvedAt: 'desc' }
  })
}
