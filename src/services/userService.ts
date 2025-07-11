import { collection, doc, getDoc, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User } from "firebase/auth";

export class UserService {
  private static getUsersRef() {
    return collection(db, 'users');
  }

  private static getUserRef(userId: string) {
    return doc(db, 'users', userId);
  }

  // Get user by ID
  static async getUser(userId: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(this.getUserRef(userId));

      if (!userDoc.exists()) {
        return null;
      }

      return userDoc.data() as User;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw new Error('Failed to fetch user');
    }
  }

  // Get users by name
  static async getUsersByName(name: string): Promise<User[]> {
    try {
      const usersRef = this.getUsersRef();
      const q = query(
        usersRef,
        where('displayName', '==', name), // TODO: Add search by name
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => (doc.data() as User));
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new Error('Failed to fetch users');
    }
  }
}
