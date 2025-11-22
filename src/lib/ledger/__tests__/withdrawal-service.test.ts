import { createWithdrawal, changeWithdrawalStatus } from '../withdrawal-service';
import { getAvailableBalance } from '../balance-service';
import { supabaseAdmin, InsufficientBalanceError } from '../database';

jest.mock('../database');
jest.mock('../balance-service');

describe('Withdrawal Service', () => {
  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
  const mockReferenceId = '987fcdeb-51a2-43d7-b890-123456789abc';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createWithdrawal', () => {
    it('should successfully create withdrawal if balance is sufficient', async () => {
      (getAvailableBalance as jest.Mock).mockResolvedValue({
        user_id: mockUserId,
        total_earned: 1000,
        total_withdrawn: 0,
        total_pending_withdrawals: 0,
        total_orders: 0,
        available_balance: 1000
      });

      const mockTransaction = {
        id: 'tx-1',
        user_id: mockUserId,
        type: 'withdrawal_processing',
        amount: -200.00,
        reference_id: mockReferenceId,
        created_at: new Date()
      };

      const mockEvent = {
        id: 'event-1',
        transaction_id: 'tx-1',
        event_type: 'WITHDRAWAL_CREATED',
        event_data: {},
        created_at: new Date()
      };

      const mockAccountBefore = {
        total_earned: '1000.00',
        total_withdrawn: '0.00',
        total_pending_withdrawals: '0.00',
        total_orders: '0.00'
      };

      const mockAccountAfter = {
        ...mockAccountBefore,
        total_pending_withdrawals: '200.00'
      };

      const mockAuditLog = {
        id: 'log-1',
        user_id: mockUserId,
        action: 'WITHDRAWAL_CREATED',
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

      const result = await createWithdrawal({
        userId: mockUserId,
        amount: 200.00,
        referenceId: mockReferenceId
      });

      expect(result.transaction.type).toBe('withdrawal_processing');
      expect(result.updated_account.total_pending_withdrawals).toBe('200.00');
    });

    it('should reject withdrawal if balance is insufficient', async () => {
      (getAvailableBalance as jest.Mock).mockResolvedValue({
        user_id: mockUserId,
        total_earned: 100,
        total_withdrawn: 0,
        total_pending_withdrawals: 0,
        total_orders: 0,
        available_balance: 100
      });

      await expect(
        createWithdrawal({
          userId: mockUserId,
          amount: 200.00,
          referenceId: mockReferenceId
        })
      ).rejects.toThrow(InsufficientBalanceError);
    });
  });

  describe('changeWithdrawalStatus', () => {
    it('should move from processing to completed correctly', async () => {
      const mockTransaction = {
        id: 'tx-1',
        user_id: mockUserId,
        type: 'withdrawal_completed',
        amount: 0,
        reference_id: mockReferenceId,
        created_at: new Date()
      };

      const mockEvent = {
        id: 'event-1',
        transaction_id: 'tx-1',
        event_type: 'WITHDRAWAL_STATUS_CHANGED',
        event_data: {},
        created_at: new Date()
      };

      const mockAccountBefore = {
        total_earned: '1000.00',
        total_withdrawn: '0.00',
        total_pending_withdrawals: '200.00',
        total_orders: '0.00'
      };

      const mockAccountAfter = {
        total_earned: '1000.00',
        total_withdrawn: '200.00',
        total_pending_withdrawals: '0.00',
        total_orders: '0.00'
      };

      const mockAuditLog = {
        id: 'log-1',
        user_id: mockUserId,
        action: 'WITHDRAWAL_STATUS_CHANGED',
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

      const result = await changeWithdrawalStatus({
        userId: mockUserId,
        referenceId: mockReferenceId,
        oldStatus: 'processing',
        newStatus: 'completed',
        amount: 200.00
      });

      expect(result.transaction.type).toBe('withdrawal_completed');
      expect(result.updated_account.total_withdrawn).toBe('200.00');
      expect(result.updated_account.total_pending_withdrawals).toBe('0.00');
    });

    it('should handle cancellation correctly', async () => {
      const mockTransaction = {
        id: 'tx-1',
        user_id: mockUserId,
        type: 'withdrawal_cancelled',
        amount: 0,
        reference_id: mockReferenceId,
        created_at: new Date()
      };

      const mockEvent = {
        id: 'event-1',
        transaction_id: 'tx-1',
        event_type: 'WITHDRAWAL_STATUS_CHANGED',
        event_data: {},
        created_at: new Date()
      };

      const mockAccountBefore = {
        total_earned: '1000.00',
        total_withdrawn: '0.00',
        total_pending_withdrawals: '200.00',
        total_orders: '0.00'
      };

      const mockAccountAfter = {
        total_earned: '1000.00',
        total_withdrawn: '0.00',
        total_pending_withdrawals: '0.00',
        total_orders: '0.00'
      };

      const mockAuditLog = {
        id: 'log-1',
        user_id: mockUserId,
        action: 'WITHDRAWAL_STATUS_CHANGED',
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

      const result = await changeWithdrawalStatus({
        userId: mockUserId,
        referenceId: mockReferenceId,
        oldStatus: 'processing',
        newStatus: 'cancelled',
        amount: 200.00
      });

      expect(result.transaction.type).toBe('withdrawal_cancelled');
      expect(result.updated_account.total_pending_withdrawals).toBe('0.00');
    });
  });
});
