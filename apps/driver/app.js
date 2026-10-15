const { TARIFFS, calculatePrice, driverEarnings, formatUah } = window.TaxiShared;

const $ = (id) => document.getElementById(id);

const OFFER_SECONDS = 15;

const ORDERS = [
  { from: 'вул. Хрещатик, 22', to: 'Залізничний вокзал', pickupKm: 1.2, km: 4.2, minutes: 12, tariff: 'economy', pay: 'Картка' },
  { from: 'просп. Перемоги, 5', to: 'ТРЦ Ocean Plaza', pickupKm: 3.4, km: 6.8, minutes: 18, tariff: 'comfort', pay: 'Готівка' },
  { from: 'вул. Саксаганського, 70', to: 'Аеропорт «Бориспіль»', pickupKm: 0.8, km: 35, minutes: 45, tariff: 'business', pay: 'Картка' },
  { from: 'Контрактова пл., 4', to: 'КПІ', pickupKm: 4.6, km: 7.5, minutes: 20, tariff: 'economy', pay: 'Готівка' },
];

const state = {
  online: false,
  offer: null,
  trip: null,
  stage: null, // toPickup | waiting | riding
  waitMinutes: 0,
  offered: 0,
  accepted: 0,
  balance: 0,
  trips: [],
  offerTimer: null,
  waitTimer: null,
  nextOfferTimeout: null,
};

function matchesFilters(order) {
  const radius = Number($('radius').value);
  const pay = $('payFilter').value;
  return order.pickupKm <= radius && (pay === 'any' || order.pay === pay);
}

function scheduleOffer(delay = 2500) {
  clearTimeout(state.nextOfferTimeout);
  state.nextOfferTimeout = setTimeout(showOffer, delay);
}

function showOffer() {
  if (!state.online || state.trip) return;
  const candidates = ORDERS.filter(matchesFilters);
  if (!candidates.length) {
    $('toast').textContent = 'Немає замовлень за вашими фільтрами';
    return scheduleOffer(4000);
  }
  $('toast').textContent = '';
  const order = candidates[Math.floor(Math.random() * candidates.length)];
  state.offer = { ...order, price: calculatePrice({ tariff: order.tariff, km: order.km, minutes: order.minutes }) };
  state.offered += 1;

  $('offerBody').innerHTML = `
    <div>📍 ${order.from} <span class="muted">(${order.pickupKm} км від вас)</span></div>
    <div>🏁 ${order.to} <span class="muted">· ${order.km} км · ~${order.minutes} хв</span></div>
    <div style="margin-top:6px"><b>${formatUah(state.offer.price)}</b>
      <span class="muted">· ${TARIFFS[order.tariff].label} · ${order.pay}</span></div>`;
  $('offerCard').classList.remove('hidden');

  let left = OFFER_SECONDS;
  const tick = () => {
    $('offerTimer').textContent = `${left} с`;
    $('offerProgress').style.width = (left / OFFER_SECONDS) * 100 + '%';
    if (left-- <= 0) declineOffer('Час на відповідь минув');
  };
  tick();
  state.offerTimer = setInterval(tick, 1000);
}

function closeOffer() {
  clearInterval(state.offerTimer);
  $('offerCard').classList.add('hidden');
  state.offer = null;
}

function declineOffer(reason) {
  closeOffer();
  $('toast').textContent = reason || 'Замовлення пропущено';
  renderStats();
  scheduleOffer();
}

function acceptOffer() {
  state.trip = state.offer;
  state.accepted += 1;
  closeOffer();
  setStage('toPickup');
  renderStats();
}

function setStage(stage) {
  state.stage = stage;
  const trip = state.trip;
  $('tripCard').classList.remove('hidden');
  $('tripTitle').textContent = stage === 'riding' ? trip.to : trip.from;

  if (stage === 'toPickup') {
    $('tripBadge').textContent = 'Їду до пасажира';
    $('tripBody').textContent = `Пасажир чекає · ${trip.pickupKm} км · оплата: ${trip.pay}`;
    $('tripAction').textContent = 'На місці';
  }
  if (stage === 'waiting') {
    state.waitMinutes = 0;
    $('tripBadge').textContent = 'Очікування';
    $('tripAction').textContent = 'Почати поїздку';
    // One prototype second = one minute of waiting (FR-25).
    const tick = () => {
      const paid = Math.max(0, state.waitMinutes - 3);
      $('tripBody').textContent = `Очікування ${state.waitMinutes} хв` + (paid ? ` · платний простій ${paid} хв` : ' · безкоштовно до 3 хв');
      state.waitMinutes += 1;
    };
    tick();
    state.waitTimer = setInterval(tick, 1000);
  }
  if (stage === 'riding') {
    clearInterval(state.waitTimer);
    $('tripBadge').textContent = 'В дорозі';
    $('tripBody').textContent = `${trip.km} км · ~${trip.minutes} хв`;
    $('tripAction').textContent = 'Завершити';
  }
}

function completeTrip() {
  const trip = state.trip;
  const price = calculatePrice({
    tariff: trip.tariff,
    km: trip.km,
    minutes: trip.minutes,
    waitMinutes: Math.max(0, state.waitMinutes - 1),
  });
  const earned = driverEarnings(price);
  state.balance += earned;
  state.trips.unshift(`${trip.from} → ${trip.to}: ${formatUah(price)}, ваш дохід ${formatUah(earned)}`);
  state.trip = null;
  state.stage = null;
  $('tripCard').classList.add('hidden');
  $('toast').textContent = `Поїздку завершено. Оцінку пасажиру поставлено ★5`;
  renderStats();
  scheduleOffer();
}

function renderStats() {
  $('balance').textContent = formatUah(state.balance);
  $('tripsToday').textContent = state.trips.length;
  $('earnings').innerHTML = state.trips.map((t) => `<div>• ${t}</div>`).join('');
  const rate = state.offered ? Math.round((state.accepted / state.offered) * 100) : 96;
  $('acceptRate').textContent = rate;
}

$('onlineToggle').addEventListener('click', () => {
  state.online = !state.online;
  $('onlineToggle').classList.toggle('on', state.online);
  $('onlineLabel').textContent = state.online ? 'На лінії' : 'Не на лінії';
  if (state.online) {
    $('toast').textContent = 'Шукаємо замовлення поблизу…';
    scheduleOffer();
  } else {
    clearTimeout(state.nextOfferTimeout);
    if (state.offer) closeOffer();
    $('toast').textContent = '';
  }
});

$('acceptBtn').addEventListener('click', acceptOffer);
$('declineBtn').addEventListener('click', () => declineOffer());

$('tripAction').addEventListener('click', () => {
  if (state.stage === 'toPickup') setStage('waiting');
  else if (state.stage === 'waiting') setStage('riding');
  else if (state.stage === 'riding') completeTrip();
});

$('navBtn').addEventListener('click', () => {
  $('toast').textContent = `Маршрут до «${$('tripTitle').textContent}» відкрито в навігаторі`;
});

$('withdrawBtn').addEventListener('click', () => {
  if (!state.balance) return ($('toast').textContent = 'Немає коштів для виведення');
  $('toast').textContent = `Заявку на виведення ${formatUah(state.balance)} на картку створено`;
  state.balance = 0;
  renderStats();
});

renderStats();
