# Firebase Database Structure

## Collections

### `toasts` Collection

Stores all toasts with vote counts embedded (hybrid approach):

```typescript
interface Toast {
  id: string; // Auto-generated document ID
  text: string; // The toast text
  likes: number; // Number of likes (embedded for performance)
  dislikes: number; // Number of dislikes (embedded for performance)
  createdBy: string; // Who created the toast (default: "system")
  createdAt: Date; // Creation date
  updatedAt: Date; // Last update date
  voteSummary?: {
    totalVotes: number; // Total number of votes
    lastVoteAt?: Date; // When the last vote was cast
  };
}
```

**Example Document:**

```json
{
  "id": "abc123",
  "text": "May we all stay healthy and never see each other again!",
  "likes": 5,
  "dislikes": 2,
  "createdBy": "system",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "voteSummary": {
    "totalVotes": 7,
    "lastVoteAt": "2024-01-15T10:30:00Z"
  }
}
```

### `votes` Collection (Optional - for audit trail)

Stores individual vote records for audit purposes:

```typescript
interface VoteRecord {
  id: string; // Auto-generated document ID
  toastId: string; // Reference to the toast
  userId: string; // User ID (or "anonymous")
  vote: 'like' | 'dislike'; // Type of vote
  createdAt: Date; // Creation date
}
```

**Example Document:**

```json
{
  "id": "vote123",
  "toastId": "abc123",
  "userId": "anonymous",
  "vote": "like",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

## Design Decision: Hybrid Approach

### Why this approach?

1. **Performance**: Vote counts are embedded in toast documents for fast reads
2. **Scalability**: Individual vote records are optional and can be disabled for high-traffic apps
3. **Flexibility**: Can easily switch between approaches based on needs
4. **Audit Trail**: Optional vote records for compliance/analytics

### Alternative Approaches:

**Option 1: Votes only in toast documents**

- ✅ Simple, fast reads
- ❌ No audit trail, can't track individual votes

**Option 2: Separate collections only**

- ✅ Full audit trail, normalized data
- ❌ More complex, slower reads

**Option 3: Hybrid (current)**

- ✅ Best of both worlds
- ❌ Slightly more complex

## Security Rules (Firestore Rules)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Toasts can be read by everyone
    match /toasts/{toastId} {
      allow read: if true;
      allow write: if request.auth != null || request.resource.data.createdBy == "system";
    }

    // Votes can be read and written by everyone (for demo purposes)
    // In production, you might want to restrict this
    match /votes/{voteId} {
      allow read, write: if true;
    }
  }
}
```

## Functions

### Toast Management

- `getAllToasts()`: Get all toasts
- `getToastById(id)`: Get a single toast
- `getRandomToast()`: Get a random toast
- `createToast(data)`: Create a new toast

### Vote Management

- `updateToastVote(data)`: Update vote for a toast
- `getUserVote(toastId, userId)`: Get user vote
- `getToastWithUserVote(toastId, userId)`: Get toast with user vote

### Development

- `initializeSampleData()`: Load sample data for development

## Development

For development, `"system"` is used as `createdBy` by default. In a production environment, a real user ID should be used here.

Votes are stored with `"anonymous"` as `userId`. In a real application, a unique user ID should be used here.
