// ========================================
// TESTS END-TO-END TABLEAUX PERSONNALISÉS
// ========================================

import { test, expect, Page } from '@playwright/test';

// Configuration des tests E2E
test.describe('Tableaux Personnalisés - Tests E2E', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    
    // Connexion utilisateur (à adapter selon votre système d'auth)
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'teacher@test.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // Attendre la redirection
    await page.waitForURL('/dashboard');
    
    // Naviguer vers les tableaux personnalisés
    await page.goto('/tables');
  });

  test.describe('Création de tableau', () => {
    test('doit créer un tableau complet de bout en bout', async () => {
      // Cliquer sur "Nouveau tableau"
      await page.click('[data-testid="create-table-button"]');
      
      // Vérifier l'ouverture du designer
      await expect(page.locator('h2')).toContainText('Nouveau Tableau');
      
      // Remplir les informations de base
      await page.fill('[data-testid="table-name"]', 'Mon Bulletin E2E');
      await page.fill('[data-testid="table-description"]', 'Bulletin créé par test E2E');
      await page.selectOption('[data-testid="table-class"]', '1');
      
      // Ajouter une colonne d'information élève
      await page.hover('[data-testid="add-column-button"]');
      await page.click('[data-testid="add-student-info-column"]');
      
      // Configurer la colonne
      await page.click('[data-testid="column-item-0"]');
      await page.fill('[data-testid="column-label"]', 'Nom de famille');
      await page.selectOption('[data-testid="student-field"]', 'lastName');
      
      // Ajouter une colonne de formule
      await page.hover('[data-testid="add-column-button"]');
      await page.click('[data-testid="add-formula-column"]');
      
      // Configurer la formule
      await page.click('[data-testid="column-item-1"]');
      await page.fill('[data-testid="column-label"]', 'Moyenne Générale');
      await page.fill('[data-testid="formula-expression"]', 'MOYENNE(EVAL_1, EVAL_2)');
      
      // Vérifier l'aperçu
      await expect(page.locator('[data-testid="table-preview"]')).toBeVisible();
      await expect(page.locator('[data-testid="preview-header"]')).toContainText('Nom de famille');
      await expect(page.locator('[data-testid="preview-header"]')).toContainText('Moyenne Générale');
      
      // Sauvegarder
      await page.click('[data-testid="save-table-button"]');
      
      // Vérifier le retour à la liste
      await expect(page.locator('h1')).toContainText('Tableaux Personnalisés');
      await expect(page.locator('[data-testid="table-card"]')).toContainText('Mon Bulletin E2E');
    });

    test('doit valider les champs requis', async () => {
      await page.click('[data-testid="create-table-button"]');
      
      // Essayer de sauvegarder sans nom
      await page.click('[data-testid="save-table-button"]');
      
      // Vérifier le message d'erreur
      await expect(page.locator('[data-testid="error-message"]')).toContainText('nom du tableau est requis');
      
      // Ajouter un nom mais pas de colonnes
      await page.fill('[data-testid="table-name"]', 'Test Validation');
      await page.click('[data-testid="save-table-button"]');
      
      // Vérifier le message d'erreur pour les colonnes
      await expect(page.locator('[data-testid="error-message"]')).toContainText('au moins une colonne');
    });
  });

  test.describe('Gestion des colonnes', () => {
    test('doit permettre de réorganiser les colonnes par drag & drop', async () => {
      await page.click('[data-testid="create-table-button"]');
      
      // Ajouter deux colonnes
      await page.hover('[data-testid="add-column-button"]');
      await page.click('[data-testid="add-student-info-column"]');
      
      await page.hover('[data-testid="add-column-button"]');
      await page.click('[data-testid="add-static-column"]');
      
      // Vérifier l'ordre initial
      const firstColumn = page.locator('[data-testid="column-item-0"]');
      const secondColumn = page.locator('[data-testid="column-item-1"]');
      
      await expect(firstColumn).toContainText('Nouvelle Colonne');
      
      // Drag & drop (simulation)
      await firstColumn.dragTo(secondColumn);
      
      // Vérifier le nouvel ordre
      // (Les détails dépendent de l'implémentation du drag & drop)
    });

    test('doit permettre de dupliquer une colonne', async () => {
      await page.click('[data-testid="create-table-button"]');
      
      // Ajouter une colonne
      await page.hover('[data-testid="add-column-button"]');
      await page.click('[data-testid="add-student-info-column"]');
      
      // Configurer la colonne
      await page.click('[data-testid="column-item-0"]');
      await page.fill('[data-testid="column-label"]', 'Colonne Originale');
      
      // Dupliquer
      await page.click('[data-testid="duplicate-column-0"]');
      
      // Vérifier la duplication
      await expect(page.locator('[data-testid="column-item-1"]')).toContainText('Colonne Originale (Copie)');
    });

    test('doit permettre de supprimer une colonne', async () => {
      await page.click('[data-testid="create-table-button"]');
      
      // Ajouter une colonne
      await page.hover('[data-testid="add-column-button"]');
      await page.click('[data-testid="add-student-info-column"]');
      
      // Vérifier la présence
      await expect(page.locator('[data-testid="column-item-0"]')).toBeVisible();
      
      // Supprimer
      await page.click('[data-testid="delete-column-0"]');
      
      // Vérifier la suppression
      await expect(page.locator('[data-testid="column-item-0"]')).not.toBeVisible();
    });
  });

  test.describe('Éditeur de formules', () => {
    test('doit fournir l\'autocomplétion', async () => {
      await page.click('[data-testid="create-table-button"]');
      
      // Ajouter une colonne de formule
      await page.hover('[data-testid="add-column-button"]');
      await page.click('[data-testid="add-formula-column"]');
      
      // Ouvrir l'éditeur de formules
      await page.click('[data-testid="column-item-0"]');
      await page.click('[data-testid="open-formula-builder"]');
      
      // Taper le début d'une fonction
      await page.fill('[data-testid="formula-editor"]', 'MOY');
      
      // Vérifier l'apparition des suggestions
      await expect(page.locator('[data-testid="suggestion-MOYENNE"]')).toBeVisible();
      
      // Sélectionner la suggestion
      await page.click('[data-testid="suggestion-MOYENNE"]');
      
      // Vérifier l'insertion
      await expect(page.locator('[data-testid="formula-editor"]')).toHaveValue('MOYENNE()');
    });

    test('doit valider les formules en temps réel', async () => {
      await page.click('[data-testid="create-table-button"]');
      
      // Ajouter une colonne de formule
      await page.hover('[data-testid="add-column-button"]');
      await page.click('[data-testid="add-formula-column"]');
      
      await page.click('[data-testid="column-item-0"]');
      
      // Entrer une formule invalide
      await page.fill('[data-testid="formula-expression"]', 'FONCTION_INEXISTANTE()');
      
      // Attendre la validation
      await page.waitForTimeout(1500); // Debounce
      
      // Vérifier le message d'erreur
      await expect(page.locator('[data-testid="formula-error"]')).toContainText('inconnue');
      
      // Corriger la formule
      await page.fill('[data-testid="formula-expression"]', 'MOYENNE(10, 20)');
      
      // Vérifier la validation positive
      await expect(page.locator('[data-testid="formula-success"]')).toContainText('valide');
    });
  });

  test.describe('Templates', () => {
    test('doit utiliser un template prédéfini', async () => {
      // Ouvrir la galerie de templates
      await page.click('[data-testid="templates-button"]');
      
      // Vérifier l'ouverture de la galerie
      await expect(page.locator('h2')).toContainText('Galerie de templates');
      
      // Filtrer par catégorie
      await page.click('[data-testid="category-bulletin"]');
      
      // Sélectionner un template
      await page.click('[data-testid="template-bulletin-standard"]');
      
      // Utiliser le template
      await page.click('[data-testid="use-template-button"]');
      
      // Vérifier l'application du template
      await expect(page.locator('[data-testid="table-name"]')).toHaveValue('Bulletin de Notes Standard');
      await expect(page.locator('[data-testid="column-item"]')).toHaveCount(5); // Nombre de colonnes du template
    });

    test('doit rechercher dans les templates', async () => {
      await page.click('[data-testid="templates-button"]');
      
      // Rechercher
      await page.fill('[data-testid="template-search"]', 'bulletin');
      
      // Vérifier les résultats filtrés
      await expect(page.locator('[data-testid="template-card"]')).toContainText('Bulletin');
      
      // Recherche sans résultat
      await page.fill('[data-testid="template-search"]', 'inexistant');
      await expect(page.locator('[data-testid="no-templates"]')).toBeVisible();
    });
  });

  test.describe('Export', () => {
    test('doit exporter un tableau en Excel', async () => {
      // Créer un tableau simple d'abord
      await page.click('[data-testid="create-table-button"]');
      await page.fill('[data-testid="table-name"]', 'Test Export');
      await page.selectOption('[data-testid="table-class"]', '1');
      
      // Ajouter une colonne simple
      await page.hover('[data-testid="add-column-button"]');
      await page.click('[data-testid="add-student-info-column"]');
      
      // Sauvegarder
      await page.click('[data-testid="save-table-button"]');
      
      // Retourner à la liste et exporter
      await page.click('[data-testid="export-table-0"]');
      
      // Configurer l'export
      await page.selectOption('[data-testid="export-format"]', 'excel');
      await page.check('[data-testid="include-headers"]');
      await page.check('[data-testid="include-formatting"]');
      
      // Démarrer l'export
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-button"]');
      
      // Vérifier le téléchargement
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
    });

    test('doit exporter en CSV avec options', async () => {
      // Utiliser un tableau existant ou en créer un
      await page.click('[data-testid="export-table-0"]');
      
      // Configurer pour CSV
      await page.selectOption('[data-testid="export-format"]', 'csv');
      await page.uncheck('[data-testid="include-formatting"]'); // CSV n'a pas de formatage
      
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-button"]');
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.csv$/);
    });
  });

  test.describe('Responsive Design', () => {
    test('doit fonctionner sur mobile', async () => {
      // Simuler un écran mobile
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Vérifier que l'interface s'adapte
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      
      // Tester la création sur mobile
      await page.click('[data-testid="create-table-button"]');
      await expect(page.locator('[data-testid="table-designer"]')).toBeVisible();
      
      // Vérifier que les panneaux s'empilent correctement
      const designer = page.locator('[data-testid="table-designer"]');
      const boundingBox = await designer.boundingBox();
      expect(boundingBox?.width).toBeLessThan(400);
    });

    test('doit fonctionner sur tablette', async () => {
      // Simuler un écran tablette
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await page.click('[data-testid="create-table-button"]');
      
      // Vérifier l'adaptation de l'interface
      await expect(page.locator('[data-testid="column-panel"]')).toBeVisible();
      await expect(page.locator('[data-testid="preview-panel"]')).toBeVisible();
    });
  });

  test.describe('Performance utilisateur', () => {
    test('doit charger rapidement la liste des tableaux', async () => {
      const startTime = Date.now();
      
      await page.goto('/tables');
      await page.waitForSelector('[data-testid="tables-list"]');
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // Moins de 3 secondes
    });

    test('doit générer l\'aperçu rapidement', async () => {
      await page.click('[data-testid="create-table-button"]');
      await page.fill('[data-testid="table-name"]', 'Test Performance');
      await page.selectOption('[data-testid="table-class"]', '1');
      
      // Ajouter une colonne
      await page.hover('[data-testid="add-column-button"]');
      await page.click('[data-testid="add-student-info-column"]');
      
      const startTime = Date.now();
      
      // Attendre que l'aperçu se génère
      await page.waitForSelector('[data-testid="table-preview-data"]');
      
      const previewTime = Date.now() - startTime;
      expect(previewTime).toBeLessThan(2000); // Moins de 2 secondes
    });
  });

  test.describe('Accessibilité', () => {
    test('doit être navigable au clavier', async () => {
      await page.click('[data-testid="create-table-button"]');
      
      // Tester la navigation avec Tab
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="table-name"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="table-description"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="table-class"]')).toBeFocused();
    });

    test('doit avoir les attributs ARIA appropriés', async () => {
      await page.click('[data-testid="create-table-button"]');
      
      // Vérifier les labels
      const nameInput = page.locator('[data-testid="table-name"]');
      await expect(nameInput).toHaveAttribute('aria-label', 'Nom du tableau');
      
      // Vérifier les descriptions
      const addButton = page.locator('[data-testid="add-column-button"]');
      await expect(addButton).toHaveAttribute('aria-describedby');
    });

    test('doit supporter les lecteurs d\'écran', async () => {
      await page.click('[data-testid="create-table-button"]');
      
      // Vérifier les régions ARIA
      await expect(page.locator('[role="main"]')).toBeVisible();
      await expect(page.locator('[role="navigation"]')).toBeVisible();
      
      // Vérifier les annonces pour les actions
      await page.hover('[data-testid="add-column-button"]');
      await expect(page.locator('[aria-live="polite"]')).toContainText('Ajouter une colonne');
    });
  });

  test.describe('Gestion d\'erreurs', () => {
    test('doit gérer les erreurs réseau gracieusement', async () => {
      // Simuler une panne réseau
      await page.route('**/api/tables', route => route.abort());
      
      await page.click('[data-testid="create-table-button"]');
      await page.fill('[data-testid="table-name"]', 'Test Erreur');
      await page.click('[data-testid="save-table-button"]');
      
      // Vérifier le message d'erreur
      await expect(page.locator('[data-testid="error-toast"]')).toContainText('Erreur réseau');
    });

    test('doit récupérer après une erreur temporaire', async () => {
      let requestCount = 0;
      
      // Simuler une erreur puis un succès
      await page.route('**/api/tables', route => {
        requestCount++;
        if (requestCount === 1) {
          route.fulfill({ status: 500, body: 'Erreur serveur' });
        } else {
          route.continue();
        }
      });
      
      await page.click('[data-testid="create-table-button"]');
      await page.fill('[data-testid="table-name"]', 'Test Récupération');
      
      // Première tentative (échec)
      await page.click('[data-testid="save-table-button"]');
      await expect(page.locator('[data-testid="error-toast"]')).toBeVisible();
      
      // Deuxième tentative (succès)
      await page.click('[data-testid="save-table-button"]');
      await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    });
  });
});
