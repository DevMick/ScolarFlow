/**
 * Script pour créer des notes pour tous les élèves
 * Email: mickael.andjui.12@gmail.com
 * Mot de passe: DevMick@2003
 * 
 * Ce script vérifie automatiquement les notes existantes et crée seulement celles qui manquent.
 * Il peut être relancé à tout moment sans créer de doublons.
 */

const API_URL = 'http://localhost:3001/api';

// Maximums par matière
const SUBJECT_MAX_SCORES = {
  'DICTEE': 20,
  'EVEIL. DU MILIEU': 50,
  'EXP. DE TEXTE': 50,
  'MATH': 50,
};

// Fonction pour attendre un délai
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fonction pour se connecter et obtenir le token
async function login() {
  let attempts = 0;
  const maxAttempts = 5;
  
  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'mickael.andjui.12@gmail.com',
          password: 'DevMick@2003',
        }),
      });

      if (response.status === 429) {
        attempts++;
        const waitTime = attempts * 5; // 5, 10, 15, 20, 25 secondes
        console.log(`⏸️  Rate limiting détecté. Attente de ${waitTime} secondes...`);
        await delay(waitTime * 1000);
        continue;
      }

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Erreur de connexion: ${response.status} - ${error}`);
      }

      const data = await response.json();
      if (!data.success || !data.token) {
        throw new Error('Échec de la connexion: ' + (data.message || 'Token non reçu'));
      }

      return data.token;
    } catch (error) {
      if (attempts >= maxAttempts) {
        throw error;
      }
      attempts++;
      await delay(5000);
    }
  }
}

// Fonction pour récupérer les classes
async function getClasses(token) {
  const response = await fetch(`${API_URL}/classes`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erreur lors de la récupération des classes: ${response.status} - ${error}`);
  }

  const data = await response.json();
  if (!data.success || !data.data || !data.data.classes) {
    throw new Error('Aucune classe trouvée');
  }

  return data.data.classes;
}

// Fonction pour récupérer les matières
async function getSubjects(token) {
  const response = await fetch(`${API_URL}/subjects`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erreur lors de la récupération des matières: ${response.status} - ${error}`);
  }

  const data = await response.json();
  let subjects = Array.isArray(data) ? data : (data.data || data.subjects || []);
  return subjects;
}

// Fonction pour récupérer les évaluations d'une classe
async function getEvaluationsByClass(token, classId) {
  const response = await fetch(`${API_URL}/evaluations/class/${classId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erreur lors de la récupération des évaluations: ${response.status} - ${error}`);
  }

  const data = await response.json();
  
  if (data.success && data.data) {
    return Array.isArray(data.data) ? data.data : (data.data.evaluations || []);
  }
  return Array.isArray(data) ? data : [];
}

// Fonction pour récupérer les élèves d'une classe
async function getStudentsByClass(token, classId, schoolYearId) {
  const response = await fetch(`${API_URL}/students?classId=${classId}&schoolYearId=${schoolYearId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erreur lors de la récupération des élèves: ${response.status} - ${error}`);
  }

  const data = await response.json();
  if (data.success && data.data) {
    return Array.isArray(data.data) ? data.data : (data.data.students || []);
  }
  return Array.isArray(data) ? data : [];
}

// Fonction pour récupérer l'année scolaire active
async function getActiveSchoolYear(token) {
  const response = await fetch(`${API_URL}/school-years`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erreur lors de la récupération des années scolaires: ${response.status} - ${error}`);
  }

  const data = await response.json();
  
  let schoolYears = [];
  if (data.data && data.data.schoolYears) {
    schoolYears = data.data.schoolYears;
  } else if (data.data && Array.isArray(data.data)) {
    schoolYears = data.data;
  } else if (data.schoolYears) {
    schoolYears = data.schoolYears;
  } else if (Array.isArray(data)) {
    schoolYears = data;
  }
  
  if (schoolYears.length === 0) {
    throw new Error('Aucune année scolaire trouvée');
  }

  const activeSchoolYear = schoolYears.find(sy => sy.isActive) || schoolYears[0];
  return activeSchoolYear;
}

// Fonction pour vérifier si une note existe déjà
async function checkNoteExists(token, studentId, subjectId, evaluationId) {
  try {
    const response = await fetch(`${API_URL}/notes?studentId=${studentId}&subjectId=${subjectId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      let notes = [];
      
      if (data.success && data.data) {
        notes = Array.isArray(data.data) ? data.data : (data.data.notes || []);
      } else if (Array.isArray(data)) {
        notes = data;
      }
      
      // Vérifier si une note existe pour cette évaluation
      return notes.some(note => note.evaluationId === evaluationId);
    }
    return false;
  } catch (error) {
    return false;
  }
}

// Fonction pour générer une note aléatoire selon le maximum
function generateGrade(maxScore) {
  const random = Math.random();
  
  if (random < 0.7) {
    // 70% des notes sont entre 10 et maxScore
    return Math.floor(Math.random() * (maxScore - 10 + 1)) + 10;
  } else if (random < 0.9) {
    // 20% des notes sont entre 5 et 10
    return Math.floor(Math.random() * (10 - 5 + 1)) + 5;
  } else {
    // 10% des notes sont entre 0 et 5
    return Math.floor(Math.random() * 6);
  }
}

// Fonction pour créer ou mettre à jour une note (upsert)
async function upsertNote(token, noteData, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(`${API_URL}/notes/upsert`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noteData),
      });

      if (response.status === 429) {
        const waitTime = (attempt + 1) * 5; // 5, 10, 15 secondes
        console.log(`   ⏸️  Rate limiting détecté. Attente de ${waitTime} secondes...`);
        await delay(waitTime * 1000);
        continue;
      }

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Erreur: ${response.status} - ${error}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (attempt === retries - 1) {
        throw error;
      }
      await delay(2000 * (attempt + 1));
    }
  }
}

// Fonction principale
async function main() {
  try {
    console.log('⏳ Attente de 3 secondes avant de commencer...');
    await delay(3000);
    
    console.log('🔐 Connexion en cours...');
    const token = await login();
    console.log('✅ Connexion réussie!');

    console.log('📅 Récupération de l\'année scolaire active...');
    const schoolYear = await getActiveSchoolYear(token);
    console.log(`✅ Année scolaire trouvée: ${schoolYear.startYear}-${schoolYear.endYear} (ID: ${schoolYear.id})`);

    console.log('📚 Récupération des classes...');
    const classes = await getClasses(token);
    
    if (classes.length === 0) {
      throw new Error('Aucune classe trouvée. Veuillez d\'abord créer une classe.');
    }

    const classToUse = classes[0];
    console.log(`✅ Classe trouvée: ${classToUse.name} (ID: ${classToUse.id})`);

    console.log('📖 Récupération des matières...');
    let subjects = await getSubjects(token);
    
    if (!Array.isArray(subjects)) {
      if (subjects.data && Array.isArray(subjects.data)) {
        subjects = subjects.data;
      } else if (subjects.subjects && Array.isArray(subjects.subjects)) {
        subjects = subjects.subjects;
      } else {
        throw new Error('Format de réponse des matières inattendu');
      }
    }
    
    if (subjects.length === 0) {
      throw new Error('Aucune matière trouvée.');
    }

    const classSubjects = subjects.filter(s => s.classId === classToUse.id);
    
    if (classSubjects.length === 0) {
      throw new Error(`Aucune matière trouvée pour la classe ${classToUse.name}.`);
    }

    console.log(`✅ ${classSubjects.length} matière(s) trouvée(s):`);
    classSubjects.forEach(subject => {
      const maxScore = SUBJECT_MAX_SCORES[subject.name.toUpperCase()] || 20;
      console.log(`   - ${subject.name} (max: ${maxScore})`);
    });

    console.log('📝 Récupération des évaluations...');
    const evaluations = await getEvaluationsByClass(token, classToUse.id);
    
    if (evaluations.length === 0) {
      throw new Error('Aucune évaluation trouvée. Veuillez d\'abord créer des évaluations.');
    }

    console.log(`✅ ${evaluations.length} évaluation(s) trouvée(s)`);

    console.log('👥 Récupération des élèves...');
    const students = await getStudentsByClass(token, classToUse.id, schoolYear.id);
    
    if (students.length === 0) {
      throw new Error('Aucun élève trouvé.');
    }

    console.log(`✅ ${students.length} élève(s) trouvé(s)`);

    console.log('\n📊 Vérification et création des notes en cours...');
    let totalNotes = 0;
    let existingNotes = 0;
    let successCount = 0;
    let errorCount = 0;

    // Pour chaque évaluation
    for (const evaluation of evaluations) {
      console.log(`\n📋 Évaluation: ${evaluation.nom || evaluation.name} (ID: ${evaluation.id})`);
      
      // Pour chaque matière
      for (const subject of classSubjects) {
        const subjectName = subject.name.toUpperCase();
        const maxScore = SUBJECT_MAX_SCORES[subjectName] || 20;
        
        console.log(`   📖 Matière: ${subject.name} (max: ${maxScore})`);
        
        // Pour chaque élève
        for (let i = 0; i < students.length; i++) {
          const student = students[i];
          totalNotes++;
          
          try {
            // Vérifier d'abord si la note existe déjà
            const noteExists = await checkNoteExists(token, student.id, subject.id, evaluation.id);
            
            if (noteExists) {
              existingNotes++;
              if (totalNotes % 20 === 0) {
                process.stdout.write(`   ⏭️  ${existingNotes} note(s) existante(s), ${successCount} créée(s)...\r`);
              }
              await delay(50);
              continue;
            }

            // Générer une note selon le maximum de la matière
            const grade = generateGrade(maxScore);
            
            const noteData = {
              studentId: student.id,
              subjectId: subject.id,
              evaluationId: evaluation.id,
              value: grade
            };

            // Créer la note
            await upsertNote(token, noteData);
            successCount++;
            
            // Afficher le progrès
            if (totalNotes % 10 === 0) {
              process.stdout.write(`   ✅ ${successCount} créée(s), ${existingNotes} existante(s), ${errorCount} erreur(s)...\r`);
            }
            
            // Délai pour éviter le rate limiting (200ms entre chaque création)
            await delay(200);
            
          } catch (error) {
            errorCount++;
            
            if (error.message.includes('429') || error.message.includes('Trop de tentatives')) {
              console.log(`\n   ⏸️  Rate limiting. Attente de 10 secondes...`);
              await delay(10000);
              
              // Réessayer une dernière fois
              try {
                const grade = generateGrade(maxScore);
                await upsertNote(token, {
                  studentId: student.id,
                  subjectId: subject.id,
                  evaluationId: evaluation.id,
                  value: grade
                }, 1);
                successCount++;
                errorCount--;
                console.log(`   ✅ Note créée après retry pour ${student.name}`);
              } catch (retryError) {
                console.error(`   ❌ Échec final pour ${student.name}: ${retryError.message}`);
              }
            } else {
              console.error(`\n   ❌ Erreur pour ${student.name}: ${error.message}`);
              await delay(100);
            }
          }
        }
      }
    }

    const totalExpected = evaluations.length * classSubjects.length * students.length;
    
    console.log('\n\n📋 Résumé final:');
    console.log(`   - Évaluations: ${evaluations.length}`);
    console.log(`   - Matières: ${classSubjects.length}`);
    console.log(`   - Élèves: ${students.length}`);
    console.log(`   - Total de notes attendues: ${totalExpected}`);
    console.log(`   - Notes déjà existantes: ${existingNotes}`);
    console.log(`   - Notes créées lors de cette exécution: ${successCount}`);
    console.log(`   - Notes totales (existantes + créées): ${existingNotes + successCount}`);
    if (errorCount > 0) {
      console.log(`   - Erreurs: ${errorCount}`);
    }
    
    const totalCreated = existingNotes + successCount;
    if (totalCreated < totalExpected) {
      const remaining = totalExpected - totalCreated;
      console.log(`\n⚠️  ${remaining} note(s) manquante(s).`);
      console.log(`💡 Vous pouvez relancer ce script pour créer les notes restantes.`);
      console.log(`   Le script vérifie automatiquement les notes existantes.`);
    } else {
      console.log('\n✅ Toutes les notes ont été vérifiées/créées avec succès!');
    }
    console.log('\n🎉 Opération terminée!');

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    if (error.message.includes('429') || error.message.includes('Trop de tentatives')) {
      console.error('\n💡 Le rate limiting est actif. Attendez 15-20 minutes puis relancez le script.');
    }
    process.exit(1);
  }
}

// Exécuter le script
main();

