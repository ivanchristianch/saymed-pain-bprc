import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/user.repository.js';
import { getLogger } from '../logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_ME_SUPER_SECRET';

export class AuthService {
  constructor(private userRepo: UserRepository) {}

  async login(email: string, password: string): Promise<string> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) throw { status: 401, message: 'Invalid credentials' };

    const match = await bcrypt.compare(password, user.hashed_password);
    if (!match) throw { status: 401, message: 'Invalid credentials' };

    getLogger().info({ msg: 'User login successful', businessId: user.business_id, email });

    if (!user.business_id) {
      throw { status: 403, message: 'User is not associated with a business' };
    }

    return jwt.sign({ email, business_id: user.business_id }, JWT_SECRET, { expiresIn: '12h' });
  }
}
