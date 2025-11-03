const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugMoyenneCalculation() {
  try {
    console.log('🔍 Débogage du calcul des moyennes...\n');
    
    // 1. Récupérer toutes les évaluations
    const evaluations = await prisma.evaluation.findMany({
      include: {
        class: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    console.log(`📚 ${evaluations.length} évaluation(s) trouvée(s)\n`);
    
    for (const evaluation of evaluations) {
      console.log('═'.repeat(80));
      console.log(`\n📝 Évaluation: ${evaluation.nom} (ID: ${evaluation.id})`);
      console.log(`   Classe: ${evaluation.class.name} (ID: ${evaluation.classId})`);
      console.log(`   Date: ${evaluation.date.toISOString().split('T')[0]}\n`);
      
      // 2. Récupérer les élèves de cette classe
      const students = await prisma.student.findMany({
        where: {
          classId: evaluation.classId,
          isActive: true
        }
      });
      
      console.log(`👥 ${students.length} élève(s) dans cette classe`);
      
      // 3. Récupérer les notes de cette évaluation
      const notes = await prisma.note.findMany({
        where: {
          evaluationId: evaluation.id,
          isActive: true
        },
        include: {
          student: {
            select: {
              name: true
            }
          },
          subject: {
            select: {
              name: true
            }
          }
        }
      });
      
      console.log(`📊 ${notes.length} note(s) pour cette évaluation\n`);
      
      // 4. Organiser les notes par élève
      const notesByStudent = {};
      const absentStudents = new Set();
      
      for (const note of notes) {
        if (note.isAbsent) {
          absentStudents.add(note.studentId);
          console.log(`   ⚠️  ${note.student.name} est absent`);
        }
        
        if (!notesByStudent[note.studentId]) {
          notesByStudent[note.studentId] = {
            student: note.student,
            notes: []
          };
        }
        
        notesByStudent[note.studentId].notes.push({
          subject: note.subject.name,
          value: note.value,
          isAbsent: note.isAbsent
        });
      }
      
      console.log(`\n📈 Détail des notes par élève:`);
      console.log('─'.repeat(80));
      
      for (const [studentId, data] of Object.entries(notesByStudent)) {
        const isAbsent = absentStudents.has(parseInt(studentId));
        console.log(`\n   Élève: ${data.student.name} (ID: ${studentId})${isAbsent ? ' ⚠️ ABSENT' : ''}`);
        
        if (!isAbsent) {
          let sum = 0;
          let count = 0;
          
          for (const note of data.notes) {
            console.log(`      - ${note.subject}: ${note.value}`);
            if (!note.isAbsent && note.value !== null) {
              sum += parseFloat(note.value);
              count++;
            }
          }
          
          if (count > 0) {
            const moyenne = sum / count;
            console.log(`      → Moyenne calculée: ${moyenne.toFixed(2)}`);
          } else {
            console.log(`      → Aucune note valide pour calculer la moyenne`);
          }
        }
      }
      
      // 5. Vérifier les moyennes existantes
      const existingMoyennes = await prisma.moyenne.findMany({
        where: {
          evaluationId: evaluation.id
        }
      });
      
      console.log(`\n💾 ${existingMoyennes.length} moyenne(s) enregistrée(s) dans la BD pour cette évaluation`);
      
      if (existingMoyennes.length > 0) {
        for (const moyenne of existingMoyennes) {
          console.log(`   - Élève ID: ${moyenne.studentId}, Moyenne: ${moyenne.moyenne}`);
        }
      }
      
      console.log('\n');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugMoyenneCalculation();

