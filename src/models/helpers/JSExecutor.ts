export interface JSExecutor {
    execute(expr: string, context:any , callback: (err: Error, res?: any) => void): any;
}