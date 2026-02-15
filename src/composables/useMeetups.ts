import { ref, onMounted, type Ref } from 'vue';
import type { RawMeetupGroup } from '../types/meetup';

export function useMeetups(): {
  meetups: Ref<RawMeetupGroup[]>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
} {
  const meetups = ref<RawMeetupGroup[]>([]);
  const loading = ref(true);
  const error = ref<string | null>(null);

  onMounted(async () => {
    try {
      const response = await fetch('/meetups.json');
      if (!response.ok) {
        throw new Error('meetups.json');
      }
      meetups.value = await response.json();
    } catch (e) {
      error.value = 'Failed to load meetups.json';
    }

    loading.value = false;
  });

  return { meetups, loading, error };
}
