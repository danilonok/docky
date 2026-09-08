import { createServer } from 'vite';
import { createElement as h } from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

// Claims that are true only when the user runs the instance themselves.
// None of these may appear in the hosted edition's rendered output.
const SELF_HOSTED_CLAIMS = [
  'your machine', 'own instance', 'stays on this server', 'never leave',
  'locally', 'Ollama', 'Qdrant', 'Docling', 'self-hosted',
];

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
let failures = 0;
try {
  const { AuthProvider } = await vite.ssrLoadModule('/src/context/AuthContext.jsx');
  const { setConfig } = await vite.ssrLoadModule('/src/config/runtime.js');
  const pages = [['Login', '/src/pages/LoginPage.jsx'], ['Register', '/src/pages/RegisterPage.jsx']];

  for (const edition of ['selfhosted', 'cloud']) {
    setConfig({ edition });
    for (const [name, path] of pages) {
      const Page = (await vite.ssrLoadModule(path)).default;
      const html = renderToString(h(MemoryRouter, null, h(AuthProvider, null, h(Page))));
      const found = SELF_HOSTED_CLAIMS.filter((c) => html.toLowerCase().includes(c.toLowerCase()));

      if (edition === 'cloud' && found.length > 0) {
        failures += 1;
        console.log(`  LEAK  cloud/${name}: ${found.join(', ')}`);
      } else if (edition === 'selfhosted' && found.length === 0) {
        failures += 1;
        console.log(`  EMPTY selfhosted/${name}: no self-hosted claim rendered at all`);
      } else {
        console.log(`  ok    ${edition}/${name} — ${edition === 'cloud' ? 'no self-hosting claims' : found.length + ' claims present'}`);
      }
    }
  }
} finally {
  await vite.close();
}
console.log(failures === 0 ? 'PASS' : `FAIL (${failures})`);
process.exit(failures);
