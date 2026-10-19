import { Pool } from "pg";
declare global { var __storePool: Pool | undefined; }
export function getPool() {
 if (!process.env.DATABASE_URL) return null;
 if (!global.__storePool) global.__storePool = new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:undefined,max:5,idleTimeoutMillis:30000,connectionTimeoutMillis:5000});
 return global.__storePool;
}
