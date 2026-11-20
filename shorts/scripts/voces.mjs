// Lista las voces disponibles en tu cuenta de ElevenLabs y tu saldo de caracteres.
// Uso: npm run voces   (la clave necesita los permisos "Voices: read" y "User: read")
const h = {'xi-api-key': process.env.ELEVENLABS_API_KEY ?? 'proxy-injected'};
const leer = async (url) => {
  const r = await fetch(url, {headers: h});
  const j = await r.json();
  if (!r.ok) console.warn(`⚠️  ${url.split('/v1/')[1]}: ${j?.detail?.message ?? r.status}`);
  return r.ok ? j : null;
};
const v = await leer('https://api.elevenlabs.io/v1/voices');
for (const x of v?.voices ?? []) console.log(`${x.voice_id}  ${x.name}  [${x.labels?.gender ?? ''} ${x.labels?.accent ?? ''}]`);
const s = await leer('https://api.elevenlabs.io/v1/user/subscription');
if (s?.character_limit) console.log(`\nCaracteres usados este mes: ${s.character_count} / ${s.character_limit} (plan ${s.tier})`);
console.log('\nPara cambiar de voz, pon el voice_id en config.json -> voz.voice_id');
