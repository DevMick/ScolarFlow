import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding de la base de données...');

  // Nettoyer les données existantes
  await prisma.note.deleteMany();
  await prisma.moyenne.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.student.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.class.deleteMany();
  await prisma.evaluationFormula.deleteMany();
  await prisma.user.deleteMany();

  // Créer un utilisateur de test
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  const user = await prisma.user.create({
    data: {
      email: 'professeur@exemple.com',
      passwordHash: hashedPassword,
      firstName: 'Jean',
      lastName: 'Dupont',
      establishment: 'École Primaire de Test',
      directionRegionale: 'Direction Régionale de Test',
      secteurPedagogique: 'Secteur Pédagogique de Test'
    }
  });

  console.log('✅ Utilisateur créé:', user.email);

  // Créer des formules de calcul
  const formulas = await Promise.all([
    prisma.evaluationFormula.create({
      data: {
        userId: user.id,
        formula: '=AVERAGE(A1:A10)'
      }
    }),
    prisma.evaluationFormula.create({
      data: {
        userId: user.id,
        formula: '=SUMPRODUCT(A1:A10,B1:B10)/SUM(B1:B10)'
      }
    }),
    prisma.evaluationFormula.create({
      data: {
        userId: user.id,
        formula: '=RANK(A1,A1:A10)'
      }
    }),
    prisma.evaluationFormula.create({
      data: {
        userId: user.id,
        formula: '=COUNTIF(A1:A10,">=10")/COUNT(A1:A10)*100'
      }
    })
  ]);

  console.log(`✅ ${formulas.length} formules de calcul créées`);

  // Créer des classes
  const classes = await Promise.all([
    prisma.class.create({
      data: {
        userId: user.id,
        name: 'CM2-A',
        academicYear: '2024-2025'
      }
    }),
    prisma.class.create({
      data: {
        userId: user.id,
        name: 'CE2-B',
        academicYear: '2024-2025'
      }
    }),
    prisma.class.create({
      data: {
        userId: user.id,
        name: 'CM1-A',
        academicYear: '2024-2025'
      }
    })
  ]);

  console.log(`✅ ${classes.length} classes créées`);

  // Créer des matières pour chaque classe
  const subjects = [];
  for (const classItem of classes) {
    const classSubjects = await Promise.all([
      prisma.subject.create({
        data: {
          classId: classItem.id,
          userId: user.id,
          name: 'Mathématiques'
        }
      }),
      prisma.subject.create({
        data: {
          classId: classItem.id,
          userId: user.id,
          name: 'Français'
        }
      }),
      prisma.subject.create({
        data: {
          classId: classItem.id,
          userId: user.id,
          name: 'Sciences'
        }
      }),
      prisma.subject.create({
        data: {
          classId: classItem.id,
          userId: user.id,
          name: 'Histoire-Géographie'
        }
      }),
      prisma.subject.create({
        data: {
          classId: classItem.id,
          userId: user.id,
          name: 'Anglais'
        }
      })
    ]);
    subjects.push(...classSubjects);
  }

  console.log(`✅ ${subjects.length} matières créées`);

  // Créer des élèves pour chaque classe
  const studentsData = [
    // CM2-A Students
    ...Array.from({ length: 15 }, (_, i) => ({
      classId: classes[0].id,
      name: `Élève${i + 1} Nom${i + 1}`,
      gender: i % 2 === 0 ? 'M' as const : 'F' as const,
      studentNumber: `CM2A${(i + 1).toString().padStart(3, '0')}`
    })),
    // CE2-B Students
    ...Array.from({ length: 12 }, (_, i) => ({
      classId: classes[1].id,
      name: `Élève${i + 16} Nom${i + 16}`,
      gender: i % 2 === 0 ? 'M' as const : 'F' as const,
      studentNumber: `CE2B${(i + 1).toString().padStart(3, '0')}`
    })),
    // CM1-A Students
    ...Array.from({ length: 18 }, (_, i) => ({
      classId: classes[2].id,
      name: `Élève${i + 28} Nom${i + 28}`,
      gender: i % 2 === 0 ? 'M' as const : 'F' as const,
      studentNumber: `CM1A${(i + 1).toString().padStart(3, '0')}`
    }))
  ];

  const students = await Promise.all(
    studentsData.map(studentData => prisma.student.create({ data: studentData }))
  );

  console.log(`✅ ${students.length} élèves créés`);

  // Mettre à jour le nombre d'élèves dans chaque classe
  await prisma.class.update({
    where: { id: classes[0].id },
    data: { studentCount: 15 }
  });
  await prisma.class.update({
    where: { id: classes[1].id },
    data: { studentCount: 12 }
  });
  await prisma.class.update({
    where: { id: classes[2].id },
    data: { studentCount: 18 }
  });

  // Créer quelques évaluations
  const evaluations = await Promise.all([
    prisma.evaluation.create({
      data: {
        nom: 'Contrôle de Mathématiques',
        date: new Date('2025-09-25')
      }
    }),
    prisma.evaluation.create({
      data: {
        nom: 'Dictée de Français',
        date: new Date('2025-09-24')
      }
    }),
    prisma.evaluation.create({
      data: {
        nom: 'Sciences Naturelles',
        date: new Date('2025-09-23')
      }
    })
  ]);

  console.log(`✅ ${evaluations.length} évaluations créées`);

  // Créer quelques notes
  const notes = [];
  for (let i = 0; i < 10; i++) {
    notes.push(
      prisma.note.create({
        data: {
          studentId: students[i].id,
          subjectId: subjects[i % 5].id, // Rotation des matières
          userId: user.id
        }
      })
    );
  }

  await Promise.all(notes);
  
  console.log(`✅ ${notes.length} notes créées`);

  // Créer quelques moyennes
  const moyennes = [];
  for (let i = 0; i < 5; i++) {
    moyennes.push(
      prisma.moyenne.create({
        data: {
          studentId: students[i].id,
          evaluationId: evaluations[i % 3].id, // Rotation des évaluations
          userId: user.id,
          moyenne: Math.round((Math.random() * 10 + 10) * 100) / 100, // Moyenne entre 10 et 20
          date: new Date()
        }
      })
    );
  }

  await Promise.all(moyennes);
  
  console.log(`✅ ${moyennes.length} moyennes créées`);

  console.log('🎉 Seeding terminé avec succès !');
  console.log('\n📊 Données créées:');
  console.log(`  - 1 utilisateur (email: ${user.email})`);
  console.log(`  - ${subjects.length} matières`);
  console.log(`  - ${formulas.length} formules de calcul`);
  console.log(`  - ${classes.length} classes`);
  console.log(`  - ${students.length} élèves`);
  console.log(`  - ${evaluations.length} évaluations`);
  console.log(`  - ${notes.length} notes`);
  console.log(`  - ${moyennes.length} moyennes`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur durant le seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
