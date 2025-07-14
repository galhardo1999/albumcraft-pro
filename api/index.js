import NextAuth from 'next-auth';
import { authOptions } from '../server/auth.js';

// NextAuth handler for all auth routes
export default NextAuth(authOptions);