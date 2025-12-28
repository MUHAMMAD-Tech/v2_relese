# Transaction Request Flow Verification

## System Architecture

### Database Layer
- **Table**: `transactions`
- **Columns**: id, holder_id, transaction_type, from_token, to_token, amount, fee, net_amount, execution_price, received_amount, status, requested_at, approved_at, approved_by, notes
- **Enums**: 
  - transaction_type: 'swap', 'buy', 'sell'
  - status: 'pending', 'approved', 'rejected'

### API Functions
1. **createTransaction()** - Creates new transaction request with status='pending'
2. **getPendingTransactions()** - Fetches all pending transactions ordered by requested_at DESC
3. **approveTransaction()** - Approves transaction and updates holder balances
4. **rejectTransaction()** - Rejects transaction request

### RLS Policies
- Holders can INSERT their own transactions
- Holders can SELECT their own transactions
- Admins can SELECT/UPDATE/DELETE all transactions

## Request Flow

### 1. Holder Submits Request

**Swap Request:**
```typescript
// HolderTransactionsPage.tsx - handleSwapSubmit()
const result = await createTransaction(
  currentHolder.id,
  'swap',
  {
    from_token: 'ICP',
    to_token: 'BTC',
    amount: '100',
    fee: '1',
    net_amount: '99',
  }
);
// Shows: "Swap request sent. Waiting for admin approval."
```

**Buy Request:**
```typescript
// HolderTransactionsPage.tsx - handleBuySubmit()
const result = await createTransaction(
  currentHolder.id,
  'buy',
  {
    to_token: 'ETH',
    amount: '5',
    net_amount: '5',
  }
);
// Shows: "Buy request sent. Waiting for admin approval."
```

**Sell Request:**
```typescript
// HolderTransactionsPage.tsx - handleSellSubmit()
const result = await createTransaction(
  currentHolder.id,
  'sell',
  {
    from_token: 'BTC',
    amount: '0.5',
    net_amount: '0.5',
  }
);
// Shows: "Sell request sent. Contact admin via Telegram."
```

### 2. Request Stored in Database

- Transaction inserted with `status='pending'`
- `requested_at` timestamp automatically set
- Request persists across page refreshes and server restarts

### 3. Admin Panel Displays Request

**AdminApprovalsPage.tsx:**
- Loads pending transactions on mount
- Polls every 3 seconds for new requests
- Displays:
  - Holder name
  - Transaction type (Swap/Buy/Sell)
  - Asset details (from/to tokens, amounts)
  - Fee
  - Requested timestamp
  - Approve/Reject buttons

### 4. Admin Approves/Rejects

**Approve Swap:**
1. Admin clicks "Approve"
2. Dialog opens requesting execution price
3. Admin enters price (e.g., 0.00015 BTC per ICP)
4. System calculates: received_amount = net_amount × execution_price
5. Updates transaction status to 'approved'
6. Updates holder balances:
   - Deducts from_token amount
   - Adds to_token received_amount
7. Records commission fee

**Approve Buy:**
1. Admin clicks "Approve"
2. Confirms approval
3. Updates transaction status to 'approved'
4. Adds to_token amount to holder's portfolio

**Approve Sell:**
1. Admin clicks "Approve"
2. Confirms approval
3. Updates transaction status to 'approved'
4. Deducts from_token amount from holder's portfolio

**Reject:**
1. Admin clicks "Reject"
2. Updates transaction status to 'rejected'
3. No balance changes

### 5. Real-Time Updates

- Admin panel polls every 3 seconds
- New requests appear within 3 seconds
- Approved/rejected requests disappear from pending list
- Holder can view transaction history with updated status

## Verification Checklist

✅ **Database Persistence**
- [x] Transactions table exists with correct schema
- [x] Enums defined for transaction_type and status
- [x] RLS policies allow holder INSERT and SELECT
- [x] RLS policies allow admin full access

✅ **Holder Submission**
- [x] Swap form calls createTransaction() with correct data
- [x] Buy form calls createTransaction() with correct data
- [x] Sell form calls createTransaction() with correct data
- [x] Success toast shows confirmation message
- [x] Error toast shows on failure

✅ **Admin Panel**
- [x] AdminApprovalsPage component created
- [x] Route registered in routes.tsx
- [x] Fetches pending transactions on mount
- [x] Polls every 3 seconds for updates
- [x] Displays all transaction details
- [x] Shows empty state when no requests

✅ **Approval Flow**
- [x] Approve button opens dialog
- [x] Swap approval requires execution price
- [x] Buy/Sell approval confirms immediately
- [x] approveTransaction() updates status
- [x] approveTransaction() updates balances
- [x] approveTransaction() records commission
- [x] Success toast on approval
- [x] Error toast on failure

✅ **Rejection Flow**
- [x] Reject button calls rejectTransaction()
- [x] Updates status to 'rejected'
- [x] No balance changes
- [x] Success toast on rejection

✅ **Data Integrity**
- [x] Requests ordered by requested_at DESC (newest first)
- [x] Requests persist across page refresh
- [x] Requests persist across server restart
- [x] No silent failures (all errors logged and toasted)

## Testing Instructions

### Test 1: Submit Swap Request
1. Login as holder
2. Go to Transactions page
3. Select Swap tab
4. Choose from_token (e.g., ICP)
5. Choose to_token (e.g., BTC)
6. Enter amount (e.g., 100)
7. Click "Submit Swap Request"
8. Verify success toast appears
9. Logout

### Test 2: Admin Sees Request
1. Login as admin (code: Muso2909)
2. Go to Approvals page
3. Verify swap request appears within 3 seconds
4. Verify holder name, tokens, amount, fee displayed

### Test 3: Admin Approves Swap
1. Click "Approve" on swap request
2. Enter execution price (e.g., 0.00015)
3. Click "Confirm Approval"
4. Verify success toast
5. Verify request disappears from pending list
6. Go to Assets page
7. Select the holder
8. Verify from_token balance decreased
9. Verify to_token balance increased (or new asset created)

### Test 4: Persistence Check
1. Refresh browser page
2. Verify no pending requests shown (already approved)
3. Submit new request as holder
4. Refresh admin panel
5. Verify new request still appears

### Test 5: Buy Request
1. Login as holder
2. Submit buy request for ETH (5 tokens)
3. Login as admin
4. Approve buy request
5. Verify holder's ETH balance increased by 5

### Test 6: Sell Request
1. Login as holder
2. Submit sell request for BTC (0.5 tokens)
3. Login as admin
4. Approve sell request
5. Verify holder's BTC balance decreased by 0.5

### Test 7: Rejection
1. Submit any request as holder
2. Login as admin
3. Click "Reject"
4. Verify request disappears
5. Verify no balance changes

## Expected Results

✅ All requests reach admin panel within 3 seconds
✅ Requests persist across refreshes and restarts
✅ Approvals update balances correctly
✅ Rejections do not affect balances
✅ No silent failures
✅ All actions show appropriate toast notifications
✅ System behaves like a real fund workflow

## Technical Notes

- **Polling Interval**: 3 seconds (configurable via POLL_INTERVAL constant)
- **Order**: Newest requests first (requested_at DESC)
- **Balance Updates**: Atomic operations within approveTransaction()
- **Commission Recording**: Automatic for swap transactions with fee > 0
- **Error Handling**: All API errors logged to console and shown via toast
