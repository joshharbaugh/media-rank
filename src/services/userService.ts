import { collection, doc, getDoc, getDocs, orderBy, query, where, limit, updateDoc, writeBatch, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserProfile } from "@/types/user";
import { ElasticService } from "@/services/elasticService";

export class UserService {
  private static getUsersRef() {
    return collection(db, 'users');
  }

  private static getUserProfileRef(userId: string) {
    return doc(db, 'users', userId);
  }

  // Check if Elasticsearch is available
  private static async isElasticsearchAvailable(): Promise<boolean> {
    try {
      return await ElasticService.checkElasticsearch();
    } catch {
      console.warn('Elasticsearch not available, falling back to Firestore search');
      return false;
    }
  }

  // Get user profile by ID
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(this.getUserProfileRef(userId));

      if (!userDoc.exists()) {
        return null;
      }

      return userDoc.data() as UserProfile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw new Error('Failed to fetch user profile');
    }
  }

  // Get users by name with fuzzy search (Elasticsearch preferred, Firestore fallback)
  static async getUsersByName(searchTerm: string, limitCount: number = 10): Promise<UserProfile[]> {
    try {
      if (!searchTerm || searchTerm.trim().length === 0) {
        return [];
      }

      // Try Elasticsearch first
      const isElasticAvailable = await this.isElasticsearchAvailable();
      if (isElasticAvailable) {
        try {
          const results = await ElasticService.searchUsersByName(searchTerm, limitCount);
          return results;
        } catch (elasticError) {
          console.warn('Elasticsearch search failed, falling back to Firestore:', elasticError);
        }
      }

      // Fallback to Firestore search
      return await this.getUsersByNameFirestore(searchTerm, limitCount);
    } catch (error) {
      console.error('Error fetching users by name:', error);
      throw new Error('Failed to fetch users by name');
    }
  }

  // Firestore-based search (fallback method)
  private static async getUsersByNameFirestore(searchTerm: string, limitCount: number = 10): Promise<UserProfile[]> {
    try {
      const usersRef = this.getUsersRef();
      const normalizedSearchTerm = searchTerm.toLowerCase().trim();

      // Create a range query for prefix matching
      const q = query(
        usersRef,
        where('displayNameLower', '>=', normalizedSearchTerm),
        where('displayNameLower', '<', normalizedSearchTerm + '\uf8ff'),
        orderBy('displayNameLower'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const results = snapshot.docs.map(doc => doc.data() as UserProfile);

      // If we don't have enough results with prefix matching, try substring matching
      if (results.length < limitCount && normalizedSearchTerm.length > 2) {
        const additionalResults = await this.getUsersBySubstring(normalizedSearchTerm, limitCount - results.length);

        // Merge and deduplicate results
        const allResults = [...results, ...additionalResults];
        const uniqueResults = allResults.filter((user, index, self) =>
          index === self.findIndex(u => u.uid === user.uid)
        );

        return uniqueResults.slice(0, limitCount);
      }

      return results;
    } catch (error) {
      console.error('Error in Firestore search:', error);
      throw new Error('Failed to search users in Firestore');
    }
  }

  // Get users by substring (for names that contain the search term but don't start with it)
  private static async getUsersBySubstring(searchTerm: string, limitCount: number = 5): Promise<UserProfile[]> {
    try {
      const usersRef = this.getUsersRef();

      // Get all users and filter in memory for substring matches
      const q = query(
        usersRef,
        orderBy('displayNameLower'),
        limit(25) // Limit to prevent performance issues
      );

      const snapshot = await getDocs(q);
      const allUsers = snapshot.docs.map(doc => doc.data() as UserProfile);

      // Filter for substring matches
      const substringMatches = allUsers.filter(user =>
        user.displayName.toLowerCase().includes(searchTerm) &&
        !user.displayName.toLowerCase().startsWith(searchTerm) // Exclude prefix matches we already found
      );

      return substringMatches.slice(0, limitCount);
    } catch (error) {
      console.error('Error fetching users by substring:', error);
      return [];
    }
  }

  // Get multiple users by their IDs
  static async getUsersByIds(userIds: string[]): Promise<UserProfile[]> {
    try {
      if (!userIds || userIds.length === 0) {
        return [];
      }

      // Try Elasticsearch first
      const isElasticAvailable = await this.isElasticsearchAvailable();
      if (isElasticAvailable) {
        try {
          const results = await ElasticService.getUsersByIds(userIds);
          return results;
        } catch (elasticError) {
          console.warn('Elasticsearch bulk fetch failed, falling back to Firestore:', elasticError);
        }
      }

      // Fallback to Firestore
      const users: UserProfile[] = [];

      // Firestore doesn't support 'in' queries with more than 10 values
      const batchSize = 10;
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);

        const batchPromises = batch.map(userId => this.getUserProfile(userId));
        const batchResults = await Promise.all(batchPromises);

        users.push(...batchResults.filter(user => user !== null) as UserProfile[]);
      }

      return users;
    } catch (error) {
      console.error('Error fetching users by IDs:', error);
      throw new Error('Failed to fetch users by IDs');
    }
  }

  // Search users with multiple criteria
  static async searchUsers(criteria: {
    name?: string;
    email?: string;
    limit?: number;
  }): Promise<UserProfile[]> {
    try {
      const { name, email, limit: limitCount = 10 } = criteria;

      if (!name && !email) {
        return [];
      }

      // Try Elasticsearch first
      const isElasticAvailable = await this.isElasticsearchAvailable();
      if (isElasticAvailable) {
        try {
          const results = await ElasticService.searchUsers({ name, email, limit: limitCount });
          return results;
        } catch (elasticError) {
          console.warn('Elasticsearch search failed, falling back to Firestore:', elasticError);
        }
      }

      // Fallback to Firestore
      if (name && email) {
        // Search by both name and email
        const nameResults = await this.getUsersByNameFirestore(name, limitCount);
        return nameResults.filter(user => user.email === email);
      } else if (name) {
        return await this.getUsersByNameFirestore(name, limitCount);
      } else if (email) {
        // Search by email only
        const usersRef = this.getUsersRef();
        const q = query(
          usersRef,
          where('email', '==', email),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as UserProfile);
      }

      return [];
    } catch (error) {
      console.error('Error searching users:', error);
      throw new Error('Failed to search users');
    }
  }

  // Update user profile to include displayNameLower field (for backward compatibility)
  static async updateUserForSearch(userId: string): Promise<void> {
    try {
      const user = await this.getUserProfile(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Only update if displayNameLower doesn't exist
      if (!user.displayNameLower) {
        const userRef = this.getUserProfileRef(userId);
        await updateDoc(userRef, {
          displayNameLower: user.displayName.toLowerCase(),
          updatedAt: serverTimestamp() as Timestamp
        });

        // Also update in Elasticsearch if available
        try {
          const isElasticAvailable = await this.isElasticsearchAvailable();
          if (isElasticAvailable) {
            await ElasticService.updateUser(userId, { displayNameLower: user.displayName.toLowerCase() });
          }
        } catch (elasticError) {
          console.warn('Failed to update user in Elasticsearch:', elasticError);
        }
      }
    } catch (error) {
      console.error('Error updating user for search:', error);
      throw new Error('Failed to update user for search');
    }
  }

  // Batch update all users to include displayNameLower field
  static async updateAllUsersForSearch(): Promise<void> {
    try {
      const usersRef = this.getUsersRef();
      const q = query(usersRef, orderBy('createdAt'));
      const snapshot = await getDocs(q);

      const batch = writeBatch(db);
      let batchCount = 0;
      const maxBatchSize = 500; // Firestore batch limit

      const usersToIndex: UserProfile[] = [];

      for (const doc of snapshot.docs) {
        const userData = doc.data() as UserProfile;

        // Only update if displayNameLower doesn't exist
        if (!userData.displayNameLower) {
          batch.update(doc.ref, {
            displayNameLower: userData.displayName.toLowerCase(),
            updatedAt: serverTimestamp() as Timestamp
          });
          batchCount++;

          // Prepare for Elasticsearch indexing
          usersToIndex.push({
            ...userData,
            displayNameLower: userData.displayName.toLowerCase()
          });

          // Commit batch when it reaches the limit
          if (batchCount >= maxBatchSize) {
            await batch.commit();
            batchCount = 0;
          }
        }
      }

      // Commit any remaining updates
      if (batchCount > 0) {
        await batch.commit();
      }

      // Update Elasticsearch if available
      try {
        const isElasticAvailable = await this.isElasticsearchAvailable();
        if (isElasticAvailable && usersToIndex.length > 0) {
          await ElasticService.bulkIndexUsers(usersToIndex);
        }
      } catch (elasticError) {
        console.warn('Failed to bulk index users in Elasticsearch:', elasticError);
      }
    } catch (error) {
      console.error('Error updating all users for search:', error);
      throw new Error('Failed to update all users for search');
    }
  }

  // Suggest users (autocomplete functionality)
  static async suggestUsers(prefix: string, limit: number = 5): Promise<string[]> {
    try {
      // Try Elasticsearch first
      const isElasticAvailable = await this.isElasticsearchAvailable();
      if (isElasticAvailable) {
        try {
          return await ElasticService.suggestUsers(prefix, limit);
        } catch (elasticError) {
          console.warn('Elasticsearch suggestions failed:', elasticError);
        }
      }

      // Fallback to simple prefix matching
      const users = await this.getUsersByNameFirestore(prefix, limit);
      return users.map(user => user.displayName);
    } catch (error) {
      console.error('Error suggesting users:', error);
      return [];
    }
  }
}
