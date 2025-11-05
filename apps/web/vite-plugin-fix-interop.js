/**
 * Plugin Rollup personnalisé pour corriger le bug _interopRequireDefault
 * 
 * Le problème : Rollup génère parfois :
 *   var _interopRequireDefault$3 = _interopRequireDefault$4.default;
 * 
 * Mais _interopRequireDefault$4 est une fonction, pas un objet avec .default
 * 
 * Solution : Remplacer ces assignations incorrectes par l'utilisation directe de la fonction
 */
export default function fixInteropRequireDefault() {
  return {
    name: 'fix-interop-require-default',
    renderChunk(code, chunk, options) {
      let modified = false;
      let fixed = code;
      
      // Pattern pour trouver les assignations incorrectes
      // Exemple: var _interopRequireDefault$3 = _interopRequireDefault$4.default;
      // Supporte aussi: const, let, et sans le $ dans le nom de la variable
      const pattern = /(?:var|const|let)\s+(_interopRequireDefault(?:\$\d+)?)\s*=\s*(_interopRequireDefault\$\d+)\.default\s*;/g;
      
      // Remplacer par l'utilisation directe de la fonction
      fixed = fixed.replace(pattern, (match, varName, funcName) => {
        // Vérifier que funcName est bien défini dans le code comme une fonction
        const escapedFuncName = funcName.replace(/\$/g, '\\$');
        const funcDefPattern = new RegExp(`function\\s+${escapedFuncName}\\s*\\(`, 'g');
        
        if (funcDefPattern.test(code)) {
          modified = true;
          // Si c'est une fonction, utiliser directement la fonction
          return `var ${varName} = ${funcName};`;
        }
        return match;
      });
      
      // Si le code a été modifié, retourner le nouveau code
      if (modified) {
        console.log(`[fix-interop-require-default] Fixed ${chunk.fileName}`);
        return {
          code: fixed,
          map: null // Pas de sourcemap pour ce fix
        };
      }
      
      return null; // Pas de modification
    }
  };
}

