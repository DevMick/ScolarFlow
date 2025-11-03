// ========================================
// ROUTES POUR LES ÉLÈVES
// ========================================

import { Router, type Request, type Response } from 'express';
import { getStudentController } from '../controllers/studentController';
import { authenticateToken } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { 
  createStudentSchema, 
  updateStudentSchema, 
  createBulkStudentsSchema,
  studentFiltersSchema 
} from '@edustats/shared';

const router: Router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// GET /api/students - Récupérer les élèves d'une classe
router.get('/', (req: Request, res: Response) => {
  getStudentController().getStudentsByClass(req, res);
});

// GET /api/students/:id - Récupérer un élève par ID
router.get('/:id', (req: Request, res: Response) => {
  getStudentController().getStudentById(req, res);
});

// POST /api/students - Créer un nouvel élève
router.post('/',
  validateBody(createStudentSchema),
  (req: Request, res: Response) => getStudentController().createStudent(req, res)
);

// POST /api/students/bulk - Créer plusieurs élèves en lot
router.post('/bulk',
  validateBody(createBulkStudentsSchema),
  (req: Request, res: Response) => getStudentController().createBulkStudents(req, res)
);

// PUT /api/students/:id - Mettre à jour un élève
router.put('/:id',
  validateBody(updateStudentSchema),
  (req: Request, res: Response) => getStudentController().updateStudent(req, res)
);

// DELETE /api/students/:id - Supprimer un élève
router.delete('/:id', (req: Request, res: Response) => {
  getStudentController().deleteStudent(req, res);
});

export default router;