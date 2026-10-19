import { createHmac, timingSafeEqual } from "node:crypto";
export const ADMIN_COOKIE = "la_admin_session";
export const ADMIN_SESSION_SECONDS = 8 * 60 * 60;
export function isValidAdminSession(token?: string | null): boolean {
 const secret=process.env.ADMIN_SESSION_SECRET;if(!secret||!token)return false;
 const parts=token.split(".");if(parts.length!==2)return false;
 const [expiryText,signature]=parts;const expiry=Number(expiryText);
 if(!Number.isSafeInteger(expiry)||expiry<=Math.floor(Date.now()/1000)||expiry>Math.floor(Date.now()/1000)+ADMIN_SESSION_SECONDS+60)return false;
 const expected=createHmac("sha256",secret).update(expiryText).digest("hex");
 const a=Buffer.from(signature,"utf8"),b=Buffer.from(expected,"utf8");
 return a.length===b.length&&timingSafeEqual(a,b);
}
export function createAdminSession():string {
 const secret=process.env.ADMIN_SESSION_SECRET;if(!secret)throw new Error("ADMIN_SESSION_SECRET não configurado");
 const expiry=String(Math.floor(Date.now()/1000)+ADMIN_SESSION_SECONDS);
 return expiry+"."+createHmac("sha256",secret).update(expiry).digest("hex");
}
export function verifyAdminPassword(password:string):boolean {
 const expected=process.env.ADMIN_PASSWORD;if(!expected||!password)return false;
 const a=Buffer.from(password,"utf8"),b=Buffer.from(expected,"utf8");
 if(a.length!==b.length){timingSafeEqual(b,b);return false;}
 return timingSafeEqual(a,b);
}