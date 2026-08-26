/**
 * Parse the login page and exercise sign-in with the real Server Action id.
 *
 *   npx tsx --env-file=.env scripts/test-sign-in-http.ts [baseUrl]
 */

const BASE = process.argv[2] ?? "http://localhost:3000";

function actionIdFromHtml(html: string): string | null {
  const hidden = html.match(
    /name="\$ACTION_\d+:0" value="(\{[^"]+\})"/,
  );
  if (hidden?.[1]) {
    const decoded = hidden[1]
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&");
    try {
      const payload = JSON.parse(decoded) as { id?: string };
      if (payload.id) return payload.id;
    } catch {
      // fall through
    }
  }

  const patterns = [
    /"\$ACTION_ID_[a-f0-9]+":"([^"]+)"/,
    /\\"\$ACTION_ID_[a-f0-9]+\\":\\"([^\\"]+)\\"/,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

function actionFieldsFromHtml(html: string): Record<string, string> {
  const fields: Record<string, string> = {};
  const inputPattern =
    /<input type="hidden" name="(\$ACTION[^"]+)"(?: value="([^"]*)")?/g;

  for (const match of html.matchAll(inputPattern)) {
    const name = match[1];
    if (!name) continue;
    const value = (match[2] ?? "")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&");
    fields[name] = value;
  }

  return fields;
}

async function main() {
  const loginPage = await fetch(`${BASE}/login`, { redirect: "manual" });
  if (loginPage.status !== 200) {
    throw new Error(`GET /login returned ${loginPage.status}`);
  }

  const html = await loginPage.text();
  const actionId = actionIdFromHtml(html);
  if (!actionId) {
    throw new Error("Could not find Server Action id on /login");
  }

  const initialCookies = loginPage.headers.getSetCookie?.() ?? [];
  const form = new FormData();
  for (const [name, value] of Object.entries(actionFieldsFromHtml(html))) {
    form.set(name, value);
  }
  form.set("email", "ama@adjoacouture.com");
  form.set("password", "fitbyyou123");

  const cookieHeader = initialCookies.map((entry) => entry.split(";")[0]).join("; ");

  const post = await fetch(`${BASE}/login`, {
    method: "POST",
    headers: {
      Accept: "text/x-component",
      "Next-Action": actionId,
      Origin: new URL(BASE).origin,
      Referer: `${BASE}/login`,
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    body: form,
    redirect: "manual",
  });

  const postCookies = post.headers.getSetCookie?.() ?? [];
  const sessionCookie = postCookies.find((entry) => entry.startsWith("fby_session="));

  console.log("POST /login status:", post.status);
  console.log("session cookie set:", Boolean(sessionCookie));

  const body = await post.text();
  const redirectTo = body.match(/"redirectTo":"([^"]+)"/)?.[1];
  if (redirectTo) console.log("redirectTo:", redirectTo);

  const location = post.headers.get("location");
  if (location) console.log("redirect:", location);

  if (!sessionCookie) {
    if (body.includes("Those details do not match")) {
      console.error("FAIL: credentials rejected — run npm run db:seed");
    } else if (body.includes("Something went wrong")) {
      console.error("FAIL: server error during sign-in");
    } else if (body.includes("Failed to find Server Action")) {
      console.error("FAIL: stale Server Action id — rebuild and restart the server");
    } else {
      console.error("FAIL: no session cookie (Secure flag on http?)");
      console.error(body.slice(0, 400));
    }
    process.exit(1);
  }

  const allCookies = [...initialCookies, ...postCookies]
    .map((entry) => entry.split(";")[0])
    .join("; ");

  const app = await fetch(`${BASE}/app`, {
    headers: { cookie: allCookies },
    redirect: "manual",
  });

  console.log("GET /app status:", app.status);
  const appBody = app.status === 200 ? await app.text() : "";
  const ok =
    app.status === 200 &&
    !appBody.includes("Application error") &&
    !appBody.includes("__next_error__");

  console.log(ok ? "PASS: signed in and reached dashboard" : "FAIL: dashboard did not load");
  process.exit(ok ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
