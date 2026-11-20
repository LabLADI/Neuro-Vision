// Lista las voces disponibles en tu cuenta de ElevenLabs y tu saldo de caracteres.
// Uso: npm run voces
const h = {'xi-api-key': process.env.ELEVENLABS_API_KEY ?? 'proxy-injected'};
const v = await (await fetch('https://api.elevenlabs.io/v1/voices', {headers: h})).json();
for (const x of v.voices ?? []) console.log(`${x.voice_id}  ${x.name}  [${x.labels?.gender ?? ''} ${x.labels?.accent ?? ''}]`);
const s = await (await fetch('https://api.elevenlabs.io/v1/user/subscription', {headers: h})).json();
if (s.character_limit) console.log(`\nCaracteres usados este mes: ${s.character_count} / ${s.character_limit} (plan ${s.tier})`);
console.log('\nPara cambiar de voz, pon el voice_id en config.json -> voz.voice_id');
