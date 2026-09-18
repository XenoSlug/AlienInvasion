# Alien Invasion — clean rewrite

Play: https://xenoslug.github.io/AlienInvasion/

This branch replaces the accumulated legacy runtime with a small dependency-free canvas game.

- Responsive 480×720 logical canvas
- Keyboard, touch, and Gamepad API controls with fallback glyphs
- Explicit menu, play, pause, skills, upgrade, and game-over states
- Pause freezes all gameplay and resumes with Fire/A
- Escalating enemy waves and repeatable two-phase bosses
- Scout, zigzag, and tank enemies
- Lives, health, shields, health/weapon/rapid-fire powerups
- Persistent credits and permanent max-health upgrades
- In-run rapid-fire skill purchased with score

Controls: arrows or A/D move; Space/Enter/controller A fires; P/Escape pauses; K/controller X opens run skills; U/controller Y opens the upgrade bay on the main menu.
