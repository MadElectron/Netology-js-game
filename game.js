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
    if ((pos instanceof Vector) && (size instanceof Vector) && (speed instanceof Vector)) {
      // writable properties
      this.pos = pos;
      this.size = size;
      this.speed = speed;

      // readonly properties
      Object.defineProperty(this, 'left', {value: this.pos.x});
      Object.defineProperty(this, 'top', {value: this.pos.y});
      Object.defineProperty(this, 'right', {value: this.pos.x + this.size.x});
      Object.defineProperty(this, 'bottom', {value: this.pos.y + this.size.y});              
      Object.defineProperty(this, 'type', {value: 'actor', configurable: true});   

    } else {
      throw new Error('Все аргументы конструктора должны быть типа Vector');
    }
  }

  act() {
    //
  }

  isIntersect(actor) {
      if((typeof actor !=='undefined') && (actor instanceof Actor)) {
        
        if (actor === this) 
          return false;

        return ((this.left < actor.right) && (this.left >= actor.left) 
            && (this.top < actor.bottom) && (this.top >= actor.top))
        || ((this.right < actor.right) && (this.right > actor.left) 
            && (this.top < actor.bottom) && (this.top >=actor.top))
        || ((this.left < actor.right) && (this.left >= actor.left) 
            && (this.bottom <= actor.bottom) && (this.bottom > actor.top))
        || ((this.right <= actor.right) && (this.right > actor.left) 
            && (this.bottom <= actor.bottom) && (this.bottom > actor.top))
        || ((this.right >= actor.right) && (this.left <= actor.left) 
            && (this.bottom >= actor.bottom) && (this.top <= actor.top))
        // && ((actor.size.x > 0) && (actor.size.y > 0))
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
    // for(let [index, actor] in this.actors) console.log(actor);
    this.player = this.actors.find(actor => (actor.type === 'player')); // ???
    this.height = this.grid.length;
    this.width = this.grid.length ? Math.max(...this.grid.map(row => row.length)) : 0;
    this.status = null;
    this.finishDelay = 1;
  }

  isFinished() {
    return (this.status !== null) && (this.finishDelay < 0);
  }

  actorAt(actor) {
      if((typeof actor !=='undefined') && (actor instanceof Actor)) {
        return this.actors.find(a => (a.isIntersect(actor)));
      } else {
        throw new Error('Аргумент метода actorAt должен быть типа Actor');
      }
  }  

  obstacleAt(pos, size) {
    if((pos instanceof Vector) && (size instanceof Vector)) {
      
      if ((pos.x < 0) || (pos.x + size.x >= this.width)  || (pos.y < 0))
        return 'wall';

      if (pos.y + size.y >= this.height)
        return 'lava';



    } else {
      throw new Error('Аргументы метода obstacleAt должны быть типа Vector');
    }
  }

  removeActor(actor) {
    let actorIndex = this.actors.indexOf(actor);

    if(actorIndex !== -1)
      this.actors.splice(actorIndex, 1);
  }

  noMoreActors(type) {
    return this.actors.length === 0 || this.actors.filter(a => a.type === type).length !== 0;
  }

  playerTouched(type, actor = null) {
    if (!this.status) {
      if ((type === 'lava') || type === 'fireball')
        this.status = 'lost';
      if (type === 'coin') {

        this.removeActor(actor);

        if (this.noMoreActors('coin'))
          this.status = 'won';
      }
    }
  }
}


class LevelParser {
  constructor(actors) {
    this.actors = actors;
  }

  actorFromSymbol(symbol) {
    if (typeof symbol !== 'undefined')
      return this.actors[symbol];
  }

  obstacleFromSymbol(symbol) {
    if (symbol === 'x')
      return 'wall';
    if (symbol === '!')
      return 'lava';
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
            let newActor = new this.actors[el]( new Vector(elIndex, rowIndex));

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

    Object.defineProperty(this, 'type', {value: 'fireball'});
    this.size = new Vector(1, 1);
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
 
    Object.defineProperty(this, 'type', {value: 'coin'});
    this.springSpeed = 8;
    this.springDist = 0.07;
    this.spring = Math.random() * 2 * Math.PI;
    this.startPos = this.pos;
  }

  updateSpring(time = 1) {
    this.spring += this.springSpeed * time;
  }

  getSpringVector() {
    return new Vector(0, Math.sin(this.spring) * this.springDist);
  }

  getNextPosition(time = 1) {
    console.log(this.spring);
    this.updateSpring(time);
    console.log(this.spring);

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

    Object.defineProperty(this, 'type', {value: 'player'});    
  }
}


const grid = [
  [undefined, undefined],
  ['wall', 'wall']
];

const player = new Player();
const fireball = new Fireball();
const coin = new Coin();

const level = new Level(grid, [ coin, player, fireball ]);
console.log(level.player === player);

// console.log(level.noMoreActors('player'));
// console.log(level.noMoreActors('qwerty'));

/* ==== Testing Coin class ==== */
// const position = new Vector(5, 5);
// const coin = new Coin(position);
// console.log(coin.getNextPosition());
// console.log(coin.pos);
// console.log(position.plus(new Vector(0.2, 0.1)));

/* ==== Testing Fireball class ==== */
// const time = 5;
// const speed = new Vector(1, 0);
// const position = new Vector(5, 5);

// const ball = new Fireball(position, speed);
// const level = new Level([
//  '                ',
//  '                ',
//  '                ',
//  '                ',
//  '                ',
//  '                ',
//  '                ',
// ]);
// ball.act(1, level);
// console.log(ball.pos);


/* ==== Testing LevelParser class ==== */
// const plan = [
//   ' @ ',
//   'x!x'
// ];

// const actorsDict = Object.create(null);
// actorsDict['@'] = Actor;

// const parser = new LevelParser(actorsDict);
// const level = parser.parse(plan);

// level.grid.forEach((line, y) => {
//   line.forEach((cell, x) => console.log(`(${x}:${y}) ${cell}`));
// });

// level.actors.forEach(actor => console.log(`(${actor.pos.x}:${actor.pos.y}) ${actor.type}`));


/* ==== Testing Vector class ==== */
// const start = new Vector(30, 50);
// const moveTo = new Vector(5, 10);

// const finish = start.plus(moveTo.times(2));

// const finish = start.plus(123);
// console.log(`Исходное расположение: ${start.x}:${start.y}`);
// console.log(`Текущее расположение: ${finish.x}:${finish.y}`);


/* ==== Testing Actor class ==== */
// console.log('========');

// const items = new Map();
// const player = new Actor();
// items.set('Игрок', player);
// items.set('Первая монета', new Actor(new Vector(10, 10)));
// items.set('Вторая монета', new Actor(new Vector(15, 5)));


// function position(item) {
//   return ['left', 'top', 'right', 'bottom']
//     .map(side => `${side}: ${item[side]}`)
//     .join(', ');  
// }

// function movePlayer(x, y) {
//   player.pos = player.pos.plus(new Vector(x, y));
// }

// function status(item, title) {
//   console.log(`${title}: ${position(item)}`);
//   if (player.isIntersect(item)) {
//     console.log(`Игрок подобрал ${title}`);
//   }
// }

// items.forEach(status);
// movePlayer(10, 10);
// items.forEach(status);
// movePlayer(5, -5);
// items.forEach(status);


// let first = new Actor(new Vector(0, 0), new Vector(2, 2));
// let second = new Actor(new Vector(0, 0), new Vector(1, 1));

// console.log('Первый', position(first));
// console.log('Второй', position(second));
// console.log(first.isIntersect(second));


/* ==== Testing Level class ==== */
// console.log('========');

// const grid = [
//   [undefined, undefined],
//   ['wall', 'wall']
// ];

// function MyCoin(title) {
//   this.type = 'coin';
//   this.title = title;
// }
// MyCoin.prototype = Object.create(Actor);
// MyCoin.constructor = MyCoin;

// class MyCoin extends Actor {
//   constructor(title) {
//     super();

//     this.type = 'coin';
//     this.title = title;
//   }
// }



// const goldCoin = new MyCoin('Золото');
// const bronzeCoin = new MyCoin('Бронза');
// const player = new Actor();
// const fireball = new Actor();

// // console.log(goldCoin);

// const level = new Level(grid, [ goldCoin, bronzeCoin, player, fireball ]);

// level.playerTouched('coin', goldCoin);
// level.playerTouched('coin', bronzeCoin);

// if (level.noMoreActors('coin')) {
//   console.log('Все монеты собраны');
//   console.log(`Статус игры: ${level.status}`);
// }

// const obstacle = level.obstacleAt(new Vector(1, 1), player.size);
// if (obstacle) {
//   console.log(`На пути препятствие: ${obstacle}`);
// }

// const otherActor = level.actorAt(player);
// if (otherActor === fireball) {
//   console.log('Пользователь столкнулся с шаровой молнией');
// }
