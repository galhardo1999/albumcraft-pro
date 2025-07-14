import NextAuth from 'next-auth';
import { authOptions } from '../../server/auth.ts';

export default NextAuth(authOptions);