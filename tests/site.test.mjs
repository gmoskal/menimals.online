import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

test("home keeps the panda as its only central content", async () => {
  const component = await readFile(
    new URL("app/_components/site-page.tsx", projectRoot),
    "utf8",
  );

  assert.match(component, /className="panda-stage"/);
  assert.match(component, /src="\/panda\.png"/);
  assert.match(component, /<footer className="footer">/);
});

test("privacy policy is complete in Polish and English", async () => {
  const content = await readFile(
    new URL("app/_lib/site-content.ts", projectRoot),
    "utf8",
  );

  assert.match(content, /Polityka prywatności/);
  assert.match(content, /Privacy policy/);
  assert.match(content, /Menimals nie zakłada kont/);
  assert.match(content, /Menimals does not create accounts/);
});

test("panda asset is present", async () => {
  await access(new URL("public/panda.png", projectRoot));
});
