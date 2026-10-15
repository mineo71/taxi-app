const { TARIFFS, calculatePrice, formatUah } = window.TaxiShared;

const $ = (id) => document.getElementById(id);

const KPIS = [
  { label: 'Trips today', value: '1,284' },
  { label: 'Price → order conversion', value: '71%' },
  { label: 'Cancellations', value: '6.4%' },
  { label: 'Service revenue', value: formatUah(58210) },
];

const drivers = [
  { name: 'Ihor T.', car: 'Toyota Camry · AA 7001 BE', docs: 'Licence, registration', status: 'pending' },
  { name: 'Olena M.', car: 'Kia Niro · KA 4512 IO', docs: 'Licence, registration, insurance', status: 'pending' },
  { name: 'Serhii P.', car: 'Renault Logan · AI 0098 KM', docs: 'Complaint: rude behaviour', status: 'complaint' },
];

const trips = [
  { id: 10421, passenger: 'Mariia', driver: 'Andrii K.', route: 'Khreshchatyk → Railway Station', status: 'On trip', price: 142 },
  { id: 10422, passenger: 'Taras', driver: 'Oleh D.', route: 'Podil → KPI', status: 'Driving to pickup', price: 168 },
  { id: 10423, passenger: 'Iryna', driver: '—', route: 'Obolon → Airport', status: 'Searching', price: 690 },
];

function renderKpis() {
  $('kpis').innerHTML = KPIS
    .map((k) => `<div class="card"><div class="muted">${k.label}</div><div class="kpi">${k.value}</div></div>`)
    .join('');
}

function renderTariffs() {
  $('tariffs').innerHTML = Object.entries(TARIFFS)
    .map(([key, t]) => `
      <tr>
        <td>${t.label}</td>
        <td><input type="number" min="0" value="${t.base}" data-key="${key}" data-field="base"></td>
        <td><input type="number" min="0" value="${t.perKm}" data-key="${key}" data-field="perKm"></td>
        <td><b>${formatUah(calculatePrice({ tariff: key, km: 5, minutes: 15 }))}</b></td>
      </tr>`)
    .join('');
}

function renderDrivers() {
  $('drivers').innerHTML = drivers
    .map((d, i) => {
      const actions = d.status === 'pending' || d.status === 'complaint'
        ? `<button class="btn secondary" data-i="${i}" data-action="approve">${d.status === 'complaint' ? 'Dismiss complaint' : 'Approve'}</button>
           <button class="btn danger" data-i="${i}" data-action="block">Block</button>`
        : `<span class="badge ${d.status === 'approved' ? 'ok' : 'warn'}">${d.status === 'approved' ? 'Active' : 'Blocked'}</span>`;
      return `<tr><td>${d.name}<br><span class="muted">${d.car}</span></td><td>${d.docs}</td><td><div class="row">${actions}</div></td></tr>`;
    })
    .join('');
}

function renderTrips() {
  $('trips').innerHTML = trips
    .map((t) => `<tr><td>${t.id}</td><td>${t.passenger}</td><td>${t.driver}</td><td>${t.route}</td>
      <td><span class="badge">${t.status}</span></td><td>${formatUah(t.price)}</td></tr>`)
    .join('');
}

$('tariffs').addEventListener('change', (e) => {
  const { key, field } = e.target.dataset;
  if (!key) return;
  TARIFFS[key][field] = Number(e.target.value);
  renderTariffs();
});

$('drivers').addEventListener('click', (e) => {
  const { i, action } = e.target.dataset;
  if (i === undefined) return;
  drivers[i].status = action === 'approve' ? 'approved' : 'blocked';
  renderDrivers();
});

renderKpis();
renderTariffs();
renderDrivers();
renderTrips();
