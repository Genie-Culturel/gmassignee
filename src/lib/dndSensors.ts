import { PointerSensor } from '@dnd-kit/core';

/**
 * PointerSensor that ignores touch so TouchSensor can apply the 200 ms press delay.
 * (Plain PointerSensor would steal touch and break scrolling.)
 */
export class FinePointerSensor extends PointerSensor {
  static activators = PointerSensor.activators.map((activator) => ({
    ...activator,
    handler: (
      event: Parameters<(typeof PointerSensor.activators)[0]['handler']>[0],
      options: Parameters<(typeof PointerSensor.activators)[0]['handler']>[1]
    ) => {
      if (event.nativeEvent.pointerType === 'touch') return false;
      return activator.handler(event, options);
    },
  }));
}
