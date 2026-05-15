import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(filename) {
  try {
    const content = readFileSync(resolve(process.cwd(), filename), "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separator = trimmed.indexOf("=");
      if (separator === -1) continue;
      const key = trimmed.slice(0, separator).trim();
      const value = trimmed.slice(separator + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // Optional local env file.
  }
}

loadEnvFile(".env.local");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.SUPERUSER_EMAIL ?? "raul.leon@admin.com";
const password = process.env.SUPERUSER_PASSWORD ?? "Pacifico09@@@";

if (!url || !serviceRoleKey) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local.");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();

if (listError) {
  console.error("No se pudo consultar usuarios:", listError.message);
  process.exit(1);
}

const existing = existingUsers.users.find((user) => user.email === email);
let userId = existing?.id;

if (!userId) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name: "Raul Leon",
    },
  });

  if (error) {
    console.error("No se pudo crear el superusuario:", error.message);
    process.exit(1);
  }

  userId = data.user.id;
  console.log(`Superusuario creado: ${email}`);
} else {
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    password,
    email_confirm: true,
  });

  if (error) {
    console.error("No se pudo actualizar el superusuario:", error.message);
    process.exit(1);
  }

  console.log(`Superusuario existente actualizado: ${email}`);
}

const { error: profileError } = await supabase.from("users").upsert(
  {
    id: userId,
    email,
    name: "Raul Leon",
    role: "superuser",
    membership_level: "premium",
  },
  { onConflict: "id" },
);

if (profileError) {
  console.error("No se pudo guardar el perfil del superusuario:", profileError.message);
  process.exit(1);
}

console.log("Perfil de superusuario listo.");
