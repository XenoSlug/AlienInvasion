/* Gameplay hotfix: reliable edge-triggered pause and repeatable enemy waves/boss phases. */
(function () {
  var pauseLatch = false;
  var originalLoop = Game.loop;
  var originalTextScreen = window.textScreen;

  function releasePause() {
    Game.keys.pause = false;
    Game.keys.fire = false;
    pauseLatch = false;
  }

  function showPause(board) {
    if (!board || Game.pausedBoard) return;
    Game.pausedBoard = board;
    try {
      var p = board.player;
      localStorage.setItem('alien-invasion-run', JSON.stringify({
        score: Game.points, combo: Game.combo, x: p.x, hp: p.hp,
        lives: p.lives, skills: p.skills, time: board.wave ? board.wave.t : 0
      }));
    } catch (e) {}
    Game.setBoard(1, null);
    releasePause();
    Game.setBoard(3, {
      step: function () {
        if (Game.keys.fire && !this.fireLatch) {
          this.fireLatch = true;
          Game.setBoard(1, Game.pausedBoard);
          Game.pausedBoard = null;
          releasePause();
        }
        if (!Game.keys.fire) this.fireLatch = false;
      },
      draw: function (c) {
        c.fillStyle = '#fff'; c.textAlign = 'center';
        c.font = 'bold 32px Arial'; c.fillText('PAUSED', 160, 190);
        c.font = '14px Arial'; c.fillText('Press fire / A to resume', 160, 225);
        c.textAlign = 'left';
      }
    });
  }

  /* Replace the old wrapper, which could leave the overlay and gameplay out of sync. */
  window.pauseRun = showPause;

  /* Pause is edge-triggered, so holding P, Escape, or controller Menu cannot loop. */
  Game.pauseHotfix = function () {
    var board = Game.boards && Game.boards[1];
    if (!board || Game.pausedBoard) return;
    if (Game.keys.pause && !pauseLatch) {
      pauseLatch = true;
      showPause(board);
    }
    if (!Game.keys.pause) pauseLatch = false;
  };
  var loop = Game.loop;
  Game.loop = function () {
    Game.pauseHotfix();
    loop.call(Game);
  };

  /* A run now continues through escalating waves after every boss. */
  window.Wave = function (startTime) {
    this.t = startTime || 0;
    this.wave = 1;
    this.spawnedBoss = false;
    this.spawned = 0;
    this.nextWaveAt = 0;
    this.step = function (dt) {
      this.t += dt;
      var board = this.board;
      var enemiesAlive = board.objects.some(function (o) { return o.type === 'enemy'; });
      var bossAlive = board.objects.some(function (o) { return o.type === 'boss'; });
      if (!this.spawnedBoss && this.t >= 25 + (this.wave - 1) * 8 && !enemiesAlive) {
        board.add(new Enemy(100, true, this.wave));
        this.spawnedBoss = true;
        return;
      }
      if (this.spawnedBoss && !bossAlive && !enemiesAlive) {
        this.wave++;
        this.spawnedBoss = false;
        this.t = 18;
        this.spawned = 0;
        Game.points += 1000 * this.wave;
        return;
      }
      if (!this.spawnedBoss && this.t > 1 && this.spawned < 5 + this.wave * 2 && Math.random() < dt * (1.1 + this.wave * .12)) {
        board.add(new Enemy(Math.random() * 280, false, this.wave));
        this.spawned++;
      }
      if (Game.keys.pause && !Game.pausedBoard) showPause(board);
    };
    this.draw = function () {};
  };

  /* Distinct enemy archetypes and a harder multi-phase boss. */
  window.Enemy = function (x, boss, wave) {
    this.type = boss ? 'boss' : 'enemy';
    this.boss = !!boss; this.wave = wave || 1; this.t = 0;
    this.variant = boss ? 'boss' : ['scout', 'zigzag', 'tank'][Math.floor(Math.random() * 3)];
    this.x = x; this.y = boss ? 30 : -35;
    this.w = boss ? 130 : (this.variant === 'tank' ? 46 : 34);
    this.h = boss ? 58 : (this.variant === 'tank' ? 42 : 32);
    this.maxHp = boss ? 500 + this.wave * 180 : (this.variant === 'tank' ? 45 : 12 + this.wave * 3);
    this.hp = this.maxHp; this.value = boss ? 5000 * this.wave : 100 * this.wave;
    this.reload = .8;
    this.step = function (dt) {
      this.t += dt;
      var phase = this.hp < this.maxHp * .5;
      if (!this.boss) {
        this.y += (this.variant === 'tank' ? 38 : 62 + this.wave * 3) * dt;
        this.x += (this.variant === 'zigzag' ? Math.sin(this.t * 5) * 95 : Math.sin(this.t * 2) * 25) * dt;
      } else {
        this.x = 95 + Math.sin(this.t * (phase ? 1.6 : .8)) * (phase ? 90 : 65);
      }
      this.reload -= dt;
      if (this.reload <= 0) {
        this.reload = this.boss ? (phase ? .28 : .62) : (this.variant === 'tank' ? 1.1 : 1.7);
        this.board.add(new Shot(this.x + this.w / 2, this.y + this.h));
        if (this.boss && phase) {
          this.board.add(new Shot(this.x + 15, this.y + this.h));
          this.board.add(new Shot(this.x + this.w - 15, this.y + this.h));
        }
      }
      var player = this.board.hit(this, 'player');
      if (player) { player.damage(); this.dead = true; }
      if (this.y > 500) this.dead = true;
    };
    this.draw = function (c) {
      c.fillStyle = this.boss ? '#d32f4f' : (this.variant === 'tank' ? '#e08a32' : this.variant === 'zigzag' ? '#45d6a5' : '#a65cff');
      c.fillRect(this.x, this.y, this.w, this.h);
      if (this.boss) {
        c.fillStyle = '#ff8a9a'; c.fillRect(35, 10, 250 * Math.max(0, this.hp / this.maxHp), 8);
        c.fillStyle = '#fff'; c.font = '11px Arial'; c.fillText('BOSS PHASE ' + (this.hp < this.maxHp * .5 ? '2' : '1'), 122, 30);
      }
    };
  };
}());
