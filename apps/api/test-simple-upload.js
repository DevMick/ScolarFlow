// Script Node.js pour tester l'upload simple
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testUpload() {
    console.log('🧪 Test d\'upload simple');
    
    try {
        // 1. Se connecter
        console.log('\n1. Connexion...');
        const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'test@example.com',
            password: 'password123'
        });
        
        console.log('✅ Connexion réussie');
        const token = loginResponse.data.token;
        const userId = loginResponse.data.user.id;
        
        // 2. Créer un paiement
        console.log('\n2. Création d\'un paiement...');
        const paymentResponse = await axios.post('http://localhost:3001/api/payments', {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ Paiement créé:', paymentResponse.data.payment.id);
        const paymentId = paymentResponse.data.payment.id;
        
        // 3. Créer un fichier de test
        console.log('\n3. Création d\'un fichier de test...');
        const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
        const testImageBytes = Buffer.from(testImageBase64.split(',')[1], 'base64');
        fs.writeFileSync('test_image.png', testImageBytes);
        console.log('✅ Fichier de test créé');
        
        // 4. Upload du fichier
        console.log('\n4. Upload du fichier...');
        const formData = new FormData();
        formData.append('screenshot', fs.createReadStream('test_image.png'));
        
        const uploadResponse = await axios.post(
            `http://localhost:3001/api/payments/${paymentId}/screenshot`,
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    Authorization: `Bearer ${token}`
                }
            }
        );
        
        console.log('✅ Upload réussi:', uploadResponse.data.message);
        
        // 5. Récupérer l'image
        console.log('\n5. Récupération de l\'image...');
        const imageResponse = await axios.get(
            `http://localhost:3001/api/payments/${paymentId}/screenshot`,
            {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'arraybuffer'
            }
        );
        
        console.log('✅ Image récupérée avec succès!');
        console.log('Content-Type:', imageResponse.headers['content-type']);
        console.log('Content-Length:', imageResponse.headers['content-length']);
        console.log('Taille des données:', imageResponse.data.length, 'bytes');
        
        // Sauvegarder l'image récupérée
        fs.writeFileSync('retrieved_image.png', imageResponse.data);
        console.log('✅ Image sauvegardée dans: retrieved_image.png');
        
        // 6. Vérifier en base de données
        console.log('\n6. Vérification en base de données...');
        console.log('Exécutez cette requête SQL:');
        console.log(`SELECT id, user_id, LENGTH(screenshot) as screenshot_size, screenshot IS NOT NULL as has_screenshot FROM paiements WHERE id = ${paymentId};`);
        
        // Nettoyer
        fs.unlinkSync('test_image.png');
        
        console.log('\n✅ Test terminé avec succès!');
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

testUpload();
