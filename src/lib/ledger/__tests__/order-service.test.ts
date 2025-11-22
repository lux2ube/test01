import { createOrder, changeOrderStatus } from '../order-service';
import { getAvailableBalance } from '../balance-service';
import { supabaseAdmin, InsufficientBalanceError } from '../database';

jest.mock('../database');
jest.mock('../balance-service');

describe('Order Service', () => {
  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
  const mockReferenceId = '987fcdeb-51a2-43d7-b890-123456789abc';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    it('should successfully create order if balance is sufficient', async () => {
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
        type: 'order_created',
        amount: -300.00,
        reference_id: mockReferenceId,
        created_at: new Date()
      };

      const mockEvent = {
        id: 'event-1',
        transaction_id: 'tx-1',
        event_type: 'ORDER_CREATED',
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
        total_orders: '300.00'
      };

      const mockAuditLog = {
        id: 'log-1',
        user_id: mockUserId,
        action: 'ORDER_CREATED',
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

      const result = await createOrder({
        userId: mockUserId,
        amount: 300.00,
        referenceId: mockReferenceId
      });

      expect(result.transaction.type).toBe('order_created');
      expect(result.updated_account.total_orders).toBe('300.00');
    });

    it('should reject order if balance is insufficient', async () => {
      (getAvailableBalance as jest.Mock).mockResolvedValue({
        user_id: mockUserId,
        total_earned: 100,
        total_withdrawn: 0,
        total_pending_withdrawals: 0,
        total_orders: 0,
        available_balance: 100
      });

      await expect(
        createOrder({
          userId: mockUserId,
          amount: 200.00,
          referenceId: mockReferenceId
        })
      ).rejects.toThrow(InsufficientBalanceError);
    });
  });

  describe('changeOrderStatus', () => {
    it('should release funds when order is cancelled', async () => {
      const mockTransaction = {
        id: 'tx-1',
        user_id: mockUserId,
        type: 'order_cancelled',
        amount: 0,
        reference_id: mockReferenceId,
        created_at: new Date()
      };

      const mockEvent = {
        id: 'event-1',
        transaction_id: 'tx-1',
        event_type: 'ORDER_STATUS_CHANGED',
        event_data: {},
        created_at: new Date()
      };

      const mockAccountBefore = {
        total_earned: '1000.00',
        total_withdrawn: '0.00',
        total_pending_withdrawals: '0.00',
        total_orders: '300.00'
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
        action: 'ORDER_STATUS_CHANGED',
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

      const result = await changeOrderStatus({
        userId: mockUserId,
        referenceId: mockReferenceId,
        oldStatus: 'pending',
        newStatus: 'cancelled',
        amount: 300.00
      });

      expect(result.transaction.type).toBe('order_cancelled');
      expect(result.updated_account.total_orders).toBe('0.00');
    });

    it('should reject status change if old and new status are the same', async () => {
      await expect(
        changeOrderStatus({
          userId: mockUserId,
          referenceId: mockReferenceId,
          oldStatus: 'pending',
          newStatus: 'pending',
          amount: 300.00
        })
      ).rejects.toThrow('Old status and new status cannot be the same');
    });
  });
});
