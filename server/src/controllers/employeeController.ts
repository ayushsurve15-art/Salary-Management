import type { Request, RequestHandler } from 'express';
import type { EmployeeService } from '../services/employeeService.js';
import {
  createEmployeeSchema,
  employeeParamsSchema,
  listEmployeesQuerySchema,
  salaryChangeSchema,
  updateEmployeeSchema,
} from '../validation/employeeSchemas.js';

export type EmployeeController = Record<
  'list' | 'meta' | 'get' | 'create' | 'update' | 'remove' | 'history' | 'changeSalary',
  RequestHandler
>;

function idFrom(req: Request): number {
  return employeeParamsSchema.parse(req.params).id;
}

export function createEmployeeController(service: EmployeeService): EmployeeController {
  return {
    list: (req, res) => {
      res.json(service.list(listEmployeesQuerySchema.parse(req.query)));
    },
    meta: (_req, res) => {
      res.json(service.meta());
    },
    get: (req, res) => {
      res.json(service.get(idFrom(req)));
    },
    create: (req, res) => {
      res.status(201).json(service.create(createEmployeeSchema.parse(req.body)));
    },
    update: (req, res) => {
      res.json(service.update(idFrom(req), updateEmployeeSchema.parse(req.body)));
    },
    remove: (req, res) => {
      service.delete(idFrom(req));
      res.status(204).end();
    },
    history: (req, res) => {
      res.json(service.history(idFrom(req)));
    },
    changeSalary: (req, res) => {
      res.json(service.changeSalary(idFrom(req), salaryChangeSchema.parse(req.body)));
    },
  };
}
