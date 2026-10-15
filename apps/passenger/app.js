const { TARIFFS, EXTRAS, calculatePrice, cancellationFee, surgeMultiplier, formatUah } = window.TaxiShared;

const $ = (id) => document.getElementById(id);

// Fake demand / supply in the area -> surge (FR-36).
const surge = surgeMultiplier(14, 10);

const state = {
  tariff: 'economy',
  phase: 'order', // order | searching | assigned | arrived | riding | done
  estimate: 0,
  final: 0,
  rating: 5,
  tip: 0,
  acceptedAt: 0,
  timers: [],
  history: [],
};

function route() {
  const [km, minutes] = $('to').value.split('|').map(Number);
  return { km, minutes };
}

function selectedExtras() {
  return Object.keys(EXTRAS).filter((key) => $('extra-' + key).checked);
}

function promoDiscount(price) {
  return $('promo').value.trim().toUpperCase() === 'START10' ? Math.round(price * 0.1) : 0;
}

function estimateFor(tariff) {
  const { km, minutes } = route();
  const boost = $('boost').checked ? 1.1 : 1;
  const price = calculatePrice({ tariff, km, minutes, extras: selectedExtras(), surge: surge * boost });
  return price - promoDiscount(price);
}

function renderClasses() {
  $('classes').innerHTML = Object.entries(TARIFFS)
    .map(([key, t]) => `
      <div class="class-option ${key === state.tariff ? 'active' : ''}" data-tariff="${key}">
        ${t.label}<b>${formatUah(estimateFor(key))}</b>
      </div>`)
    .join('');
  const { km, minutes } = route();
  $('routeInfo').textContent = `${km} км · ~${minutes} хв`;
  $('surgeBadge').textContent = `Підвищений попит ×${surge}`;
  $('surgeBadge').classList.toggle('hidden', surge === 1);
}

function renderExtras() {
  $('extras').innerHTML = Object.entries(EXTRAS)
    .map(([key, e]) => `
      <label><input type="checkbox" id="extra-${key}" style="width:auto"> ${e.label} (+${formatUah(e.price)})</label>`)
    .join('');
}

function show(view) {
  ['orderView', 'tripView', 'doneView'].forEach((id) => $(id).classList.toggle('hidden', id !== view));
}

function setStatus(title, hint, progress) {
  $('tripStatus').textContent = title;
  $('tripHint').textContent = hint;
  $('tripProgress').style.width = progress + '%';
}

function moveCar(left, top) {
  const car = $('car');
  car.classList.remove('hidden');
  car.style.left = left + '%';
  car.style.top = top + '%';
}

function later(ms, fn) {
  state.timers.push(setTimeout(fn, ms));
}

function clearTimers() {
  state.timers.forEach(clearTimeout);
  state.timers = [];
}

// One prototype second = one minute of the real trip.
function startTrip() {
  state.estimate = estimateFor(state.tariff);
  state.phase = 'searching';
  show('tripView');
  $('driverCard').classList.add('hidden');
  $('toast').textContent = '';
  setStatus('Шукаємо водія…', `Попередня вартість ${formatUah(state.estimate)}`, 5);
  moveCar(8, 12);

  later(2000, () => {
    state.phase = 'assigned';
    state.acceptedAt = Date.now();
    $('driverCard').classList.remove('hidden');
    const path = [[12, 30], [18, 48], [24, 62], [28, 72]];
    path.forEach(([l, t], i) => later(i * 1000, () => {
      moveCar(l, t);
      setStatus('Водій їде до вас', `Прибуде через ${path.length - i} хв`, 15 + i * 7);
    }));
    later(path.length * 1000, arrived);
  });
}

function arrived() {
  state.phase = 'arrived';
  setStatus('Водій на місці', 'Безкоштовне очікування — 3 хв', 45);
  later(2500, ride);
}

function ride() {
  state.phase = 'riding';
  $('cancelBtn').classList.add('hidden');
  const path = [[38, 60], [50, 48], [62, 36], [76, 24]];
  path.forEach(([l, t], i) => later(i * 1000, () => {
    moveCar(l, t);
    setStatus('В дорозі', `До місця призначення ~${(path.length - i) * 3} хв`, 55 + i * 11);
  }));
  later(path.length * 1000, finish);
}

function finish() {
  const { km, minutes } = route();
  const waitMinutes = 4;
  const boost = $('boost').checked ? 1.1 : 1;
  const raw = calculatePrice({
    tariff: state.tariff,
    km: Math.round(km * 1.05 * 10) / 10,
    minutes: minutes + 2,
    waitMinutes,
    extras: selectedExtras(),
    surge: surge * boost,
  });
  state.final = raw - promoDiscount(raw);
  state.phase = 'done';
  $('estimateValue').textContent = formatUah(state.estimate);
  $('finalValue').textContent = formatUah(state.final);
  $('finalBreakdown').textContent = `Фактичний маршрут +5%, платне очікування ${waitMinutes - 3} хв`;
  renderStars();
  show('doneView');
}

function cancelTrip() {
  const fee = state.phase === 'searching'
    ? 0
    : cancellationFee({
        secondsSinceAccepted: ((Date.now() - state.acceptedAt) / 1000) * 60,
        driverArrived: state.phase === 'arrived',
      });
  clearTimers();
  addHistory('Скасовано', fee);
  resetOrder(fee ? `Поїздку скасовано, штраф ${formatUah(fee)}` : 'Поїздку скасовано без штрафу');
}

function renderStars() {
  $('stars').innerHTML = [1, 2, 3, 4, 5]
    .map((n) => `<button data-star="${n}" class="${n <= state.rating ? 'on' : ''}">★</button>`)
    .join('');
}

function addHistory(status, price) {
  const time = new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
  state.history.unshift(
    `${time} · ${$('from').value} → ${$('to').selectedOptions[0].text} · ${TARIFFS[state.tariff].label} · ${status} · ${formatUah(price)}`
  );
  $('history').innerHTML = state.history.map((h) => `<div>🧾 ${h}</div>`).join('');
}

function resetOrder(message) {
  state.phase = 'order';
  $('car').classList.add('hidden');
  $('cancelBtn').classList.remove('hidden');
  show('orderView');
  renderClasses();
  if (message) $('routeInfo').textContent = message;
}

// Events
$('classes').addEventListener('click', (e) => {
  const option = e.target.closest('[data-tariff]');
  if (!option) return;
  state.tariff = option.dataset.tariff;
  renderClasses();
});

['to', 'boost', 'promo', 'extras'].forEach((id) => $(id).addEventListener('change', renderClasses));
$('promo').addEventListener('input', renderClasses);
$('orderBtn').addEventListener('click', startTrip);
$('cancelBtn').addEventListener('click', cancelTrip);

$('driverCard').addEventListener('click', (e) => {
  if (e.target.dataset.msg) $('toast').textContent = e.target.dataset.msg;
});

$('stars').addEventListener('click', (e) => {
  if (!e.target.dataset.star) return;
  state.rating = Number(e.target.dataset.star);
  renderStars();
});

$('tips').addEventListener('click', (e) => {
  if (e.target.dataset.tip === undefined) return;
  state.tip = Number(e.target.dataset.tip);
  [...$('tips').children].forEach((b) => b.classList.toggle('secondary', b !== e.target));
});

$('doneBtn').addEventListener('click', () => {
  addHistory(`★${state.rating}`, state.final + state.tip);
  state.tip = 0;
  [...$('tips').children].forEach((b) => b.classList.add('secondary'));
  resetOrder('Дякуємо за поїздку! Чек надіслано на e-mail');
});

renderExtras();
renderClasses();
