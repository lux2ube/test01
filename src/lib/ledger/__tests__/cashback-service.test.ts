import { addCashbackDirect } from '../cashback-service';
import { supabaseAdmin } from '../database';

jest.mock('../database');

describe('Cashback Service', () => {
  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
  const mockReferenceId = '987fcdeb-51a2-43d7-b890-123456789abc';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addCashbackDirect', () => {
    it('should successfully add cashback and update all tables', async () => {
      const mockTransaction = {
        id: 'tx-1',
        user_id: mockUserId,
        type: 'cashback',
        amount: 50.00,
        reference_id: mockReferenceId,
        metadata: {},
        created_at: new Date()
      };

      const mockEvent = {
        id: 'event-1',
        transaction_id: 'tx-1',
        event_type: 'CASHBACK_ADDED',
        event_data: {},
        created_at: new Date()
      };

      const mockAccountBefore = {
        total_earned: '100.00',
        total_withdrawn: '0.00',
        total_pending_withdrawals: '0.00',
        total_orders: '0.00'
      };

      const mockAccountAfter = {
        ...mockAccountBefore,
        total_earned: '150.00'
      };

      const mockAuditLog = {
        id: 'log-1',
        user_id: mockUserId,
        action: 'CASHBACK_ADDED',
        created_at: new Date()
      };

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce({
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockTransaction, error: null })
        })
        .mockReturnValueOnce({
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockEvent, error: null })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockAccountBefore, error: null })
        })
        .mockReturnValueOnce({
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockAccountAfter, error: null })
        })
        .mockReturnValueOnce({
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockAuditLog, error: null })
        });

      const result = await addCashbackDirect({
        userId: mockUserId,
        amount: 50.00,
        referenceId: mockReferenceId,
        metadata: { order_id: '12345' }
      });

      expect(result.transaction).toBeDefined();
      expect(result.event).toBeDefined();
      expect(result.audit_log).toBeDefined();
      expect(result.updated_account).toBeDefined();
    });

    it('should reject negative amounts', async () => {
      await expect(
        addCashbackDirect({
          userId: mockUserId,
          amount: -10.00,
          referenceId: mockReferenceId
        })
      ).rejects.toThrow('Cashback amount must be positive');
    });

    it('should reject zero amounts', async () => {
      await expect(
        addCashbackDirect({
          userId: mockUserId,
          amount: 0,
          referenceId: mockReferenceId
        })
      ).rejects.toThrow('Cashback amount must be positive');
    });
  });
});
