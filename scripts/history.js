// history.js
// Renders the Triple Crown history list with correct badge colours.
// - Handles winner values as strings OR objects { school: "..." }.
// - Prevents false “triples” when values are blank / missing.
// - Applies .badgenowinner (red) when no Triple Crown is awarded.

const DEBUG_HISTORY = false; // set true to see per-season debug in console

async function loadHistory() {
    const status = document.getElementById('history-status');
    if (status) status.textContent = 'Loading history…';

    try {
        const manifest = await fetch('../data/seasons/index.json').then(r => {
            if (!r.ok) throw new Error(`Failed to fetch manifest (${r.status})`);
            return r.json();
        });

        const files = Array.isArray(manifest.files) ? manifest.files : [];
        if (files.length === 0) {
            if (status) status.textContent = 'No seasons yet.';
            renderHistory([]);
            return;
        }

        const paths = files.map(name => `../data/seasons/${name}`);
        const seasons = await Promise.all(paths.map(async p => {
            const resp = await fetch(p);
            if (!resp.ok) throw new Error(`Failed to fetch ${p} (${resp.status})`);
            return resp.json();
        }));

        if (status) status.textContent = '';
        renderHistory(seasons);
    } catch (err) {
        console.error(err);
        if (status) status.textContent = 'Error loading history. Check console and JSON.';
        document.getElementById('history-list')?.replaceChildren();
    }
}

/** Safely get a *display* string for a winner (string | {school} | null/undefined) */
function displaySchool(v) {
    if (!v) return '—';
    if (typeof v === 'string') return v.trim() || '—';
    if (typeof v === 'object' && v.school != null) return String(v.school).trim() || '—';
    return '—';
}

/** Normalise a winner for comparison (lowercase, trimmed; blanks => "") */
function normaliseSchool(v) {
    const d = displaySchool(v);
    return d === '—' ? '' : d.toLowerCase();
}

/** True iff all three are the same AND non-empty (after normalisation) */
function same3NonEmpty(a, b, c) {
    return a && b && c && a === b && b === c;
}

function renderHistory(seasons) {
    const host = document.getElementById('history-list');
    if (!host) {
        console.warn('#history-list not found in DOM');
        return;
    }

    // Newest → oldest (change to a.season.startYear - b.season.startYear for oldest → newest)
    seasons.sort((a, b) => b.season.startYear - a.season.startYear);

    const ul = document.createElement('ul');

    seasons.forEach(s => {
        const w = s.winners || {};

        // Normalised (for comparison)
        const bBoatN = normaliseSchool(w?.boys?.boatrace);
        const bBuffN = normaliseSchool(w?.boys?.buffalo);
        const bSAN   = normaliseSchool(w?.boys?.sachamps);

        const gBoatN = normaliseSchool(w?.girls?.boatrace);
        const gBuffN = normaliseSchool(w?.girls?.buffalo);
        const gSAN   = normaliseSchool(w?.girls?.sachamps);

        const boysTriple  = same3NonEmpty(bBoatN, bBuffN, bSAN);
        const girlsTriple = same3NonEmpty(gBoatN, gBuffN, gSAN);

        // Display (original values preserved for showing)
        const bBoatD = displaySchool(w?.boys?.boatrace);
        const bBuffD = displaySchool(w?.boys?.buffalo);
        const bSAD   = displaySchool(w?.boys?.sachamps);

        const gBoatD = displaySchool(w?.girls?.boatrace);
        const gBuffD = displaySchool(w?.girls?.buffalo);
        const gSAD   = displaySchool(w?.girls?.sachamps);

        let badgeText = '— No Triple Crown awarded —';
        let badgeClass = 'badgenowinner'; // default RED unless we detect a triple

        if (boysTriple && girlsTriple) {
            badgeText  = `🏆 Boys & Girls Triple Crown - ${bSAD} | ${gSAD}`;
            badgeClass = 'badge';
        } else if (boysTriple) {
            badgeText  = `🏆 Boys Triple Crown - ${bSAD}`;
            badgeClass = 'badge';
        } else if (girlsTriple) {
            badgeText  = `🏆 Girls Triple Crown - ${gSAD}`;
            badgeClass = 'badge';
        }

        if (DEBUG_HISTORY) {
            console.log(s.season?.label ?? '(unknown season)', {
                boysTriple, girlsTriple,
                boys: { bBoatN, bBuffN, bSAN, bBoatD, bBuffD, bSAD },
                girls:{ gBoatN, gBuffN, gSAN, gBoatD, gBuffD, gSAD },
                badgeClass, badgeText
            });
        }

        const li = document.createElement('li');
        li.innerHTML = `
      <strong>${s.season?.label ?? `${s.season?.startYear ?? ''}`}</strong>
      <span class="${badgeClass}">${badgeText}</span><br>
      <span class="boys-line"><b>Boys:</b>
        ${bBoatD} (Boatrace),
        ${bBuffD} (Buffalo),
        ${bSAD} (SA Champs)
      </span><br>
      <span class="girls-line"><b>Girls:</b>
        ${gBoatD} (Boatrace),
        ${gBuffD} (Buffalo),
        ${gSAD} (SA Champs)
      </span>
    `;
        ul.appendChild(li);
    });

    host.replaceChildren(ul);
}

// Kick off
loadHistory();