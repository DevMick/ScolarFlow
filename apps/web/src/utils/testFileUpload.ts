// Utilitaire de test pour l'upload de fichiers
import PaymentService from '../services/paymentService';

export class FileUploadTester {
  
  /**
   * Tester la création d'un paiement
   */
  static async testCreatePayment(): Promise<boolean> {
    try {
      console.log('🧪 Test: Création d\'un paiement...');
      const result = await PaymentService.createPayment();
      
      if (result.success) {
        console.log('✅ Test réussi: Paiement créé avec ID:', result.payment?.id);
        return true;
      } else {
        console.error('❌ Test échoué:', result.message);
        return false;
      }
    } catch (error) {
      console.error('❌ Test échoué avec erreur:', error);
      return false;
    }
  }

  /**
   * Tester l'upload d'un fichier de test
   */
  static async testFileUpload(paymentId: number): Promise<boolean> {
    try {
      console.log('🧪 Test: Upload d\'un fichier de test...');
      
      // Créer un fichier de test (image 1x1 pixel en base64)
      const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      
      // Convertir en File
      const response = await fetch(testImageBase64);
      const blob = await response.blob();
      const testFile = new File([blob], 'test.png', { type: 'image/png' });
      
      console.log('📁 Fichier de test créé:', {
        name: testFile.name,
        size: testFile.size,
        type: testFile.type
      });
      
      const result = await PaymentService.addScreenshotToPayment(paymentId, testFile);
      
      if (result.success) {
        console.log('✅ Test réussi: Fichier uploadé');
        return true;
      } else {
        console.error('❌ Test échoué:', result.message);
        return false;
      }
    } catch (error) {
      console.error('❌ Test échoué avec erreur:', error);
      return false;
    }
  }

  /**
   * Tester le processus complet
   */
  static async testCompleteFlow(): Promise<boolean> {
    try {
      console.log('🧪 Test: Flux complet de paiement...');
      
      // 1. Créer un paiement
      const createResult = await this.testCreatePayment();
      if (!createResult) return false;
      
      // 2. Récupérer l'ID du paiement créé
      const payments = await PaymentService.getUserPayments();
      if (payments.length === 0) {
        console.error('❌ Aucun paiement trouvé');
        return false;
      }
      
      const latestPayment = payments[0];
      console.log('📋 Paiement trouvé:', latestPayment);
      
      // 3. Tester l'upload
      const uploadResult = await this.testFileUpload(latestPayment.id!);
      if (!uploadResult) return false;
      
      console.log('✅ Test complet réussi!');
      return true;
      
    } catch (error) {
      console.error('❌ Test complet échoué:', error);
      return false;
    }
  }

  /**
   * Tester la validation des fichiers
   */
  static testFileValidation(): void {
    console.log('🧪 Test: Validation des fichiers...');
    
    // Créer des fichiers de test
    const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const invalidTypeFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    const largeFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    
    // Tester les validations
    const validResult = PaymentService.validateScreenshot(validFile);
    const invalidTypeResult = PaymentService.validateScreenshot(invalidTypeFile);
    const largeFileResult = PaymentService.validateScreenshot(largeFile);
    
    console.log('📋 Résultats de validation:');
    console.log('  - Fichier valide:', validResult);
    console.log('  - Type invalide:', invalidTypeResult);
    console.log('  - Fichier trop volumineux:', largeFileResult);
  }

  /**
   * Lancer tous les tests
   */
  static async runAllTests(): Promise<void> {
    console.log('🚀 Démarrage des tests d\'upload de fichiers...');
    
    // Test de validation
    this.testFileValidation();
    
    // Test du flux complet
    const success = await this.testCompleteFlow();
    
    if (success) {
      console.log('🎉 Tous les tests sont passés avec succès!');
    } else {
      console.error('💥 Certains tests ont échoué');
    }
  }
}

// Fonction globale pour les tests dans la console
(window as any).testFileUpload = FileUploadTester.runAllTests;
(window as any).testCreatePayment = FileUploadTester.testCreatePayment;
(window as any).testFileValidation = FileUploadTester.testFileValidation;
