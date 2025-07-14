import { UserProfile } from '@/types/user';

interface ElasticSearchConfig {
  baseUrl: string;
  index: string;
  apiKey?: string;
  useProxy?: boolean; // Use a proxy to avoid CORS issues
  proxyUrl?: string; // URL of the proxy server
}

interface SearchResult {
  _id: string;
  _score: number;
  _source: UserProfile;
}

interface ElasticSearchResponse {
  hits: {
    total: {
      value: number;
    };
    hits: SearchResult[];
  };
}

interface SearchQuery {
  name?: string;
  email?: string;
  limit?: number;
  offset?: number;
}

interface ElasticSearchQuery {
  bool: {
    should: unknown[];
    must: unknown[];
  };
}

interface ElasticSearchSearchBody {
  from: number;
  size: number;
  query: ElasticSearchQuery;
  sort: unknown[];
}

interface ElasticSearchSuggestResponse {
  suggest: {
    user_suggestions: Array<{
      options: Array<{ text: string }>;
    }>;
  };
}

export class ElasticService {
  private static config: ElasticSearchConfig = {
    baseUrl: import.meta.env.VITE_ELASTICSEARCH_URL || 'http://localhost:9200',
    index: 'users',
    apiKey: import.meta.env.VITE_ELASTICSEARCH_API_KEY,
    useProxy: import.meta.env.VITE_ELASTICSEARCH_USE_PROXY === 'true',
    proxyUrl: import.meta.env.VITE_ELASTICSEARCH_PROXY_URL
  };

  private static getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `ApiKey ${this.config.apiKey}`;
    }

    return headers;
  }

  private static getRequestUrl(endpoint: string): string {
    if (this.config.useProxy && this.config.proxyUrl) {
      // Use proxy to avoid CORS issues
      return `${this.config.proxyUrl}/elasticsearch/${this.config.index}/${endpoint}`;
    } else {
      // Direct Elasticsearch connection
      return `${this.config.baseUrl}/${this.config.index}/${endpoint}`;
    }
  }

  private static async makeRequest(endpoint: string, options: RequestInit = {}): Promise<unknown> {
    const url = this.getRequestUrl(endpoint);

    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`Elasticsearch request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Index a user profile
  static async indexUser(user: UserProfile): Promise<void> {
    try {
      await this.makeRequest(`_doc/${user.uid}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...user,
          displayNameLower: user.displayName.toLowerCase(),
          searchableText: `${user.displayName} ${user.email || ''} ${user.bio || ''}`.toLowerCase()
        })
      });
    } catch (error) {
      console.error('Error indexing user:', error);
      throw new Error('Failed to index user');
    }
  }

  // Update a user profile
  static async updateUser(userId: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const updateData: Record<string, unknown> = { ...updates };

      // Update searchable fields if displayName changes
      if (updates.displayName) {
        updateData.displayNameLower = updates.displayName.toLowerCase();
        updateData.searchableText = `${updates.displayName} ${updates.email || ''} ${updates.bio || ''}`.toLowerCase();
      }

      await this.makeRequest(`_update/${userId}`, {
        method: 'POST',
        body: JSON.stringify({
          doc: updateData
        })
      });
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  }

  // Delete a user from the index
  static async deleteUser(userId: string): Promise<void> {
    try {
      await this.makeRequest(`_doc/${userId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  }

  // Search users with advanced query capabilities
  static async searchUsers(query: SearchQuery): Promise<UserProfile[]> {
    try {
      const { name, email, limit = 10, offset = 0 } = query;

      if (!name && !email) {
        return [];
      }

      const searchBody: ElasticSearchSearchBody = {
        from: offset,
        size: limit,
        query: {
          bool: {
            should: [],
            must: []
          }
        },
        sort: [
          { _score: { order: 'desc' } },
          { displayName: { order: 'asc' } }
        ]
      };

      // Name search with multiple strategies
      if (name) {
        const nameQueries = [
          // Exact match (highest boost)
          {
            match: {
              displayName: {
                query: name,
                boost: 3.0
              }
            }
          },
          // Prefix match
          {
            prefix: {
              displayNameLower: {
                value: name.toLowerCase(),
                boost: 2.0
              }
            }
          },
          // Fuzzy match for typos
          {
            fuzzy: {
              displayName: {
                value: name,
                fuzziness: 'AUTO',
                boost: 1.0
              }
            }
          },
          // Search in bio and other fields
          {
            multi_match: {
              query: name,
              fields: ['bio^0.5', 'searchableText^0.3'],
              type: 'best_fields',
              fuzziness: 'AUTO'
            }
          }
        ];

        searchBody.query.bool.should.push(...nameQueries);
      }

      // Email search
      if (email) {
        searchBody.query.bool.must.push({
          term: {
            email: email.toLowerCase()
          }
        });
      }

      const response = await this.makeRequest('_search', {
        method: 'POST',
        body: JSON.stringify(searchBody)
      }) as ElasticSearchResponse;

      return response.hits.hits.map(hit => ({
        ...hit._source,
        _score: hit._score
      }));
    } catch (error) {
      console.error('Error searching users:', error);
      throw new Error('Failed to search users');
    }
  }

  // Search users by name with fuzzy matching
  static async searchUsersByName(name: string, limit: number = 10): Promise<UserProfile[]> {
    return this.searchUsers({ name, limit });
  }

  // Search users by email
  static async searchUsersByEmail(email: string, limit: number = 5): Promise<UserProfile[]> {
    return this.searchUsers({ email, limit });
  }

  // Get users by IDs (bulk operation)
  static async getUsersByIds(userIds: string[]): Promise<UserProfile[]> {
    try {
      if (!userIds || userIds.length === 0) {
        return [];
      }

      const searchBody = {
        query: {
          terms: {
            _id: userIds
          }
        },
        size: userIds.length
      };

      const response = await this.makeRequest('_search', {
        method: 'POST',
        body: JSON.stringify(searchBody)
      }) as ElasticSearchResponse;

      return response.hits.hits.map(hit => hit._source);
    } catch (error) {
      console.error('Error getting users by IDs:', error);
      throw new Error('Failed to get users by IDs');
    }
  }

  // Suggest users (autocomplete functionality)
  static async suggestUsers(prefix: string, limit: number = 5): Promise<string[]> {
    try {
      const searchBody = {
        suggest: {
          user_suggestions: {
            prefix,
            completion: {
              field: 'displayName_suggest',
              size: limit,
              skip_duplicates: true
            }
          }
        }
      };

      const response = await this.makeRequest('_search', {
        method: 'POST',
        body: JSON.stringify(searchBody)
      }) as ElasticSearchSuggestResponse;

      return response.suggest?.user_suggestions?.[0]?.options?.map(option => option.text) || [];
    } catch (error) {
      console.error('Error suggesting users:', error);
      return [];
    }
  }

  // Bulk index users (for migration)
  static async bulkIndexUsers(users: UserProfile[]): Promise<void> {
    try {
      if (users.length === 0) return;

      const bulkBody = users.flatMap(user => [
        { index: { _id: user.uid } },
        {
          ...user,
          displayNameLower: user.displayName.toLowerCase(),
          searchableText: `${user.displayName} ${user.email || ''} ${user.bio || ''}`.toLowerCase()
        }
      ]);

      await this.makeRequest('_bulk', {
        method: 'POST',
        body: bulkBody.map(item => JSON.stringify(item)).join('\n') + '\n'
      });
    } catch (error) {
      console.error('Error bulk indexing users:', error);
      throw new Error('Failed to bulk index users');
    }
  }

  // Create or update the index mapping
  static async createIndex(): Promise<void> {
    try {
      const mapping: Record<string, unknown> = {
        mappings: {
          properties: {
            uid: { type: 'keyword' },
            email: { type: 'keyword' },
            displayName: {
              type: 'text',
              analyzer: 'standard',
              fields: {
                keyword: { type: 'keyword' },
                suggest: {
                  type: 'completion',
                  analyzer: 'simple'
                }
              }
            },
            displayNameLower: { type: 'keyword' },
            bio: { type: 'text', analyzer: 'standard' },
            searchableText: { type: 'text', analyzer: 'standard' },
            photoURL: { type: 'keyword' },
            favoriteGenres: { type: 'keyword' },
            createdAt: { type: 'date' },
            updatedAt: { type: 'date' },
            settings: {
              type: 'object',
              properties: {
                theme: { type: 'keyword' }
              }
            }
          }
        },
        settings: {
          analysis: {
            analyzer: {
              standard: {
                type: 'standard',
                stopwords: '_english_'
              }
            }
          }
        }
      };

      await this.makeRequest('', {
        method: 'PUT',
        body: JSON.stringify(mapping)
      });
    } catch (error) {
      console.error('Error creating index:', error);
      throw new Error('Failed to create index');
    }
  }

  static async checkElasticsearch(): Promise<boolean> {
    const response = await fetch(
      `/api/search`
    );
    return response.json();
  };

  // Check if Elasticsearch is available
  static async healthCheck(): Promise<boolean> {
    try {
      // For health check, we need to use the base URL directly
      const healthUrl = this.config.useProxy && this.config.proxyUrl
        ? `${this.config.proxyUrl}/elasticsearch/_cluster/health`
        : `${this.config.baseUrl}/_cluster/health`;

      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: this.getHeaders(),
        mode: 'cors' // Explicitly request CORS
      });

      if (response.ok) {
        return true;
      } else {
        console.warn('Elasticsearch health check failed with status:', response.status);
        return false;
      }
    } catch (error) {
      // Check if it's a CORS error specifically
      if (error instanceof TypeError && error.message.includes('CORS')) {
        console.warn('Elasticsearch CORS error - server may not be configured for browser requests');
        console.warn('Consider using a proxy or configuring CORS on your Elasticsearch server');
        return false;
      }

      console.warn('Elasticsearch health check failed:', error);
      return false;
    }
  }
}
