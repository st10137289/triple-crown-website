console.log("Triple Crown site loaded.");

async function loadSeasons() {
    const status = document.getElementById('status');
    if (status) status.textContent = 'Loading seasons…';

    try {
        const manifest = await fetch('data/seasons/index.json').then(r => {
            if (!r.ok) throw new Error(`Failed to fetch manifest (${r.status})`);
            return r.json();
        });

        const files = Array.isArray(manifest.files) ? manifest.files : [];
        if (files.length === 0) {
            if (status) status.textContent = 'No seasons yet.';
            renderResultsTable([]); // render empty
            return;
        }

        const paths = files.map(name => `data/seasons/${name}`);
        const seasons = await Promise.all(paths.map(async p => {
            const resp = await fetch(p);
            if (!resp.ok) throw new Error(`Failed to fetch ${p} (${resp.status})`);
            return resp.json();
        }));

        if (status) status.textContent = '';
        renderResultsTable(seasons);
    } catch (err) {
        console.error(err);
        if (status) status.textContent = 'Error loading seasons. Check console and JSON.';
        // Optionally still clear the table area
        document.getElementById('results')?.replaceChildren();
    }
}

function renderResultsTable(seasons)
{
    const host = document.getElementById('results');
    const table = document.createElement('table');
    table.innerHTML = `
    <thead>
      <tr>
        <th rowspan="2">Season</th>
        <th colspan="3" class="boys-header">Boys</th>
        <th colspan="3" class="girls-header">Girls</th>
      </tr>
      <tr>
        <th>Boatrace</th>
        <th>Buffalo</th>
        <th>SA Champs</th>
        <th>Boatrace</th>
        <th>Buffalo</th>
        <th>SA Champs</th>
      </tr>
    </thead>
    <tbody></tbody>
    `;
    const tbody = table.querySelector('tbody');

    // sort by startYear descending
    seasons
        .sort((a, b) => b.season.startYear - a.season.startYear)
        .forEach(s => {
            const w = s.winners;
            const row = document.createElement('tr');
            
            const boysSchools = [w.boys.boatrace.school, w.boys.buffalo.school, w.boys.sachamps.school];
            const girlsSchools = [w.girls.boatrace.school, w.girls.buffalo.school, w.girls.sachamps.school];
            
            const boysTriple = boysSchools.every(sch => sch === boysSchools[0]);
            const girlsTriple = girlsSchools.every(sch => sch === girlsSchools[0]);
            
            row.innerHTML = `

        <td>${s.season.label}</td>
        <td class="boys">${w.boys.boatrace.school}</td>
        <td class="boys">${w.boys.buffalo.school}</td>
        <td class="boys">${w.boys.sachamps.school}</td>
        <td class="girls">${w.girls.boatrace.school}</td>
        <td class="girls">${w.girls.buffalo.school}</td>
        <td class="girls">${w.girls.sachamps.school}</td>
      `;

            if (boysTriple) row.classList.add('boys-triple');
            if (girlsTriple) row.classList.add('girls-triple');

            if (boysTriple || girlsTriple) {
                const badge = document.createElement('span');
                badge.className = 'badge';
                badge.textContent =
                    boysTriple && girlsTriple ? '🏆 Boys & Girls Triple Crown' :
                        boysTriple ? '🏆 Boys Triple Crown' :
                            '🏆 Girls Triple Crown';
                row.children[0].appendChild(badge);
            }

            tbody.appendChild(row);
        });

    host.replaceChildren(table);
}

loadSeasons();

/*
//simple text filter
document.getElementById('filter').addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    const rows = document.querySelectorAll('#results tbody tr');
    rows.forEach(row => {
        // check all school cells (skip the first cell = season)
        const cells = Array.from(row.children).slice(1);
        const hit = cells.some(td => td.textContent.toLowerCase().includes(q));
        row.style.display = hit ? '' : 'none';
    });
});
 */