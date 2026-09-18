/* Pause/resume integration: freeze the gameplay board while the pause screen is visible. */
(function () {
  var originalPauseRun = window.pauseRun;
  window.pauseRun = function (board) {
    var player = board && board.player;
    if (!player) return;

    try {
      localStorage.setItem('alien-invasion-run', JSON.stringify({
        score: Game.points,
        combo: Game.combo,
        x: player.x,
        hp: player.hp,
        lives: player.lives,
        skills: player.skills,
        time: board.wave ? board.wave.t : 0
      }));
    } catch (e) {}

    /* Keep the board in memory, but remove it from the update/draw list. */
    Game.pausedBoard = board;
    Game.setBoard(1, null);
    Game.keys.pause = false;
    Game.keys.fire = false;

    textScreen('PAUSED', 'Run saved - press fire to resume', function () {
      Game.setBoard(1, Game.pausedBoard);
      Game.pausedBoard = null;
      Game.keys.fire = false;
    });
  };
}());
