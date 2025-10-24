// scripts/timeline.js
document.addEventListener("DOMContentLoaded", loadTimeline);

const FIELDS = ["boatrace", "buffalo", "sachamps"];
const $ = (sel, root = document) => root.querySelector(sel);

// Triple Crown logic: ONLY compare school names (ignore years entirely)
function tripleCrownSchool(side) {
    if (!side) return null;
    const schools = FIELDS.map(k => side?.[k]?.school).filter(Boolean);
    if (schools.length !== FIELDS.length) return null;        // must have all 3
    return schools.every(s => s === schools[0]) ? schools[0] : null;
}

// One row: Boys | Year | Girls  (no summaries)
function rowHTML(yearLabel, boysSide, girlsSide){
    const FIELDS = ["boatrace","buffalo","sachamps"];
    const tc = side => {
        if(!side) return null;
        const schools = FIELDS.map(k => side?.[k]?.school).filter(Boolean);
        return (schools.length === 3 && schools.every(s => s === schools[0])) ? schools[0] : null;
    };

    const boysTC  = tc(boysSide);
    const girlsTC = tc(girlsSide);

    const boysBadge  = boysTC  ? '<span class="badge win">Triple Crown</span>' : '<span class="badge no">No Triple Crown</span>';
    const girlsBadge = girlsTC ? '<span class="badge win">Triple Crown</span>' : '<span class="badge no">No Triple Crown</span>';

    return `
    <div class="row">
      <div class="side boys">
        <div>
          <div class="label">Boys</div>
          <div class="name">${boysTC || 'No Triple Crown'}</div>
        </div>
        ${boysBadge}
      </div>

      <div class="yearcell">
        <div class="year">${yearLabel}</div>
        <div class="vr" aria-hidden="true"></div>
      </div>

      <div class="side girls">
        <div>
          <div class="label">Girls</div>
          <div class="name">${girlsTC || 'No Triple Crown'}</div>
        </div>
        ${girlsBadge}
      </div>
    </div>`;
}

async function fetchJSON(path) {
    const r = await fetch(path, { cache: "no-store" });
    if (!r.ok) throw new Error(`Fetch failed: ${path} (${r.status})`);
    return r.json();
}

async function loadTimeline() {
    const host = $("#timeline");
    try {
        // Manifest lists the season files to load
        const manifest = await fetchJSON("data/seasons/index.json");
        const files = Array.isArray(manifest.files) ? manifest.files.slice() : [];
        if (!files.length) {
            host.innerHTML = '<div class="empty">index.json has no "files" entries.</div>';
            return;
        }

        // newest first if filenames are like 2025.json, 2024.json, ...
        files.sort().reverse();

        const seasons = [];
        for (const f of files) {
            try { seasons.push(await fetchJSON(`data/seasons/${f}`)); }
            catch (e) { console.warn("Skip", f, e); }
        }
        if (!seasons.length) {
            host.innerHTML = '<div class="empty">No season files could be loaded.</div>';
            return;
        }

        host.innerHTML = seasons.map(s => {
            const label = s?.season?.label || s?.season?.endYear || s?.season?.startYear || "Year";
            return rowHTML(label, s?.winners?.boys, s?.winners?.girls);
        }).join("");

    } catch (err) {
        console.error(err);
        host.innerHTML = `<div class="empty">${err.message}</div>`;
    }
}
