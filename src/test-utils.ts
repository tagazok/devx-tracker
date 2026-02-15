import { createApp, defineComponent } from 'vue';

/**
 * Runs a composable inside a real Vue app context so that
 * lifecycle hooks like onMounted fire correctly.
 * Returns the app instance for cleanup (call app.unmount()).
 */
export function withSetup(composableFn: () => void) {
  const Comp = defineComponent({
    setup() {
      composableFn();
      return () => null;
    },
  });

  const el = document.createElement('div');
  const app = createApp(Comp);
  app.mount(el);
  return app;
}
