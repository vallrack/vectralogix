export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
  context: SecurityRuleContext;
  constructor(context: SecurityRuleContext) {
    super(`Falta o permisos insuficientes en ${context.path} durante la operación ${context.operation}`);
    this.name = 'FirestorePermissionError';
    this.context = context;
  }
}
