import fs from 'fs'
import path from 'path'

// --- File paths ---
const importMapUtilFile = path.join(
  'node_modules',
  'payload',
  'dist',
  'bin',
  'generateImportMap',
  'utilities',
  'addPayloadComponentToImportMap.js',
)

const indexFile = path.join(
  'node_modules',
  'payload',
  'dist',
  'bin',
  'generateImportMap',
  'index.js',
)

// --- Patch addPayloadComponentToImportMap.js ---
let utilCode = fs.readFileSync(importMapUtilFile, 'utf8')

const utilOriginal =
  "const importIdentifier = exportName + '_' + crypto.createHash('md5').update(componentPath).digest('hex');"

const utilPatch = `
if (!componentPath) {
  console.error('\\n[DEBUG_PATCH] ❌ componentPath is undefined!');
  console.error('[DEBUG_PATCH] label:', label);
  console.error('[DEBUG_PATCH] exportName:', exportName);
  console.error('[DEBUG_PATCH] typeof payloadComponent:', typeof payloadComponent);
  console.error('[DEBUG_PATCH] payloadComponent (stringified):', JSON.stringify(payloadComponent, null, 2));
  console.error('[DEBUG_PATCH] Stack Trace:');
  console.error(new Error().stack);
  throw new Error('generateImportMap failed: componentPath is undefined');
}
const importIdentifier = exportName + '_' + crypto.createHash('md5').update(componentPath).digest('hex'); // DEBUG_PATCH
`.trim()

if (!utilCode.includes('[DEBUG_PATCH]')) {
  utilCode = utilCode.replace(utilOriginal, utilPatch)
  fs.writeFileSync(importMapUtilFile, utilCode, 'utf8')
  console.log('✅ Patched addPayloadComponentToImportMap.js')
} else {
  console.log('🟡 Already patched: addPayloadComponentToImportMap.js')
}

// --- Patch index.js ---
let indexCode = fs.readFileSync(indexFile, 'utf8')

const indexOriginal = `if (Array.isArray(payloadComponent)) {
            for (const component of payloadComponent){
                addPayloadComponentToImportMap({
                    importMap,
                    importMapToBaseDirPath,
                    imports,
                    payloadComponent: component
                });
            }
        } else {
            addPayloadComponentToImportMap({
                importMap,
                importMapToBaseDirPath,
                imports,
                payloadComponent
            });
        }`

const indexPatch = `if (Array.isArray(payloadComponent)) {
  for (let i = 0; i < payloadComponent.length; i++) {
    const component = payloadComponent[i];
    addPayloadComponentToImportMap({
      importMap,
      importMapToBaseDirPath,
      imports,
      payloadComponent: component,
      label: '[array] index=' + i // DEBUG_LABEL_PATCH
    });
  }
} else {
  addPayloadComponentToImportMap({
    importMap,
    importMapToBaseDirPath,
    imports,
    payloadComponent,
    label: '[single]' // DEBUG_LABEL_PATCH
  });
}`

if (!indexCode.includes('[DEBUG_LABEL_PATCH]')) {
  indexCode = indexCode.replace(indexOriginal, indexPatch)
  fs.writeFileSync(indexFile, indexCode, 'utf8')
  console.log('✅ Patched index.js')
} else {
  console.log('🟡 Already patched: index.js')
}
