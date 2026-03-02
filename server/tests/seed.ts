import db from "../src/db";
import { createUser } from "../src/user/user.service";

const ADMIN_EMAIL = "admin@tickr.com";
const ADMIN_PASSWORD = "admin1234567";

const USER_EMAIL = "user@tickr.com";
const USER_PASSWORD = "user1234567!";

async function seed() {
  // Create admin user
  const existing = await db.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (existing) {
    console.log(`Admin user already exists: ${ADMIN_EMAIL}`);
  } else {
    const { user: admin } = await createUser({
      email: ADMIN_EMAIL,
      name: "Admin",
      password: ADMIN_PASSWORD,
    });
    await db.user.update({
      where: { id: admin.id },
      data: { role: "ADMIN" },
    });
    console.log(`Created admin user: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  }

  // Create regular test user
  const existingUser = await db.user.findUnique({
    where: { email: USER_EMAIL },
  });
  if (existingUser) {
    console.log(`Test user already exists: ${USER_EMAIL}`);
  } else {
    await createUser({
      email: USER_EMAIL,
      name: "Test User",
      password: USER_PASSWORD,
    });
    console.log(`Created test user: ${USER_EMAIL} / ${USER_PASSWORD}`);
  }
}

await seed();
