import { Router } from 'express';
import type { EmployeeController } from '../controllers/employeeController.js';

export function employeeRoutes(controller: EmployeeController): Router {
  return Router()
    .get('/meta', controller.meta)
    .get('/employees', controller.list)
    .post('/employees', controller.create)
    .get('/employees/:id', controller.get)
    .put('/employees/:id', controller.update)
    .delete('/employees/:id', controller.remove)
    .get('/employees/:id/salary-history', controller.history)
    .post('/employees/:id/salary-changes', controller.changeSalary);
}
