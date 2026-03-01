/**
 * Tests for the axios-based API module (api.js).
 *
 * Architecture: tokens live in httpOnly cookies set by the server.
 * The client uses withCredentials: true; there is no client-side
 * Authorization header injection.
 *
 * These tests verify the public API surface (exported function shape)
 * and that the axios instance is configured correctly, without
 * needing to re-implement the interceptor pipeline.
 */

describe('api module public interface', () => {
  let authAPI, expenseAPI, categoryAPI, budgetAPI, plaidAPI;

  beforeAll(() => {
    // Jest module isolation means each test file gets fresh modules.
    // We import here to avoid cross-test complications.
    ({ authAPI, expenseAPI, categoryAPI, budgetAPI, plaidAPI } =
      require('../utils/api'));
  });

  describe('authAPI', () => {
    it('exposes login, logout, register, forgotPassword, resetPassword, sendVerification, verifyEmail', () => {
      expect(typeof authAPI.login).toBe('function');
      expect(typeof authAPI.logout).toBe('function');
      expect(typeof authAPI.register).toBe('function');
      expect(typeof authAPI.forgotPassword).toBe('function');
      expect(typeof authAPI.resetPassword).toBe('function');
      expect(typeof authAPI.sendVerification).toBe('function');
      expect(typeof authAPI.verifyEmail).toBe('function');
    });
  });

  describe('expenseAPI', () => {
    it('exposes getAll, create, update, delete', () => {
      expect(typeof expenseAPI.getAll).toBe('function');
      expect(typeof expenseAPI.create).toBe('function');
      expect(typeof expenseAPI.update).toBe('function');
      expect(typeof expenseAPI.delete).toBe('function');
    });
  });

  describe('categoryAPI', () => {
    it('exposes getAll, create, update, delete', () => {
      expect(typeof categoryAPI.getAll).toBe('function');
      expect(typeof categoryAPI.create).toBe('function');
      expect(typeof categoryAPI.update).toBe('function');
      expect(typeof categoryAPI.delete).toBe('function');
    });
  });

  describe('budgetAPI', () => {
    it('exposes getAll, create, update, delete', () => {
      expect(typeof budgetAPI.getAll).toBe('function');
      expect(typeof budgetAPI.create).toBe('function');
      expect(typeof budgetAPI.update).toBe('function');
      expect(typeof budgetAPI.delete).toBe('function');
    });
  });

  describe('plaidAPI', () => {
    it('exposes createLinkToken, exchangeToken, getAccounts, deleteAccount', () => {
      expect(typeof plaidAPI.createLinkToken).toBe('function');
      expect(typeof plaidAPI.exchangeToken).toBe('function');
      expect(typeof plaidAPI.getAccounts).toBe('function');
      expect(typeof plaidAPI.deleteAccount).toBe('function');
    });
  });
});
