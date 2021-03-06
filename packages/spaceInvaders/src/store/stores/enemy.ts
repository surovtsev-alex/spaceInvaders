import { createStore, sample } from 'effector'
import * as THREE from 'three'

import uniqueIdGenerator from '../../helper/uniqueIdGenerator'
import { Enemy, EnemyPosition, GameStatus } from '../../types'
import {
  addEnemy,
  addEnemyGroup,
  addEnemyPosition,
  changeGameStatus,
  clearEnemyGroup,
  killEnemy,
} from '../events'

export const $enemy = createStore<Enemy>({})
  .on(addEnemy, (prevVal, val) => ({
    ...prevVal,
    ...val,
  }))
  .on(killEnemy, (prevVal, val) => {
    prevVal[val].isKill = true
    console.log('killEnemy', val, prevVal)
    return { ...prevVal }
  })
  .reset([clearEnemyGroup])

const targetCreateEnemy = sample({
  clock: addEnemyGroup,
  fn: (enemyRows) => {
    const enemies: { enemy: Enemy; enemyPosition: EnemyPosition }[] = []

    for (let row = 0; row < enemyRows.length; row++) {
      for (let i = 0; i < 11; i++) {
        const enemyId = uniqueIdGenerator('enemies')
        enemies.push({
          enemy: {
            [enemyId]: { ...enemyRows[row] },
          },
          enemyPosition: {
            [enemyId]: {
              position: new THREE.Vector3(6 > i ? -1 * i : i - 5, row, 0),
            },
          },
        })
      }
    }

    return enemies
  },
})

targetCreateEnemy.watch((enemies) => {
  enemies.map(({ enemy, enemyPosition }) => {
    addEnemy(enemy)
    addEnemyPosition(enemyPosition)
  })
})

sample({
  clock: killEnemy,
  source: [$enemy],
  fn: ([enemy]) => {
    const liveEnemy = Object.values(enemy).reduce((acc, val) => (val.isKill ? acc : acc + 1), 0)
    if (liveEnemy === 0) {
      return GameStatus.Win
    }
    return GameStatus.Play
  },
  target: changeGameStatus,
})
