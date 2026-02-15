import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, nextTick } from 'vue';
import { flushPromises } from '@vue/test-utils';
import { useTickets } from './useTickets';
import { withSetup } from '../test-utils';

const mockTickets = [
  {
    title: 'Test Ticket',
    id: 'ticket-1',
    aliases: [{ precedence: '1', id: 'D123456' }],
    labels: ['CFP_Submitted: Yes', 'GEO: EMEA'],
    customFields: {
      string: [{ id: 'city', value: 'Berlin' }],
      date: [{ id: 'date', value: '2025-01-15' }],
      boolean: [],
      number: [],
    },
    extensions: { tt: { status: 'Assigned' } },
  },
];

function mockFetchSuccess() {
  return vi.fn((url: string) => {
    if (url === '/tickets_all.json') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockTickets),
      });
    }
    return Promise.resolve({ ok: false });
  });
}

/**
 * Helper to run the composable inside a Vue app context
 * so that onMounted fires properly.
 */
function setupUseTickets(tab = 'all') {
  const activeTab = ref(tab);
  let result!: ReturnType<typeof useTickets>;

  const app = withSetup(() => {
    result = useTickets(activeTab);
  });

  return { result, activeTab, app };
}

describe('useTickets', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('loads tickets successfully', async () => {
    globalThis.fetch = mockFetchSuccess() as any;

    const { result, app } = setupUseTickets();

    expect(result.loading.value).toBe(true);

    await flushPromises();

    expect(result.loading.value).toBe(false);
    expect(result.error.value).toBeNull();
    expect(result.tickets.value).toEqual(mockTickets);

    app.unmount();
  });

  it('sets error when tickets.json fails to load', async () => {
    globalThis.fetch = vi.fn((url: string) => {
      if (url === '/tickets_all.json') {
        return Promise.resolve({ ok: false });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    }) as any;

    const { result, app } = setupUseTickets();
    await flushPromises();

    expect(result.error.value).toBe('Failed to load tickets.json');
    expect(result.tickets.value).toEqual([]);
    expect(result.loading.value).toBe(false);

    app.unmount();
  });

  it('computes filteredTickets reactively based on activeTab', async () => {
    globalThis.fetch = mockFetchSuccess() as any;

    const { result, activeTab, app } = setupUseTickets('all');
    await flushPromises();

    // "all" tab returns all tickets
    expect(result.filteredTickets.value).toEqual(mockTickets);

    // Switch to "conferences" — ticket has CFP_Submitted label
    activeTab.value = 'conferences';
    await nextTick();
    expect(result.filteredTickets.value).toEqual(mockTickets);

    // Switch to "students" — ticket does not have Students label
    activeTab.value = 'students';
    await nextTick();
    expect(result.filteredTickets.value).toEqual([]);

    app.unmount();
  });

  it('sets error when tickets.json fetch throws a network error', async () => {
    globalThis.fetch = vi.fn(() => Promise.reject(new Error('Network error'))) as any;

    const { result, app } = setupUseTickets();
    await flushPromises();

    expect(result.error.value).toBe('Failed to load tickets.json');
    expect(result.tickets.value).toEqual([]);
    expect(result.loading.value).toBe(false);

    app.unmount();
  });
});
