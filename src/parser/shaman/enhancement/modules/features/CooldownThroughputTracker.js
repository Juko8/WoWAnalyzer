import SPELLS from 'common/SPELLS';
import CoreCooldownThroughputTracker, { BUILT_IN_SUMMARY_TYPES } from 'parser/shared/modules/CooldownThroughputTracker';

class CooldownThroughputTracker extends CoreCooldownThroughputTracker {
  static cooldownSpells = [
    ...CoreCooldownThroughputTracker.cooldownSpells,
    {
      spell: SPELLS.ASCENDANCE_TALENT_ENHANCEMENT,
      summary: [
        BUILT_IN_SUMMARY_TYPES.DAMAGE,
      ],
    },
    {
      spell: SPELLS.ASTRAL_SHIFT,
      summary: [
        BUILT_IN_SUMMARY_TYPES.ABSORBED,
      ],
    },
    {
      spell: SPELLS.BERSERKING,
      summary: [
        BUILT_IN_SUMMARY_TYPES.DAMAGE,
      ],
    },
  ];

  trackEvent(event) {
    this.activeCooldowns.forEach((cooldown) => {
      if (event.ability.guid !== SPELLS.DOOM_VORTEX.id) {
        cooldown.events.push(event);
      }
    });
  }
}

export default CooldownThroughputTracker;
