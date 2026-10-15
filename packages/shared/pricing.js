// Shared tariffs and price calculation used by all prototypes.
// Loaded as a classic script so pages work from file:// without a server.
(function (global) {
  const TARIFFS = {
    economy: { label: 'Economy', base: 45, perKm: 11, perMin: 2, waitPerMin: 3, minFare: 70 },
    comfort: { label: 'Comfort', base: 60, perKm: 14, perMin: 3, waitPerMin: 4, minFare: 95 },
    business: { label: 'Business', base: 110, perKm: 22, perMin: 5, waitPerMin: 6, minFare: 180 },
  };

  const EXTRAS = {
    childSeat: { label: 'Child seat', price: 30 },
    pet: { label: 'Pet transport', price: 40 },
  };

  const PLATFORM_COMMISSION = 0.15;
  const FREE_CANCEL_SECONDS = 120;
  const CANCEL_FEE = 50;

  // Demand / supply ratio -> price multiplier (FR-36).
  function surgeMultiplier(demand, supply) {
    if (supply <= 0) return 2;
    const ratio = demand / supply;
    if (ratio <= 1) return 1;
    return Math.min(2, Math.round((1 + (ratio - 1) * 0.5) * 10) / 10);
  }

  // FR-5, FR-37: estimate before the trip, final price after it.
  function calculatePrice({ tariff, km, minutes, waitMinutes = 0, extras = [], surge = 1 }) {
    const t = TARIFFS[tariff];
    if (!t) throw new Error('Unknown tariff: ' + tariff);
    const paidWait = Math.max(0, waitMinutes - 3);
    const ride = t.base + t.perKm * km + t.perMin * minutes + t.waitPerMin * paidWait;
    const extrasSum = extras.reduce((sum, key) => sum + (EXTRAS[key] ? EXTRAS[key].price : 0), 0);
    return Math.round(Math.max(t.minFare, ride * surge) + extrasSum);
  }

  // Cancellation handler logic (C3: "Cancellation handler").
  function cancellationFee({ secondsSinceAccepted, driverArrived }) {
    if (driverArrived) return CANCEL_FEE;
    return secondsSinceAccepted > FREE_CANCEL_SECONDS ? CANCEL_FEE : 0;
  }

  function driverEarnings(price) {
    return Math.round(price * (1 - PLATFORM_COMMISSION));
  }

  function formatUah(value) {
    return '₴' + value.toLocaleString('en-US');
  }

  global.TaxiShared = {
    TARIFFS,
    EXTRAS,
    PLATFORM_COMMISSION,
    FREE_CANCEL_SECONDS,
    surgeMultiplier,
    calculatePrice,
    cancellationFee,
    driverEarnings,
    formatUah,
  };
})(typeof window !== 'undefined' ? window : globalThis);
