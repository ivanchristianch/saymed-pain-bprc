import { db } from '../db.js';
import { User } from '../types/db.js';

export class UserRepository {
  async findByEmail(email: string): Promise<User | undefined> {
    return db
      .selectFrom('users_tab')
      .where('email', '=', email)
      .selectAll()
      .executeTakeFirst();
  }
}
