# Security Specification (TDD SPEC) — Katatib

This document defines the data invariants, threat model, and specific adversarial payloads ("The Dirty Dozen") used to verify the security of the Katatib Firestore database rules.

## 1. Data Invariants

1. **User Profiles (`/user_profiles/{userId}`)**:
   - Only the authenticated owner of the profile (`request.auth.uid == userId`) is allowed to read or write their profile.
   - Users are strictly forbidden from setting or changing their roles to elevate privileges.
   - The user's email verified token state (`request.auth.token.email_verified`) must be `true` for any write operations.

2. **Tahfid Centers (`/tahfid_centers/{centerId}`)**:
   - Any authenticated user can read / list centers (publicly accessible for discovery).
   - Only users with the role of `host` (as verified) can create centers.
   - The document's `createdBy` field must strictly match the creator's authenticated UID.
   - The center can only be edited by the host who created it (`existing().createdBy == request.auth.uid`).
   - Fields like `createdAt` and `createdBy` are immutable.
   - Latitude and longitude must be valid coordinates (`lat` between -90 and 90, `lng` between -180 and 180).
   - Array fields (`languages`, `recitationStyles`, `ageGroups`) must be strictly bounded in size to prevent denial of wallet attacks.

3. **Reviews (`/tahfid_centers/{centerId}/reviews/{reviewId}`)**:
   - Reviews are public and can be read by anyone.
   - Creation of reviews requires a verified traveler account (`request.auth.uid != null`).
   - The `userId` of the review must strictly match `request.auth.uid`.
   - The rating must be an integer between 1 and 5.
   - Review creation requires verifying that the target center actually exists using `exists(/databases/$(database)/documents/tahfid_centers/$(centerId))`.

---

## 2. The "Dirty Dozen" Payloads (Adversarial Test Suite)

Here are 12 specific payloads representing attacks designed to break identity, integrity, and safety:

### Payload 1: Privilege Escalation (Self-Assigned Host Role during Signup)
*   **Target Path**: `/user_profiles/attacker123`
*   **Attack**: Attacker attempts to register a profile with a self-assigned high-privilege role or bypass email verification.
*   **Expected Outcome**: `PERMISSION_DENIED`
```json
{
  "uid": "attacker123",
  "displayName": "Hacker Jane",
  "email": "attacker@gmail.com",
  "role": "host",
  "createdAt": "2026-06-29T00:00:00Z",
  "updatedAt": "2026-06-29T00:00:00Z"
}
```

### Payload 2: Host Identity Impersonation (Spoofing Creator UID)
*   **Target Path**: `/tahfid_centers/center789`
*   **Attack**: Attacker tries to create a center with a `createdBy` field belonging to a victim user (`victim456`), hoping to lock them out or hijack credit.
*   **Expected Outcome**: `PERMISSION_DENIED`
```json
{
  "id": "center789",
  "name": "Istanbul Quran Circle",
  "description": "Short term drop-ins welcomed",
  "lat": 41.0082,
  "lng": 28.9784,
  "address": "Fatih, Istanbul",
  "city": "Istanbul",
  "country": "Turkey",
  "dropInWelcomed": true,
  "gender": "mixed",
  "ageGroups": ["youth", "adults"],
  "languages": ["English", "Arabic"],
  "recitationStyles": ["Hafs"],
  "operatingHours": "9:00 AM - 1:00 PM",
  "teacherName": "Sheikh Ahmed",
  "createdBy": "victim456",
  "createdAt": "2026-06-29T00:00:00Z",
  "updatedAt": "2026-06-29T00:00:00Z"
}
```

### Payload 3: Unauthenticated Center Creation
*   **Target Path**: `/tahfid_centers/center111`
*   **Attack**: Completely unauthenticated user attempts to create a new center.
*   **Expected Outcome**: `PERMISSION_DENIED`

### Payload 4: Host hijacking (Modifying Another Host's Center)
*   **Target Path**: `/tahfid_centers/center_of_host_A`
*   **Attack**: Host B (authenticated) attempts to write or update fields in Center A (owned by Host A).
*   **Expected Outcome**: `PERMISSION_DENIED`
```json
{
  "name": "Hijacked Name",
  "updatedAt": "2026-06-29T00:05:00Z"
}
```

### Payload 5: Immutable Field Violation (Modifying `createdAt` field)
*   **Target Path**: `/tahfid_centers/center_of_host_A`
*   **Attack**: The original creator of Center A attempts to modify the immutable `createdAt` timestamp.
*   **Expected Outcome**: `PERMISSION_DENIED`
```json
{
  "createdAt": "2020-01-01T00:00:00Z",
  "updatedAt": "2026-06-29T00:05:00Z"
}
```

### Payload 6: Out-of-Bounds Rating Value (Rating > 5)
*   **Target Path**: `/tahfid_centers/center_of_host_A/reviews/rev999`
*   **Attack**: User attempts to post a review with a rating of 99 to skew the average score.
*   **Expected Outcome**: `PERMISSION_DENIED`
```json
{
  "id": "rev999",
  "centerId": "center_of_host_A",
  "userId": "attacker123",
  "userName": "Hacker Jane",
  "rating": 99,
  "comment": "Spam rating",
  "travelerOrigin": "London, UK",
  "welcomingScore": 5,
  "createdAt": "2026-06-29T00:00:00Z"
}
```

### Payload 7: Review Identity Spoofing (Writing review as another user)
*   **Target Path**: `/tahfid_centers/center_of_host_A/reviews/rev100`
*   **Attack**: Attacker (`attacker123`) writes a review with a `userId` field claiming to be `victim456`.
*   **Expected Outcome**: `PERMISSION_DENIED`
```json
{
  "id": "rev100",
  "centerId": "center_of_host_A",
  "userId": "victim456",
  "userName": "Innocent User",
  "rating": 5,
  "comment": "Nice place",
  "travelerOrigin": "London, UK",
  "welcomingScore": 5,
  "createdAt": "2026-06-29T00:00:00Z"
}
```

### Payload 8: Reviewing Non-Existent Center (Orphaned reviews)
*   **Target Path**: `/tahfid_centers/fake_center_abc/reviews/rev101`
*   **Attack**: Attacker writes a review targeting a non-existent center, causing orphaned data.
*   **Expected Outcome**: `PERMISSION_DENIED`

### Payload 9: Denial of Wallet (Array size flooding)
*   **Target Path**: `/tahfid_centers/center789`
*   **Attack**: Attacker attempts to list 10,000 languages in the languages array to inflate storage size and trigger resource exhaustion.
*   **Expected Outcome**: `PERMISSION_DENIED`

### Payload 10: ID Poisoning Attack (1KB ID characters)
*   **Target Path**: `/tahfid_centers/SOME_VERY_LONG_ID_WITH_SPECIAL_CHARACTERS_THAT_IS_OVER_500_BYTES_AND_CONTAINS_INJECTED_XSS`
*   **Attack**: Attacker tries to inject a massive string containing scripts as the document ID to pollute local storage and route handlers.
*   **Expected Outcome**: `PERMISSION_DENIED`

### Payload 11: PII Leak Attempt (Reading other user profiles)
*   **Target Path**: `/user_profiles/victim456`
*   **Attack**: Attacker123 attempts to retrieve the user profile document of victim456.
*   **Expected Outcome**: `PERMISSION_DENIED`

### Payload 12: Spatial Coord Poisoning (Out of range lat/lng values)
*   **Target Path**: `/tahfid_centers/center789`
*   **Attack**: Host sets center coordinates to latitude `1000` and longitude `-500` which breaks the visual map engine.
*   **Expected Outcome**: `PERMISSION_DENIED`

---

## 3. Test Runner Design

Our codebase uses the Firestore client libraries. We secure all endpoints through robust checks.
We will write a rigorous `firestore.rules` file that perfectly blocks all 12 of these threat vectors.
We will run `eslint` or `compile_applet` to ensure full compliance.
