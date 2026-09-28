import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
  getLogoPublicUrl: vi.fn(),
}));

import { supabase } from '../lib/supabase';
import { submitRequest } from './api';

describe('submitRequest', () => {
  beforeEach(() => {
    vi.mocked(supabase.from).mockReset();
  });

  it('turns a unique-violation into the queue message', async () => {
    const single = vi.fn().mockResolvedValue({
      data: null,
      error: { code: '23505', message: 'duplicate key value' },
    });
    vi.mocked(supabase.from).mockReturnValue({
      insert: () => ({
        select: () => ({
          single,
        }),
      }),
    } as never);

    await expect(submitRequest('lib-1', ' Blue Monday ', ' New Order ', 'playable')).rejects.toThrow(
      'Dit nummer staat al in de wachtrij.'
    );
  });
});
