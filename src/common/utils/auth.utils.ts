import * as jwt from 'jsonwebtoken';

export class AuthUtils {
  private static readonly JWT_SECRET = process.env.NEXTAUTH_SECRET || 'eshjwtkey';

  static generateToken(payload: object): string {
    return jwt.sign(payload, this.JWT_SECRET, { expiresIn: '10h' });
  }

  static decodeToken(token: string): any {
    try {
      return jwt.verify(token, this.JWT_SECRET);
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }

  static extractTokenFromHeader(authHeader: string): string | null {
    if (!authHeader) return null;
    
    // Handle "Bearer token" format
    if (authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    // Handle direct token
    return authHeader;
  }

  static getUserIdFromToken(authHeader: string): string | null {
    try {
      const token = this.extractTokenFromHeader(authHeader);
      if (!token) return null;

      const decoded = this.decodeToken(token);
      return decoded?.userId || decoded?.userId || null;
    } catch (error) {
      console.error('Error extracting user ID from token:', error);
      return null;
    }
  }
}