import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Seed subscription plans
  const basicPlan = await prisma.subscriptionPlan.upsert({
    where: { id: "plan-basic" },
    update: {},
    create: {
      id: "plan-basic",
      name: "Basic",
      description: "Up to 10 listings per month",
      price: 9.99,
      durationDays: 30,
      maxListings: 10,
      featuredSlots: 0,
    },
  });

  const proPlan = await prisma.subscriptionPlan.upsert({
    where: { id: "plan-pro" },
    update: {},
    create: {
      id: "plan-pro",
      name: "Pro",
      description: "Up to 50 listings with 5 featured slots",
      price: 29.99,
      durationDays: 30,
      maxListings: 50,
      featuredSlots: 5,
    },
  });

  const businessPlan = await prisma.subscriptionPlan.upsert({
    where: { id: "plan-business" },
    update: {},
    create: {
      id: "plan-business",
      name: "Business",
      description: "Unlimited listings with storefront",
      price: 79.99,
      durationDays: 30,
      maxListings: 9999,
      featuredSlots: 20,
    },
  });

  // Seed categories
  const electronics = await prisma.category.upsert({
    where: { slug: "electronics" },
    update: {},
    create: { name: "Electronics", slug: "electronics" },
  });

  const vehicles = await prisma.category.upsert({
    where: { slug: "vehicles" },
    update: {},
    create: { name: "Vehicles", slug: "vehicles" },
  });

  const realEstate = await prisma.category.upsert({
    where: { slug: "real-estate" },
    update: {},
    create: { name: "Real Estate", slug: "real-estate" },
  });

  const fashion = await prisma.category.upsert({
    where: { slug: "fashion" },
    update: {},
    create: { name: "Fashion & Clothing", slug: "fashion" },
  });

  await prisma.category.upsert({
    where: { slug: "mobile-phones" },
    update: {},
    create: {
      name: "Mobile Phones",
      slug: "mobile-phones",
      parentId: electronics.id,
    },
  });

  await prisma.category.upsert({
    where: { slug: "laptops-computers" },
    update: {},
    create: {
      name: "Laptops & Computers",
      slug: "laptops-computers",
      parentId: electronics.id,
    },
  });

  // Seed admin user
  const adminPassword = await bcrypt.hash("Admin@123!", 12);
  await prisma.user.upsert({
    where: { email: "admin@ceylon.lk" },
    update: {},
    create: {
      email: "admin@ceylon.lk",
      passwordHash: adminPassword,
      role: "SUPER_ADMIN",
      verificationLevel: "EMAIL",
      profile: {
        create: {
          firstName: "Super",
          lastName: "Admin",
        },
      },
    },
  });

  console.log("Seed completed:", {
    plans: [basicPlan.name, proPlan.name, businessPlan.name],
    categories: [electronics.name, vehicles.name, realEstate.name, fashion.name],
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
