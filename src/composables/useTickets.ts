import { ref, computed, onMounted, type Ref, type ComputedRef } from 'vue';
import type { Ticket } from '../types/ticket';
import { filterByTab } from '../utils/ticketFilters';

export function useTickets(activeTab: Ref<string>): {
  tickets: Ref<Ticket[]>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  filteredTickets: ComputedRef<Ticket[]>;
} {
  const tickets = ref<Ticket[]>([]);
  const loading = ref(true);
  const error = ref<string | null>(null);

  const filteredTickets = computed(() =>
    filterByTab(tickets.value, activeTab.value)
  );

  onMounted(async () => {
    try {
      const ticketsResponse = await fetch('/tickets_all.json');
      if (!ticketsResponse.ok) {
        throw new Error('tickets.json');
      }
      tickets.value = await ticketsResponse.json();
    } catch (e) {
      error.value = 'Failed to load tickets.json';
    }

    loading.value = false;
  });

  return { tickets, loading, error, filteredTickets };
}
