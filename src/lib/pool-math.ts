import type { PoolState } from "./types";

export type PoolInput = {
  purchasedSlots: number;
  seatPrice: number;
  includedCreditsPerSeat: number;
  overageBudget?: number;
  spent: number;
  activeUsernames: string[];
};

export function computePool(input: PoolInput): PoolState {
  const overageBudget = Math.max(0, input.overageBudget || 0);
  const totalPool =
    input.purchasedSlots * input.includedCreditsPerSeat + overageBudget;
  const fairSharePerSeat = input.includedCreditsPerSeat;
  const activeSeats = input.activeUsernames.length;
  const idleSeats = Math.max(0, input.purchasedSlots - activeSeats);
  const remaining = totalPool - input.spent;
  const percentUsed = totalPool > 0 ? input.spent / totalPool : 0;
  return {
    purchasedSlots: input.purchasedSlots,
    seatPrice: input.seatPrice,
    includedCreditsPerSeat: input.includedCreditsPerSeat,
    overageBudget,
    totalPool,
    spent: input.spent,
    remaining,
    percentUsed,
    fairSharePerSeat,
    activeSeats,
    idleSeats,
  };
}
