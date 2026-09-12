import {
  getSpaceController,
  isSpaceAllowed,
  isSpaceController,
  NO_CONTROLLER,
  parseSpaceAllowlist
} from '../../../src/helpers/utils';

const CONTROLLER = '0x11dA6f0B92C4e8a37D50b1F9cA26e4B8d07bECdC';
const OTHER = '0x4421bE7a0C9d38f15B6a2E4c7D90a1F83b56448D';

describe('space allowlist', () => {
  const ORIGINAL = process.env.SPACE_ALLOWLIST;

  afterEach(() => {
    if (ORIGINAL === undefined) delete process.env.SPACE_ALLOWLIST;
    else process.env.SPACE_ALLOWLIST = ORIGINAL;
  });

  describe('parseSpaceAllowlist()', () => {
    it('parses space:address pairs and lowercases both sides', () => {
      const parsed = parseSpaceAllowlist(`NVDA:${CONTROLLER}, aapl:${OTHER}`);

      expect(parsed.get('nvda')).toBe(CONTROLLER.toLowerCase());
      expect(parsed.get('aapl')).toBe(OTHER.toLowerCase());
      expect(parsed.size).toBe(2);
    });

    it('drops entries whose address is not an evm address', () => {
      const parsed = parseSpaceAllowlist(`nvda:not-an-address,aapl:${OTHER}`);

      expect(parsed.has('nvda')).toBe(false);
      expect(parsed.size).toBe(1);
    });

    it('drops entries missing an address', () => {
      expect(parseSpaceAllowlist('nvda,aapl:').size).toBe(0);
    });

    it('returns an empty map for an empty allowlist', () => {
      expect(parseSpaceAllowlist('').size).toBe(0);
    });
  });

  describe('isSpaceAllowed()', () => {
    it('is true only for listed spaces, case-insensitively', () => {
      process.env.SPACE_ALLOWLIST = `nvda:${CONTROLLER}`;

      expect(isSpaceAllowed('nvda')).toBe(true);
      expect(isSpaceAllowed('NVDA')).toBe(true);
      expect(isSpaceAllowed('tsla')).toBe(false);
    });

    it('fails closed when the allowlist is unset', () => {
      delete process.env.SPACE_ALLOWLIST;

      expect(isSpaceAllowed('nvda')).toBe(false);
    });
  });

  describe('getSpaceController()', () => {
    it('resolves the allowlisted controller', async () => {
      process.env.SPACE_ALLOWLIST = `nvda:${CONTROLLER}`;

      await expect(getSpaceController('nvda')).resolves.toBe(CONTROLLER.toLowerCase());
    });

    it('resolves the zero address for an unlisted space', async () => {
      process.env.SPACE_ALLOWLIST = `nvda:${CONTROLLER}`;

      await expect(getSpaceController('tsla')).resolves.toBe(NO_CONTROLLER);
    });

    it('resolves the zero address when the allowlist is unset', async () => {
      delete process.env.SPACE_ALLOWLIST;

      await expect(getSpaceController('nvda')).resolves.toBe(NO_CONTROLLER);
    });
  });

  describe('isSpaceController()', () => {
    beforeEach(() => {
      process.env.SPACE_ALLOWLIST = `nvda:${CONTROLLER}`;
    });

    it('accepts the allowlisted controller regardless of address casing', async () => {
      const controller = await getSpaceController('nvda');

      expect(isSpaceController('nvda', CONTROLLER, controller)).toBe(true);
      expect(isSpaceController('nvda', CONTROLLER.toLowerCase(), controller)).toBe(true);
    });

    it('rejects a different signer for an allowlisted space', async () => {
      const controller = await getSpaceController('nvda');

      expect(isSpaceController('nvda', OTHER, controller)).toBe(false);
    });

    it('rejects an unlisted space even when handed a matching controller', () => {
      expect(isSpaceController('tsla', CONTROLLER, CONTROLLER.toLowerCase())).toBe(false);
    });

    it('rejects the zero address', () => {
      expect(isSpaceController('nvda', NO_CONTROLLER, NO_CONTROLLER)).toBe(false);
    });

    it('rejects every signer when the allowlist is unset', async () => {
      delete process.env.SPACE_ALLOWLIST;
      const controller = await getSpaceController('nvda');

      expect(isSpaceController('nvda', CONTROLLER, controller)).toBe(false);
    });
  });
});
