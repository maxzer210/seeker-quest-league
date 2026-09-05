// Headless model of the new syncScore reconciliation.
// Server mirrors apply_orb_delta: applies the delta unless a cap refuses it.

const DAY_CAP = 30_000_000;

function makeServer(start) {
  let bal = start, earnedToday = 0;
  return {
    get balance() { return bal; },
    apply(delta) {
      if (delta > 0 && earnedToday + delta > DAY_CAP) return { ok: false, balance: bal };
      if (delta < 0 && bal + delta < 0)                 return { ok: false, balance: bal };
      if (delta > 0) earnedToday += delta;
      bal += delta;
      return { ok: true, balance: bal };
    },
  };
}

function makeClient(server, startLocal, startSynced) {
  let local = startLocal, synced = startSynced, inFlight = false;
  return {
    tap(n) { local += n; },
    get local() { return local; },
    get synced() { return synced; },
    // duringFlight: taps that land while the RPC is in the air
    async sync(duringFlight = 0) {
      if (synced === null) { synced = server.balance; return 'seeded'; }
      if (inFlight) return 'skipped';
      const sent = Math.trunc(local);
      const delta = sent - synced;
      if (delta === 0) return 'noop';
      inFlight = true;
      const res = server.apply(delta);
      local += duringFlight;                 // player kept tapping
      inFlight = false;
      const balance = res.balance;
      synced = balance;
      const correction = balance - sent;
      if (correction !== 0) local = Math.max(0, local + correction);
      return res.ok ? 'ok' : 'refused';
    },
  };
}

let pass = 0, fail = 0;
const check = (name, got, want) => {
  const good = JSON.stringify(got) === JSON.stringify(want);
  good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${good ? '' : `  got ${JSON.stringify(got)} want ${JSON.stringify(want)}`}`);
};

(async () => {
  // 1. Quiet sync: server agrees, nothing moves on screen.
  {
    const s = makeServer(1000), c = makeClient(s, 1000, 1000);
    c.tap(50); await c.sync();
    check('plain earn reaches the server', [c.local, s.balance, c.synced], [1050, 1050, 1050]);
  }

  // 2. The bug that was there: taps during the round trip must survive.
  {
    const s = makeServer(1000), c = makeClient(s, 1000, 1000);
    c.tap(50); await c.sync(30);
    check('taps during the round trip are kept', [c.local, s.balance], [1080, 1050]);
    await c.sync();
    check('...and reach the server on the next sync', [c.local, s.balance], [1080, 1080]);
  }

  // 3. Refusal rolls back exactly the refused amount, not the later taps.
  {
    const s = makeServer(1000), c = makeClient(s, 1000, 1000);
    c.tap(40_000_000);                       // over the day cap
    await c.sync(25);
    check('refused earn is undone', [c.local, s.balance], [1025, 1000]);
    check('  and the baseline follows the server', c.synced, 1000);
  }

  // 4. Spending more than the server thinks you have is refused.
  {
    const s = makeServer(500), c = makeClient(s, 500, 500);
    c.tap(-800); await c.sync();
    // A refused spend means the ORB was never taken, so the player keeps it.
    check('overspend refused, balance untouched', [c.local, s.balance], [500, 500]);
  }

  // 5. No baseline yet: the balance waits instead of being invented.
  {
    const s = makeServer(7777), c = makeClient(s, 2450, null);
    c.tap(100);
    check('first sync only seeds', await c.sync(), 'seeded');
    check('  baseline is the server balance', c.synced, 7777);
    await c.sync();
    check('  then the local difference is sent', [c.local, s.balance], [2550, 2550]);
  }

  // 6. Repeated syncs must not re-send the same earnings.
  {
    const s = makeServer(1000), c = makeClient(s, 1000, 1000);
    c.tap(200);
    await c.sync(); await c.sync(); await c.sync();
    check('earnings are sent once, not three times', s.balance, 1200);
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
