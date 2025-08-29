# Firebase Database Structure

## Collections

### `toasts` Collection

Stores all toasts with vote counts embedded:

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

## Local Storage for Anonymous User Votes

Since the app supports anonymous users, individual vote tracking is done locally on each device using `localStorage`:

```typescript
interface LocalVoteStorage {
  votes: Record<string, LocalVote>;
  lastUpdated: number;
}

interface LocalVote {
  toastId: string;
  vote: 'like' | 'dislike';
  timestamp: number;
}
```

**Storage Key:** `cheers-up-user-votes`

**Example localStorage data:**

```json
{
  "votes": {
    "abc123": {
      "toastId": "abc123",
      "vote": "like",
      "timestamp": 1705312200000
    },
    "def456": {
      "toastId": "def456",
      "vote": "dislike",
      "timestamp": 1705312300000
    }
  },
  "lastUpdated": 1705312300000
}
```

## Seen Toasts Tracking

To ensure users see each toast only once until all toasts have been seen, the app tracks seen toasts locally:

```typescript
interface SeenToastsStorage {
  seenToastIds: string[];
  lastUpdated: number;
}
```

**Storage Key:** `cheers-up-seen-toasts`

**Example localStorage data:**

```json
{
  "seenToastIds": ["abc123", "def456", "ghi789"],
  "lastUpdated": 1705312300000
}
```

**How it works:**

1. When a toast is displayed, it's marked as "seen"
2. Only unseen toasts are shown in the random selection
3. When all toasts have been seen, the seen list is cleared
4. User sees "All seen - starting over!" message
5. Process repeats with fresh random selection

## Design Decision: Local Storage for Anonymous Users

### Why this approach?

1. **Privacy**: User votes remain completely anonymous and local
2. **Performance**: No need to query Firebase for individual user votes
3. **Multi-Device**: Each device maintains its own vote history
4. **Simplicity**: Firebase only stores aggregate vote counts
5. **Scalability**: No user-specific data in Firebase

### How it works:

1. **Voting**: User clicks like/dislike → stored locally + Firebase count updated
2. **Loading**: Toast loads → local vote status checked and applied
3. **Persistence**: Votes survive browser sessions via localStorage
4. **Privacy**: No user identification or tracking

### Security Rules (Firestore Rules)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Toasts can be read by everyone
    match /toasts/{toastId} {
      allow read: if true;
      allow write: if request.auth != null || request.resource.data.createdBy == "system";
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

- `updateToastVote(data)`: Update vote count in Firebase
- `getLocalVote(toastId)`: Get user vote from localStorage
- `setLocalVote(toastId, vote)`: Set user vote in localStorage

### Local Storage Functions

- `getLocalVotes()`: Get all local votes
- `saveLocalVotes(votes)`: Save all local votes
- `clearLocalVotes()`: Clear all local votes (for testing)

### Seen Toasts Functions

- `getSeenToasts()`: Get all seen toast IDs
- `markToastAsSeen(toastId)`: Mark a toast as seen
- `getUnseenToasts(allToastIds)`: Get list of unseen toast IDs
- `resetSeenToastsIfAllSeen(allToastIds)`: Reset seen list if all toasts seen
- `clearSeenToasts()`: Clear all seen toasts (for testing)

## Development

For development, `"system"` is used as `createdBy` by default. In a production environment, a real user ID should be used here.

Votes are stored locally on each device, making the app truly anonymous and multi-user friendly.
