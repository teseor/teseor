import { chromium, devices } from "@playwright/test";

const URL = process.env.URL ?? "http://127.0.0.1:4321/components/divider";

const DESKTOP = devices["Desktop Chrome"];
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...DESKTOP });
const page = await ctx.newPage();
await page.goto(URL);
await page.waitForLoadState("networkidle");

const result = await page.evaluate(() => {
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:absolute;left:-9999px;top:0;width:var(--t-unit);height:0;visibility:hidden";
  document.body.appendChild(probe);
  const unit = probe.getBoundingClientRect().width;
  probe.remove();

  const round = (n) => Math.round(n * 100) / 100;
  const off = (h) => {
    const rem = h % unit;
    return round(Math.min(rem, unit - rem));
  };

  const main = document.querySelector("main");
  const dump = (el, depth = 0) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      tag: el.tagName,
      cls: el.className,
      text: (el.textContent || "").slice(0, 30).replace(/\s+/g, " "),
      h: round(r.height),
      mTop: cs.marginTop,
      mBot: cs.marginBottom,
      pTop: cs.paddingTop,
      pBot: cs.paddingBottom,
      bTop: cs.borderTopWidth,
      bBot: cs.borderBottomWidth,
      off: off(r.height),
      children:
        depth < 4 && el.children.length > 0
          ? [...el.children].map((c) => dump(c, depth + 1))
          : null,
    };
  };

  return {
    unit,
    mainHeight: round(main.getBoundingClientRect().height),
    mainOff: off(main.getBoundingClientRect().height),
    sections: [...main.children].map((s) => dump(s)),
  };
});

console.log(JSON.stringify(result, null, 2));
await browser.close();
