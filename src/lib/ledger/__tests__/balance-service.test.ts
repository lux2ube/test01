import { getAvailableBalance, getAccount } from '../balance-service';
import { supabaseAdmin } from '../database';

jest.mock('../database');

describe('Balance Service', () => {
  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAvailableBalance', () => {
    it('should calculate available balance correctly', async () => {
      const mockAccount = {
        id: '1',
        user_id: mockUserId,
        total_earned: '1000.00',
        total_withdrawn: '200.00',
        total_pending_withdrawals: '100.00',
        total_orders: '150.00',
        created_at: new Date(),
        updated_at: new Date()
      };

      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockAccount, error: null })
      });

      const result = await getAvailableBalance(mockUserId);

      expect(result).toEqual({
        user_id: mockUserId,
        total_earned: 1000,
        total_withdrawn: 200,
        total_pending_withdrawals: 100,
        total_orders: 150,
        available_balance: 550
      });
    });

    it('should never return negative available balance', async () => {
      const mockAccount = {
        id: '1',
        user_id: mockUserId,
        total_earned: '100.00',
        total_withdrawn: '200.00',
        total_pending_withdrawals: '50.00',
        total_orders: '50.00',
        created_at: new Date(),
        updated_at: new Date()
      };

      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockAccount, error: null })
      });

      const result = await getAvailableBalance(mockUserId);

      expect(result.available_balance).toBe(0);
    });

    it('should throw error if account not found', async () => {
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null })
      });

      await expect(getAvailableBalance(mockUserId)).rejects.toThrow('No account found');
    });
  });

  describe('getAccount', () => {
    it('should return account with parsed numbers', async () => {
      const mockAccount = {
        id: '1',
        user_id: mockUserId,
        total_earned: '1000.50',
        total_withdrawn: '200.25',
        total_pending_withdrawals: '100.75',
        total_orders: '150.00',
        created_at: new Date(),
        updated_at: new Date()
      };

      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockAccount, error: null })
      });

      const result = await getAccount(mockUserId);

      expect(result.total_earned).toBe(1000.50);
      expect(result.total_withdrawn).toBe(200.25);
      expect(result.total_pending_withdrawals).toBe(100.75);
      expect(result.total_orders).toBe(150.00);
    });
  });
});
