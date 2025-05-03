// scripts/css-loader.mjs
export function resolve(specifier, context, nextResolve) {
  // Handle CSS files
  if (specifier.endsWith('.css')) {
    return {
      shortCircuit: true,
      url: 'data:text/javascript,export default {}'
    };
  }
  
  // Let Node.js handle all other files
  return nextResolve(specifier, context);
}
