import { Router, type Request, type Response } from 'express';
import { ClassController } from '../controllers/classController';
import { validateBody, validateQuery } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { 
  createClassSchema, 
  updateClassSchema,
  classQuerySchema 
} from '@edustats/shared';
import { z } from 'zod';

const router: Router = Router();
let classController: ClassController;

// Initialize controller lazily to avoid circular dependency
const getClassController = () => {
  if (!classController) {
    classController = new ClassController();
  }
  return classController;
};

// Schéma pour valider l'ID dans les paramètres
const idParamSchema = z.object({
  id: z.string().transform(val => {
    const num = parseInt(val);
    if (isNaN(num)) throw new Error('ID invalide');
    return num;
  })
});

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Routes des classes
router.get('/', (req, res) => getClassController().getClasses(req, res));

router.get('/academic-years', (req, res) => getClassController().getAcademicYears(req, res));

router.get('/:id', (req, res) => getClassController().getClassById(req, res));

router.post('/',
  validateBody(createClassSchema),
  (req, res) => getClassController().createClass(req, res)
);

router.put('/:id',
  validateBody(updateClassSchema),
  (req, res) => getClassController().updateClass(req, res)
);

router.delete('/:id', (req, res) => getClassController().deleteClass(req, res));

export default router;
