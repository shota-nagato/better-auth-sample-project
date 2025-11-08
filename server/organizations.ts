"use server";

import { db } from "@/db/drizzle";
import { getCurrentUser } from "./users";
import { eq, inArray } from "drizzle-orm/sql/expressions";
import { member } from "@/db/schema";
import { organization } from "@/db/schema";

export async function getOrganizations() {
  const { currentUser } = await getCurrentUser();

  const members = await db.query.member.findMany({
    where: eq(member.userId, currentUser.id)
  })

  const organizations = await db.query.organization.findMany({
    where: inArray(organization.id, members.map((member) => member.organizationId))
  })

  return organizations;
}

export async function getActiveOrganization(userId: string) {
    const memberUser = await db.query.member.findFirst({
        where: eq(member.userId, userId),
    });

    if (!memberUser) {
        return null;
    }

    const activeOrganization = await db.query.organization.findFirst({
        where: eq(organization.id, memberUser.organizationId),
    });

    return activeOrganization;
}
