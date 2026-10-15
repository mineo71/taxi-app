const { TARIFFS, calculatePrice, driverEarnings, formatUah } = window.TaxiShared;

const $ = (id) => document.getElementById(id);

const OFFER_SECONDS = 15;

const ORDERS = [
  { from: '22 Khreshchatyk St', to: 'Central Railway Station', pickupKm: 1.2, km: 4.2, minutes: 12, tariff: 'economy', pay: 'Card' },
  { from: '5 Peremohy Ave', to: 'Ocean Plaza Mall', pickupKm: 3.4, km: 6.8, minutes: 18, tariff: 'comfort', pay: 'Cash' },
  { from: '70 Saksahanskoho St', to: 'Boryspil Airport', pickupKm: 0.8, km: 35, minutes: 45, tariff: 'business', pay: 'Card' },
  { from: '4 Kontraktova Sq', to: 'Igor Sikorsky KPI', pickupKm: 4.6, km: 7.5, minutes: 20, tariff: 'economy', pay: 'Cash' },
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
    $('toast').textContent = 'No orders match your filters';
    return scheduleOffer(4000);
  }
  $('toast').textContent = '';
  const order = candidates[Math.floor(Math.random() * candidates.length)];
  state.offer = { ...order, price: calculatePrice({ tariff: order.tariff, km: order.km, minutes: order.minutes }) };
  state.offered += 1;

  $('offerBody').innerHTML = `
    <div>📍 ${order.from} <span class="muted">(${order.pickupKm} km away)</span></div>
    <div>🏁 ${order.to} <span class="muted">· ${order.km} km · ~${order.minutes} min</span></div>
    <div style="margin-top:6px"><b>${formatUah(state.offer.price)}</b>
      <span class="muted">· ${TARIFFS[order.tariff].label} · ${order.pay}</span></div>`;
  $('offerCard').classList.remove('hidden');

  let left = OFFER_SECONDS;
  const tick = () => {
    $('offerTimer').textContent = `${left} s`;
    $('offerProgress').style.width = (left / OFFER_SECONDS) * 100 + '%';
    if (left-- <= 0) declineOffer('Response time is over');
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
  $('toast').textContent = reason || 'Order skipped';
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
    $('tripBadge').textContent = 'Driving to pickup';
    $('tripBody').textContent = `Passenger is waiting · ${trip.pickupKm} km · payment: ${trip.pay}`;
    $('tripAction').textContent = 'Arrived';
  }
  if (stage === 'waiting') {
    state.waitMinutes = 0;
    $('tripBadge').textContent = 'Waiting';
    $('tripAction').textContent = 'Start trip';
    // One prototype second = one minute of waiting (FR-25).
    const tick = () => {
      const paid = Math.max(0, state.waitMinutes - 3);
      $('tripBody').textContent = `Waiting ${state.waitMinutes} min` + (paid ? ` · paid waiting ${paid} min` : ' · free for up to 3 min');
      state.waitMinutes += 1;
    };
    tick();
    state.waitTimer = setInterval(tick, 1000);
  }
  if (stage === 'riding') {
    clearInterval(state.waitTimer);
    $('tripBadge').textContent = 'On trip';
    $('tripBody').textContent = `${trip.km} km · ~${trip.minutes} min`;
    $('tripAction').textContent = 'Complete';
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
  state.trips.unshift(`${trip.from} → ${trip.to}: ${formatUah(price)}, your earnings ${formatUah(earned)}`);
  state.trip = null;
  state.stage = null;
  $('tripCard').classList.add('hidden');
  $('toast').textContent = 'Trip completed. Passenger rated ★5';
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
  $('onlineLabel').textContent = state.online ? 'Online' : 'Offline';
  if (state.online) {
    $('toast').textContent = 'Looking for nearby orders…';
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
  $('toast').textContent = `Route to "${$('tripTitle').textContent}" opened in navigation`;
});

$('withdrawBtn').addEventListener('click', () => {
  if (!state.balance) return ($('toast').textContent = 'Nothing to withdraw');
  $('toast').textContent = `Withdrawal of ${formatUah(state.balance)} to your card requested`;
  state.balance = 0;
  renderStats();
});

renderStats();
