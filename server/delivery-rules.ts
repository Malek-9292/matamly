export type AreaRule = {
  id: number;
  name: string;
  active: boolean;
  minimumOrder: number;
  deliveryFee: number;
};

export type GroupRule = {
  id: number;
  name: string;
  active: boolean;
  minimumOrder: number;
  deliveryFee: number;
  areaIds: number[];
};

export type ResolvedArea = AreaRule & {
  available: boolean;
  groupId: number | null;
  groupName: string;
  minimumOrder: number;
  deliveryFee: number;
};

export function money(value: number) {
  return Math.round(value * 1000) / 1000;
}

export function findAreaConflicts(
  areaIds: number[],
  memberships: { areaId: number; groupId: number }[],
  groupId: number,
) {
  const wanted = new Set(areaIds);
  return memberships.filter((membership) => wanted.has(membership.areaId) && membership.groupId !== groupId);
}

export function resolveAreas(areas: AreaRule[], groups: GroupRule[]): ResolvedArea[] {
  const groupByArea = new Map<number, GroupRule>();
  for (const group of groups) {
    for (const areaId of group.areaIds) {
      if (!groupByArea.has(areaId)) groupByArea.set(areaId, group);
    }
  }
  return areas.map((area) => {
    const group = groupByArea.get(area.id);
    const usesGroup = Boolean(group);
    const minimumOrder = usesGroup ? group!.minimumOrder : area.minimumOrder;
    const deliveryFee = usesGroup ? group!.deliveryFee : area.deliveryFee;
    const available = area.active && (!group || group.active);
    return {
      ...area,
      available,
      groupId: group?.id ?? null,
      groupName: group?.name ?? "",
      minimumOrder: money(minimumOrder),
      deliveryFee: money(deliveryFee),
    };
  });
}

export function resolveDeliverySelection(areaId: number, areas: AreaRule[], groups: GroupRule[]) {
  const resolved = resolveAreas(areas, groups).find((area) => area.id === areaId);
  if (!resolved || !resolved.available) {
    return { ok: false as const, error: "منطقة التوصيل غير متاحة" };
  }
  if (!Number.isFinite(resolved.deliveryFee) || resolved.deliveryFee < 0 || !Number.isFinite(resolved.minimumOrder) || resolved.minimumOrder < 0) {
    return { ok: false as const, error: "إعدادات منطقة التوصيل غير مكتملة" };
  }
  return { ok: true as const, area: resolved };
}
