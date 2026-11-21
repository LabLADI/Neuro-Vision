// Tu sangre tiene memoria: glucómetro (un día) vs glóbulos rojos (tres meses).
export default (kit) => {
  const { O, room, cam, drift, prog, ease, lerp, clay, rbox, box, cyl, torus, sphere, glass, glow, panel, sign, spill, motes, rng } = kit;
  const ROJO = '#c8283c', AMARILLO = '#f4c430', VERDE = '#12b38a';

  // Glóbulo rojo: disco bicóncavo (anillo grueso + centro delgado)
  const globulo = (g, r = 0.45) => {
    const G = new kit.THREE.Group(); g.add(G);
    torus(G, r * 0.72, r * 0.3, clay(ROJO, { roughness: 0.55 }), 0, 0, 0);
    cyl(G, r * 0.75, r * 0.75, r * 0.22, clay('#a81e31', { roughness: 0.6 }), 0, 0, 0).rotation.x = Math.PI / 2;
    G.children[1].rotation.x = Math.PI / 2;
    return G;
  };
  const cubo = (g, s = 0.16) => rbox(g, s, s, s, s * 0.18, clay(AMARILLO, { roughness: 0.4 }));

  // Glucómetro con pantalla
  const glucometro = (g) => {
    const G = new kit.THREE.Group(); g.add(G);
    rbox(G, 0.62, 1.05, 0.18, 0.08, clay('#e9ecef'), 0, 0.52, 0);
    const scr = panel(G, 0.46, 0.38, (x, w, h) => {
      x.fillStyle = '#c9e7d6'; x.fillRect(0, 0, w, h);
      x.fillStyle = '#123'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.font = `800 ${h * 0.55}px Inter`; x.fillText('98', w * 0.45, h * 0.5);
      x.font = `600 ${h * 0.16}px Inter`; x.fillText('mg/dL', w * 0.82, h * 0.78);
    }, { px: 240 });
    scr.position.set(0, 0.72, 0.095);
    sphere(G, 0.07, clay(VERDE), 0, 0.3, 0.09);
    return G;
  };

  // Calendario de pared que se pinta según cuántos días van
  const calendario = (g, w = 1.6, h = 1.9) => panel(g, w, h, null, { px: 600 });
  const pintaCal = (cal, mes, dias, sombra) => cal.paint((x, w, h) => {
    x.fillStyle = '#fbfaf6'; x.fillRect(0, 0, w, h);
    x.fillStyle = ROJO; x.fillRect(0, 0, w, h * 0.17);
    x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = `800 ${h * 0.09}px Inter`; x.fillText(mes, w / 2, h * 0.085);
    for (let i = 0; i < 35; i++) {
      const c = i % 7, f = Math.floor(i / 7), cx = w * (0.08 + c * 0.13), cy = h * (0.26 + f * 0.15);
      x.fillStyle = i < sombra ? '#f5a25d' : '#eceae4'; x.fillRect(cx, cy, w * 0.11, h * 0.12);
      if (i < dias) { x.fillStyle = '#334'; x.font = `600 ${h * 0.045}px Inter`; x.fillText(String(i + 1), cx + w * 0.055, cy + h * 0.06); }
    }
  });

  const MESES = ['AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE'];

  return {
    b1: {
      build(g) {
        const r = room(g, 'paper', { keyPower: 60, fillPower: 0.9 });
        const t = O.table(g, { color: '#d9d2c5' });
        const m = glucometro(g); m.position.set(0.35, t.top, 0.3); m.rotation.y = -0.15;
        const cal = calendario(g, 1.5, 1.75); cal.position.set(-0.3, 2.55, r.wall.position.z + 0.05);
        const s = spill(g, 2.6, 2.4, '#ffe2b8', 0.45); s.position.set(-0.5, 2.3, r.wall.position.z + 0.03);
        return { m, cal, top: t.top };
      },
      update({ m, cal, top }, t, k, d) {
        const pasa = prog(t, kit.at('sangre'), d, ease.inOut);
        const idx = Math.min(3, Math.floor(pasa * 4));
        pintaCal(cal, MESES[3 - idx], 30, Math.round(pasa * 35));
        m.position.y = top + (1 - prog(t, 0, 0.45, ease.drop)) * 1.2;
        const dr = drift(t, 0.015);
        cam(dr.x, 1.85 + dr.y, lerp(6.6, 7.4, k), -0.1, 1.85, 0, 32);
      },
    },
    b2: {
      build(g) {
        room(g, 'ink', { keyPower: 30, fillPower: 0.5, wallColor: '#3a0d14', floorColor: '#2a0910' });
        const R = rng(7);
        const discos = [...Array(5)].map((_, i) => { const d = globulo(g, 0.42); d.position.set(-1.4 + i * 0.7, 1.4 + (R() - 0.5) * 1.6, -1 - R() * 1.5); d.rotation.set(R(), R(), 0); return d; });
        const cubos = [...Array(12)].map(() => cubo(g, 0.14));
        const seeds = cubos.map(() => [R(), R(), R()]);
        const dust = motes(g, { box: [5, 4, 3], n: 40 });
        return { discos, cubos, seeds, dust };
      },
      update({ discos, cubos, seeds, dust }, t, k, d) {
        dust.set(t);
        discos.forEach((dd, i) => { dd.position.x = -1.6 + i * 0.75 + Math.sin(t * 0.6 + i) * 0.1 - k * 0.6; dd.rotation.y = t * 0.4 + i; });
        const pega = prog(t, kit.at('pega'), kit.at('pega') + 0.8, ease.out);
        cubos.forEach((c, i) => {
          const [a, b, cc] = seeds[i], dd = discos[i % 5];
          const libre = [lerp(-2.5, 2.5, ((t * 0.25 + a) % 1)), 0.4 + b * 2.4, -0.5 - cc * 2];
          const sobre = i % 2 === 0 ? 1 : 0;
          const p = pega * sobre;
          c.position.set(lerp(libre[0], dd.position.x + 0.25, p), lerp(libre[1], dd.position.y + 0.25, p), lerp(libre[2], dd.position.z + 0.3, p));
          c.rotation.set(t + i, t * 0.7 + i, 0);
        });
        const dr = drift(t, 0.03);
        cam(dr.x, 1.5 + dr.y, lerp(5.8, 4.6, k), 0, 1.4, -1.2, 34);
      },
    },
    b3: {
      build(g) {
        room(g, 'clay', { keyPower: 70, fillPower: 0.7, wallColor: '#f1d9d2' });
        const d = globulo(g, 0.8); d.position.set(0, 1.6, 0);
        const sello = cubo(g, 0.3);
        return { d, sello };
      },
      update({ d, sello }, t, k, dur) {
        const golpe = prog(t, kit.at('sello') - 0.35, kit.at('sello'), ease.drop);
        sello.position.set(0.15, lerp(3.4, 1.6 + 0.12, golpe), 0.55);
        sello.rotation.set(0.3, 0.6 - golpe * 0.6, 0);
        const sac = golpe >= 1 ? Math.max(0, 1 - (t - kit.at('sello')) * 4) : 0;
        d.position.y = 1.6 - Math.sin(sac * 12) * 0.03 * sac;
        d.rotation.set(0.25, -0.3 + k * 0.4, 0);
        const dr = drift(t, 0.012);
        cam(dr.x, 1.75 + dr.y, lerp(7.2, 6.2, prog(t, 0, dur, ease.inOut)), 0, 1.7, 0, 32);
      },
    },
    b4: {
      build(g) {
        const r = room(g, 'night', { keyPower: 120, fillPower: 0.6, wallZ: -3 });
        const d = globulo(g, 0.55); d.position.set(0, 0.9, 0.3);
        const cont = panel(g, 1.7, 0.62, null, { px: 700, power: 0.55 }); cont.position.set(0, 2.25, -0.6);
        const s = spill(g, 3.2, 1.6, '#ff8a8a', 0.4); s.position.set(0, 2.3, r.wall.position.z + 0.05);
        return { d, cont };
      },
      update({ d, cont }, t, k) {
        const n = Math.round(120 * prog(t, kit.at('120') - 0.6, kit.at('120') + 0.3, ease.out));
        cont.paint((x, w, h) => {
          x.fillStyle = '#16181f'; x.fillRect(0, 0, w, h);
          x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
          x.font = `800 ${h * 0.62}px Inter`; x.fillText(`${n} DÍAS`, w / 2, h * 0.54);
        });
        d.rotation.set(0.4, t * 0.8, 0.2);
        d.position.y = 0.9 + Math.sin(t * 2) * 0.05;
        const dr = drift(t, 0.015);
        cam(dr.x, 1.65 + dr.y, lerp(7.4, 6.8, k), 0, 1.6, 0, 32);
      },
    },
    b5: {
      build(g) {
        room(g, 'sand', { keyPower: 70, fillPower: 0.8 });
        const repisa = box(g, 3.2, 0.12, 0.7, clay('#c9b18f'), 0, 0.95, 0);
        const discos = [...Array(4)].map((_, i) => { const d = globulo(g, 0.24); d.position.set(-0.84 + i * 0.56, 1.3, 0); d.rotation.x = 0.15; return d; });
        const cubos = [];
        discos.forEach((d, i) => { for (let j = 0; j <= i * 2; j++) { const c = cubo(g, 0.075); cubos.push({ c, i, j, d }); } });
        const barra = panel(g, 2.1, 0.16, null, { px: 600, power: 0.5 }); barra.position.set(0, 2.05, 0);
        return { cubos, barra, discos, repisa };
      },
      update({ cubos, barra, discos }, t, k) {
        cubos.forEach(({ c, i, j, d }) => {
          const a = (j / 7) * Math.PI * 2, on = prog(t, 0.2 + i * 0.5 + j * 0.06, 0.5 + i * 0.5 + j * 0.06, ease.back);
          c.scale.setScalar(Math.max(0.001, on));
          c.position.set(d.position.x + Math.cos(a) * 0.23, d.position.y + Math.sin(a) * 0.23, 0.1);
        });
        const llen = prog(t, 0.2, 2.6, ease.inOut);
        barra.paint((x, w, h) => { x.fillStyle = '#eadfcb'; x.fillRect(0, 0, w, h); x.fillStyle = '#e8902e'; x.fillRect(0, 0, w * llen, h); });
        const dr = drift(t, 0.015);
        cam(dr.x, 1.7 + dr.y, lerp(7.8, 7.2, k), 0, 1.65, 0, 32);
      },
    },
    b6: {
      build(g) {
        room(g, 'paper', { keyPower: 60, fillPower: 0.9 });
        const graf = panel(g, 1.9, 1.15, null, { px: 700, power: 0.5 }); graf.position.set(0, 2.45, -0.6);
        const tubo = new kit.THREE.Group(); g.add(tubo);
        cyl(tubo, 0.13, 0.13, 1.1, glass('#ffffff'), 0, 0.55, 0);
        cyl(tubo, 0.11, 0.11, 0.7, clay(ROJO), 0, 0.38, 0);
        cyl(tubo, 0.15, 0.15, 0.2, clay('#7b4bd6'), 0, 1.15, 0);
        const et = sign(tubo, 'HbA1c', { w: 0.5, h: 0.2, color: '#123', bg: '#ffffff' }); et.position.set(0, 0.75, 0.14);
        return { graf, tubo };
      },
      update({ graf, tubo }, t, k) {
        const R = rng(3), pts = [...Array(40)].map((_, i) => 0.5 + Math.sin(i * 0.9) * 0.25 + (R() - 0.5) * 0.3);
        const prom = prog(t, kit.at('promedio') - 0.4, kit.at('promedio') + 0.6, ease.inOut);
        graf.paint((x, w, h) => {
          x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h);
          x.strokeStyle = '#f0a04b'; x.lineWidth = h * 0.02; x.beginPath();
          pts.forEach((p, i) => { const X = w * 0.06 + i * (w * 0.88 / 39), Y = h * (1 - p * 0.8 - 0.1); i ? x.lineTo(X, Y) : x.moveTo(X, Y); }); x.stroke();
          x.strokeStyle = VERDE; x.lineWidth = h * 0.035; x.beginPath(); x.moveTo(w * 0.06, h * 0.5); x.lineTo(w * (0.06 + 0.88 * prom), h * 0.5); x.stroke();
          x.fillStyle = '#123'; x.font = `700 ${h * 0.09}px Inter`; x.textAlign = 'left'; x.fillText('3 meses', w * 0.06, h * 0.12);
        });
        tubo.position.set(0.45, lerp(-1.6, 0.3, prog(t, kit.at('glicosilada') - 0.4, kit.at('glicosilada') + 0.3, ease.back)), 0.6);
        tubo.rotation.y = t * 0.5;
        const dr = drift(t, 0.012);
        cam(dr.x, 1.85 + dr.y, lerp(7.6, 7, k), 0, 1.85, 0, 32);
      },
    },
    b7: {
      build(g) {
        const r = room(g, 'paper', { keyPower: 55, fillPower: 0.9 });
        const t = O.table(g, { color: '#d9d2c5' });
        const m = glucometro(g); m.position.set(0.35, t.top, 0.3); m.rotation.y = -0.15;
        const cal = calendario(g, 1.9, 2.1); cal.position.set(-0.45, 2.4, r.wall.position.z + 0.05);
        return { cal };
      },
      update({ cal }, t, k, d) {
        const s = prog(t, kit.at('historia') - 1.2, kit.at('historia') + 0.3, ease.inOut);
        pintaCal(cal, '3 MESES', 35, Math.round(s * 35));
        const dr = drift(t, 0.015);
        cam(dr.x, 1.9 + dr.y, lerp(7.6, 7, k), -0.1, 1.9, 0, 32);
      },
    },
    b8: {
      build(g) {
        room(g, 'paper', { keyPower: 65, fillPower: 1, wallColor: '#eef6f2' });
        const t = O.table(g, { color: '#e9eef0' });
        const rack = rbox(g, 1.6, 0.18, 0.5, 0.04, clay('#ffffff'), 0, t.top + 0.09, 0.2);
        const tubos = [...Array(5)].map((_, i) => {
          const G = new kit.THREE.Group(); g.add(G);
          cyl(G, 0.09, 0.09, 0.75, glass('#ffffff'), 0, 0.37, 0);
          cyl(G, 0.075, 0.075, 0.45, clay(ROJO), 0, 0.24, 0);
          cyl(G, 0.1, 0.1, 0.14, clay(i === 2 ? VERDE : '#7b4bd6'), 0, 0.78, 0);
          G.position.set(-0.6 + i * 0.3, t.top + 0.1, 0.2); return G;
        });
        const halo = spill(g, 1, 1.4, '#9ff0d6', 0.6); halo.position.set(0, t.top + 0.6, 0.05);
        const img = new Image(); img.src = '/p/ladi.png';
        const logo = panel(g, 1.55, 0.68, null, { px: 800, power: 0.6 }); logo.position.set(0, 2.45, -0.6);
        return { tubos, logo, img, top: t.top };
      },
      update({ tubos, logo, img, top }, t, k) {
        tubos.forEach((tb, i) => { tb.position.y = top + 0.1 + (1 - prog(t, i * 0.08, i * 0.08 + 0.4, ease.drop)) * 1.5; });
        const a = prog(t, kit.at('Laboratorio') - 0.2, kit.at('Laboratorio') + 0.4, ease.out);
        logo.paint((x, w, h) => {
          x.fillStyle = '#eef6f2'; x.fillRect(0, 0, w, h);
          x.globalAlpha = a;
          if (img.complete && img.naturalWidth) x.drawImage(img, 0, 0, w, h);
          else { x.fillStyle = '#34426b'; x.font = `800 ${h * 0.4}px Inter`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('LADI', w / 2, h / 2); }
          x.globalAlpha = 1;
        });
        const dr = drift(t, 0.012);
        cam(dr.x, 1.8 + dr.y, lerp(7.2, 6.8, k), 0, 1.8, 0, 32);
      },
    },
  };
};
