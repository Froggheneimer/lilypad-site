// Checks the site pages before publishing. Run: node check.mjs
// No dependencies. Exits 1 with one line per problem.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

process.chdir(path.dirname(fileURLToPath(import.meta.url)));

const pairs = [
  ["index.html", "it/index.html", "/", "/it/"],
  ["privacy/index.html", "it/privacy/index.html", "/privacy/", "/it/privacy/"],
  ["delete-account/index.html", "it/delete-account/index.html", "/delete-account/", "/it/delete-account/"],
];
const problems = [];

for (const [en, it, enPath, itPath] of pairs) {
  for (const [file, lang, twin, updated] of [
    [en, "en", itPath, "Last updated"],
    [it, "it", enPath, "Ultimo aggiornamento"],
  ]) {
    if (!fs.existsSync(file)) {
      problems.push(`${file}: missing`);
      continue;
    }
    const html = fs.readFileSync(file, "utf8");
    if (!html.includes(`<html lang="${lang}">`)) problems.push(`${file}: needs <html lang="${lang}">`);
    if (!/<meta name="viewport"/.test(html)) problems.push(`${file}: no viewport meta`);
    if (!/<title>[^<]+<\/title>/.test(html)) problems.push(`${file}: no title`);
    if (/<script/i.test(html)) problems.push(`${file}: has a script`);
    if (/\ssrc=["']?(https?:)?\/\//i.test(html)) problems.push(`${file}: loads something from another host (src)`);
    if (/<link[^>]+href=["']?(https?:)?\/\//i.test(html)) problems.push(`${file}: loads something from another host (link)`);
    if (/@import|url\(/i.test(html)) problems.push(`${file}: CSS @import or url() inside the page`);
    if (!html.includes(`href="${twin}"`)) problems.push(`${file}: no link to its other language ${twin}`);
    const isNotice = file.includes("privacy") || file.includes("delete-account");
    if (isNotice && !html.includes("support@lilypadcare.com")) problems.push(`${file}: no support@lilypadcare.com`);
    if (isNotice && !html.includes(updated)) problems.push(`${file}: no "${updated}" line`);
  }
}

if (fs.existsSync("style.css")) {
  const css = fs.readFileSync("style.css", "utf8");
  if (/@import|url\(/i.test(css)) problems.push("style.css: @import or url() (could load from another host)");
} else problems.push("style.css: missing");

const cname = fs.existsSync("CNAME") ? fs.readFileSync("CNAME", "utf8").trim() : null;
if (cname !== "lilypadcare.com") problems.push(`CNAME: must be exactly lilypadcare.com (found ${cname ?? "nothing"})`);

if (problems.length) {
  for (const p of problems) console.log(p);
  process.exit(1);
}
console.log("All pages OK.");
