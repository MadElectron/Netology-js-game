'use strict';

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  plus(vector) {
    try {
      if (vector instanceof Vector) {
        return new Vector(this.x + vector.x, this.y + vector.y);
      } else {
        throw new Error('Можно прибавлять к вектору только вектор типа Vector');
      }
    } catch(e) {
      console.error(e.message);
    }
  }

  times(multiplier) {
    return new Vector(this.x * multiplier, this.y * multiplier);
  }
}

class Actor {
  constructor(pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {
    try {
      if ((pos instanceof Vector) && (size instanceof Vector) && (speed instanceof Vector)) {
        // writable properties
        this.pos = pos;
        this.size = size;
        this.speed = speed;

        // readonly properties
        Object.defineProperty(this, 'left', {
          get: () => this.pos.x,
        });
        Object.defineProperty(this, 'top', {
          get: () => this.pos.y,
        });
        Object.defineProperty(this, 'right', {
          get: () => this.pos.x + this.size.x,
        });
        Object.defineProperty(this, 'bottom', {
          get: () => this.pos.y + this.size.y,
        });              

      } else {
        throw new Error('Все аргументы конструктора должны быть типа Vector');
      }
    } catch(e) {
      console.error(e.message);
    }
  }

  act() {
    //
  }

  isIntersect(actor) {
    try {
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
            && (this.bottom <= actor.bottom) && (this.bottom > actor.top));

      } else {
        throw 'Аргумент метода isIntersect должен быть типа Actor';
      }
    } catch(e) {
      console.error(e.message);
    }
  }

}

class Level {
  constructor(grid = [[]], actors = []) {

    // Passed properties
    this.grid = grid;
    this.actors = actors;

    // Calculated properties
    this.player = this.actors.find(actor => actor.type === 'player');
    this.height = this.grid.length;
    this.width = Math.max(...this.grid.map(row => row.length));
    this.status = null;
    this.finishDelay = 1;
  }

  isFinished() {
    return (this.status !== null) && (this.finishDelay < 0);
  }

  actorAt(actor) {
    try {
      if((typeof actor !=='undefined') && (actor instanceof Actor)) {
        return this.actors.find(a => (a.isIntersect(actor)));
      } else {
        throw new Error('Аргумент метода actorAt должен быть типа Actor');
      }

    } catch(e) {
      console.error(e.message);
    }
  }  

  obstacleAt(pos, size) {
    try {
      if((pos instanceof Vector) && (size instanceof Vector)) {
        // Is there any other obstacles?
        
        if ((pos.x < 0) || (pos.x + size.x >= this.width) ||(pos.y + size.y >= this.height))
          return 'wall';

        if (pos.y < 0)
          return 'lava';

      } else {
        throw new Error('Аргументы метода obstacleAt должны быть типа Vector');
      }

    } catch(e) {
      console.error(e.message);
    }
  }

  removeActor(actor) {
    let actorIndex = this.actors.indexOf(actor);

    if(actorIndex !== -1)
      this.actors.splice(actorIndex, 1);
  }

  noMoreActors(type) {
    return this.actors.filter(a => (a.type === type)) == false;
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



/* ==== Testing Vector class ==== */
const start = new Vector(30, 50);
const moveTo = new Vector(5, 10);

const finish = start.plus(moveTo.times(2));

console.log(`Исходное расположение: ${start.x}:${start.y}`);
console.log(`Текущее расположение: ${finish.x}:${finish.y}`);


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
console.log('========');

const grid = [
  [undefined, undefined],
  ['wall', 'wall']
];

// function MyCoin(title) {
//   this.type = 'coin';
//   this.title = title;
// }
// MyCoin.prototype = Object.create(Actor);
// MyCoin.constructor = MyCoin;

class MyCoin extends Actor {
  constructor(title) {
    super();

    this.type = 'coin';
    this.title = title;
  }
}

const goldCoin = new MyCoin('Золото');
const bronzeCoin = new MyCoin('Бронза');
const player = new Actor();
const fireball = new Actor();

// console.log(goldCoin);

const level = new Level(grid, [ goldCoin, bronzeCoin, player, fireball ]);

level.playerTouched('coin', goldCoin);
level.playerTouched('coin', bronzeCoin);

if (level.noMoreActors('coin')) {
  console.log('Все монеты собраны');
  console.log(`Статус игры: ${level.status}`);
}

const obstacle = level.obstacleAt(new Vector(1, 1), player.size);
if (obstacle) {
  console.log(`На пути препятствие: ${obstacle}`);
}

const otherActor = level.actorAt(player);
if (otherActor === fireball) {
  console.log('Пользователь столкнулся с шаровой молнией');
}