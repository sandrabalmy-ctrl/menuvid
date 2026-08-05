import { db } from "@/lib/db";

export type LoyaltyMember = {
  name: string | null;
  email: string;
  points: number;
  joinedAt: Date;
  lastVisit: Date;
};

// Vue des membres fidélité d'un restaurant (pour le back-office).
export async function getLoyaltyMembers(restaurantId: string, threshold: number) {
  const memberships = await db.loyaltyMembership.findMany({
    where: { restaurantId },
    include: { customer: { select: { name: true, email: true } } },
    orderBy: { points: "desc" },
  });

  const members: LoyaltyMember[] = memberships.map((m) => ({
    name: m.customer.name,
    email: m.customer.email,
    points: m.points,
    joinedAt: m.createdAt,
    lastVisit: m.updatedAt,
  }));

  return {
    count: members.length,
    totalPoints: members.reduce((s, m) => s + m.points, 0),
    rewardsReady: members.filter((m) => m.points >= threshold).length,
    members,
  };
}
