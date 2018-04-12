'use strict';

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  plus(vector) {
    if (vector instanceof Vector) {
      return new Vector(this.x + vector.x, this.y + vector.y);
    } else {
      throw new Error('Можно прибавлять к вектору только вектор типа Vector');
    }
  }

  times(multiplier) {
    return new Vector(this.x * multiplier, this.y * multiplier);
  }
}

class Actor {
  constructor(pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {
    if (pos instanceof Vector && size instanceof Vector && speed instanceof Vector) {
      this.pos = pos;
      this.size = size;
      this.speed = speed;
    } else {
      throw new Error('Все аргументы конструктора должны быть типа Vector');
    }
  }

  get type() {
    return 'actor';
  }

  get left() {
    return Math.min(this.pos.x, this.pos.x + this.size.x);
  }

  get right() {
    return Math.max(this.pos.x, this.pos.x + this.size.x);
  }

  get top() {
    return Math.min(this.pos.y, this.pos.y + this.size.y);
  }

  get bottom() {
    return Math.max(this.pos.y, this.pos.y + this.size.y);
  }


  act() {
    //
  }

  isIntersect(actor) {
      if (typeof actor !=='undefined' && actor instanceof Actor) {
        
        if (actor === this) return false;

        return (this.left < actor.right && this.left >= actor.left && 
            this.top < actor.bottom && this.top >= actor.top) || 
          (this.right < actor.right && this.right > actor.left && 
            this.top < actor.bottom && this.top >= actor.top) || 
          (this.left < actor.right && this.left >= actor.left && 
            this.bottom <= actor.bottom && this.bottom > actor.top) || 
          (this.right <= actor.right && this.right > actor.left  && 
            this.bottom <= actor.bottom && this.bottom > actor.top) || 
          (this.right >= actor.right && this.left <= actor.left && 
            this.bottom >= actor.bottom && this.top <= actor.top)
        ;
      } else {
        throw new Error('Аргумент метода isIntersect должен быть типа Actor');
      }
  }

}

class Level {
  constructor(grid = [], actors = []) {

    // Passed properties
    this.grid = grid;
    this.actors = actors;

    // Calculated properties
    this.player = this.actors.find(actor => (actor.type === 'player'));
    this.height = this.grid.length;
    this.width = this.grid.length ? Math.max(...this.grid.map(row => row.length)) : 0;
    this.status = null;
    this.finishDelay = 1;
  }

  isFinished() {
    return (this.status !== null) && (this.finishDelay < 0);
  }

  actorAt(actor) {
      if (typeof actor !=='undefined' && actor instanceof Actor) {
        return this.actors.find(a => (a.isIntersect(actor)));
      } else {
        throw new Error('Аргумент метода actorAt должен быть типа Actor');
      }
  }  

  obstacleAt(pos, size) {
    if (pos instanceof Vector && size instanceof Vector) {

      if (pos.y + size.y >= this.height)
        return 'lava';
      
      if (pos.x < 0 || // Wall is to the left
        pos.x + size.x >= this.width ||  // Wall is to the right
        pos.y < 0) // Wall is above
      return 'wall';

      // Wall is inside
      for(let y = Math.trunc(pos.y); y <=  Math.trunc(pos.y + size.y - 0.000001); y++)
        for(let x = Math.trunc(pos.x); x <=  Math.trunc(pos.x + size.x - 0.000001); x++) {
          if (this.grid[y][x] === 'wall') return 'wall';
          if (this.grid[y][x] === 'lava') return 'lava';
        }

    } else {
      throw new Error('Аргументы метода obstacleAt должны быть типа Vector');
    }
  }

  removeActor(actor) {
    let actorIndex = this.actors.indexOf(actor);

    if (actorIndex !== -1) {
      this.actors.splice(actorIndex, 1);
    }
  }

  noMoreActors(type) {
    return this.actors.length === 0 || 
      this.actors.filter(a => a.type === type).length === 0;
  }

  playerTouched(type, actor = null) {
    if (!this.status) {
      if (type === 'lava' || type === 'fireball') {
        this.status = 'lost';
      }
      if (type === 'coin') {
        this.removeActor(actor);

        if (this.noMoreActors('coin')) {
          this.status = 'won';
        }
      }
    }
  }
}


class LevelParser {
  constructor(actors) {
    this.actors = actors;
  }

  actorFromSymbol(symbol) {
    if (typeof symbol !== 'undefined') return this.actors[symbol];
  }

  obstacleFromSymbol(symbol) {
    if (symbol === 'x') return 'wall';
    if (symbol === '!') return 'lava';
  }

  createGrid(plan) {
    let obstacles = {
      'x': 'wall',
      '!': 'lava'
    };

    return plan.map(row => (
      row.split('').map(symbol => obstacles[symbol])
    ));
  }

  createActors(plan) {
    let actors = [];

    if (this.actors) {
      plan.forEach((row, rowIndex) => {
        row.split('').forEach((el, elIndex) =>{
          if (typeof this.actors[el] === 'function') {
            let newActor = new this.actors[el](new Vector(elIndex, rowIndex));

            if (newActor instanceof Actor)
              actors.push(newActor);
          }
        });
      });
    };

    return actors;
  }

  parse(plan) {
    return new Level(this.createGrid(plan), this.createActors(plan));
  }
}


class Fireball extends Actor {
  constructor(pos = new Vector(0, 0), speed = new Vector(0, 0)) {
    super();

    this.pos = pos;
    this.speed = speed;

    this.size = new Vector(1, 1);
  }

  get type() {
    return 'fireball';
  }

  getNextPosition(time = 1) {
    return this.pos.plus(this.speed.times(time));
  }  

  handleObstacle() {
    this.speed = this.speed.times(-1);
  }

  act(time, level) {
    let nextPos = this.getNextPosition(time);

    if (typeof level.obstacleAt(nextPos, this.size) === 'undefined') {
      this.pos = nextPos;
    } else {
      this.handleObstacle();
    }
  }
}


class HorizontalFireball extends Fireball {
  constructor(pos) {
    super(pos, new Vector(2, 0));
  }
}


class VerticalFireball extends Fireball {
  constructor(pos) {
    super(pos, new Vector(0, 2));
  }
}

class FireRain extends Fireball {
  constructor(pos) {
    super(pos, new Vector(0, 3));

    this.startPos = pos;  
  }

  handleObstacle() {
    this.pos = this.startPos;
  }
}

class Coin extends Actor {
  constructor(pos = new Vector(0, 0)) {
    super(pos);
    this.pos = this.pos.plus(new Vector(0.2, 0.1));
    this.size = new Vector(0.6, 0.6);
 
    this.springSpeed = 8;
    this.springDist = 0.07;
    this.spring = Math.random() * 2 * Math.PI;
    this.startPos = this.pos;
  }

  get type() {
    return 'coin';
  }

  updateSpring(time = 1) {
    this.spring += this.springSpeed * time;
  }

  getSpringVector() {
    return new Vector(0, Math.sin(this.spring) * this.springDist);
  }

  getNextPosition(time = 1) {
    this.updateSpring(time);
    return this.startPos.plus(this.getSpringVector());
  }

  act(time) {
    this.pos = this.getNextPosition(time);
  }
}

class Player extends Actor {
  constructor(pos = new Vector(0, 0)) {
    super(pos);
    this.pos = this.pos.plus(new Vector(0, -0.5));
    this.size = new Vector(0.8, 1.5);
    this.speed = new Vector(0, 0);
  }

  get type() {
    return 'player';
  }
}