(function () {
  var last = 0;
  window.requestAnimationFrame = window.requestAnimationFrame || function (cb) {
    var now = Date.now(), delay = Math.max(0, 16 - (now - last));
    var id = setTimeout(function () { cb(now + delay); }, delay); last = now + delay; return id;
  };
}());

var Game = new function () {
  var boards = [], lastTime = Date.now();
  this.width = 320; this.height = 480; this.playerOffset = 30; this.keys = {};
  this.initialize = function (id, spriteData, callback) {
    this.canvas = document.getElementById(id); this.ctx = this.canvas.getContext('2d');
    this.setupInput(); this.resize(); window.addEventListener('resize', this.resize.bind(this));
    window.addEventListener('orientationchange', this.resize.bind(this));
    this.loop(); SpriteSheet.load(spriteData, callback);
  };
  this.resize = function () {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = this.width * dpr; this.canvas.height = this.height * dpr;
    this.canvas.style.aspectRatio = this.width + '/' + this.height;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  this.setupInput = function () {
    var map = { ArrowLeft:'left', ArrowRight:'right', a:'left', d:'right', ' ':'fire', Enter:'fire', Escape:'pause', p:'pause' };
    window.addEventListener('keydown', function (e) { var k = map[e.key]; if (k) { Game.keys[k] = true; e.preventDefault(); } });
    window.addEventListener('keyup', function (e) { var k = map[e.key]; if (k) Game.keys[k] = false; });
    window.addEventListener('blur', function () { Game.keys = {}; });
  };
  this.pollGamepad = function () {
    var pads = navigator.getGamepads ? navigator.getGamepads() : [], p = pads[0];
    if (!p) return;
    this.controllerName = p.id;
    this.keys.left = p.axes[0] < -0.2 || !!(p.buttons[14] && p.buttons[14].pressed);
    this.keys.right = p.axes[0] > 0.2 || !!(p.buttons[15] && p.buttons[15].pressed);
    this.keys.fire = !!((p.buttons[0] && p.buttons[0].pressed) || (p.buttons[7] && p.buttons[7].pressed));
    this.keys.pause = !!(p.buttons[9] && p.buttons[9].pressed);
    this.glyph = p.mapping === 'standard' ? 'A' : 'FIRE';
  };
  this.loop = function () {
    requestAnimationFrame(Game.loop); Game.pollGamepad();
    var now = Date.now(), dt = Math.min((now - lastTime) / 1000, 1 / 30); lastTime = now;
    for (var i = 0; i < boards.length; i++) if (boards[i]) { boards[i].step(dt); boards[i].draw(this.ctx); }
  };
  this.setBoard = function (n, board) { boards[n] = board; };
  this.getBoard = function (n) { return boards[n]; };
};

var SpriteSheet = new function () {
  this.map = {};
  this.load = function (data, cb) { this.map = data; this.image = new Image(); this.image.onload = cb; this.image.src = 'images/sprites.png'; };
  this.draw = function (ctx, name, x, y, frame) { var s = this.map[name]; if (!s || !this.image.complete) return; ctx.drawImage(this.image, s.sx + (frame || 0) * s.w, s.sy, s.w, s.h, Math.floor(x), Math.floor(y), s.w, s.h); };
};
var Sprite = function () {};
Sprite.prototype.setup = function (sprite, props) { this.sprite = sprite; this.merge(props); this.frame = this.frame || 0; var s = SpriteSheet.map[sprite]; this.w = s.w; this.h = s.h; };
Sprite.prototype.merge = function (p) { for (var k in (p || {})) this[k] = p[k]; };
Sprite.prototype.draw = function (ctx) { SpriteSheet.draw(ctx, this.sprite, this.x, this.y, this.frame); };
var GameBoard = function () { this.objects = []; this.cnt = {}; this.removed = []; };
GameBoard.prototype.add = function (o) { o.board = this; this.objects.push(o); this.cnt[o.type] = (this.cnt[o.type] || 0) + 1; return o; };
GameBoard.prototype.remove = function (o) { if (this.removed.indexOf(o) < 0) { this.removed.push(o); return true; } return false; };
GameBoard.prototype.step = function (dt) { this.removed = []; for (var i = 0; i < this.objects.length; i++) this.objects[i].step(dt); for (i = 0; i < this.removed.length; i++) { var n = this.objects.indexOf(this.removed[i]); if (n >= 0) { this.cnt[this.removed[i].type]--; this.objects.splice(n, 1); } } };
GameBoard.prototype.draw = function (ctx) { for (var i = 0; i < this.objects.length; i++) this.objects[i].draw(ctx); };
GameBoard.prototype.overlap = function (a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; };
GameBoard.prototype.collide = function (o, type) { for (var i = 0; i < this.objects.length; i++) if (o !== this.objects[i] && (!type || this.objects[i].type & type) && this.overlap(o, this.objects[i])) return this.objects[i]; return false; };
var Starfield = function (speed, alpha, count, clear) { var c = document.createElement('canvas'); c.width = Game.width; c.height = Game.height; var x = c.getContext('2d'); if (clear) { x.fillStyle = '#03050d'; x.fillRect(0, 0, c.width, c.height); } x.fillStyle = '#fff'; x.globalAlpha = alpha; for (var i = 0; i < count; i++) x.fillRect(Math.random() * c.width, Math.random() * c.height, 2, 2); var off = 0; this.step = function (dt) { off = (off + speed * dt) % c.height; }; this.draw = function (ctx) { ctx.drawImage(c, 0, off, c.width, c.height - off, 0, 0, c.width, c.height - off); ctx.drawImage(c, 0, 0, c.width, off, 0, c.height - off, c.width, off); }; };
var TouchControls = function () { this.draw = function (ctx) { var y = Game.height - 54; ctx.save(); ctx.globalAlpha = .58; ctx.fillStyle = '#213a61'; ctx.fillRect(8, y, 48, 44); ctx.fillRect(62, y, 48, 44); ctx.fillRect(Game.width - 62, y, 54, 44); ctx.globalAlpha = 1; ctx.fillStyle = '#b8edff'; ctx.font = 'bold 25px Arial'; ctx.fillText('◀', 21, y + 31); ctx.fillText('▶', 75, y + 31); ctx.fillText(Game.glyph || 'A', Game.width - 52, y + 29); ctx.restore(); }; this.step = function () {}; };
var GamePoints = function () { this.step = function () {}; this.draw = function (ctx) { ctx.fillStyle = '#fff'; ctx.font = 'bold 15px Arial'; ctx.fillText('SCORE ' + String(Game.points || 0).padStart(7, '0'), 8, 20); ctx.fillText('x' + (Game.combo || 1), 240, 20); }; };
