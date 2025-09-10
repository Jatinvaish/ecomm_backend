import 'fastify';  

// Define the shape of your user object
interface UserPayload {
  id: number;
  email: string;
  vendor_id?: number;  
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: UserPayload;  
  }
}