import test from 'node:test'
import assert from 'node:assert/strict'
import { LEVELS } from '../js/levels.js'
import {
  initialState,
  simulate,
  validate,
  levelPorts,
  duplicateWire,
  COMPONENT_SPECS,
} from '../js/engine.js'

test('catalogue contains 30 progressive levels', () => {
  assert.equal(LEVELS.length, 30)
  assert.deepEqual(
    LEVELS.map((level) => level.id),
    Array.from({ length: 30 }, (_, index) => index + 1),
  )
  for (let index = 1; index < LEVELS.length; index += 1) {
    assert.ok(
      LEVELS[index].difficulty >= LEVELS[index - 1].difficulty,
      `difficulty must not regress at level ${LEVELS[index].id}`,
    )
  }
})

test('every level starts unsolved', () => {
  for (const level of LEVELS) {
    const state = initialState(level)
    const result = validate(level, state)
    assert.equal(result.solved, false, `level ${level.id} should not start solved`)
    assert.equal(result.sim.leds.some((led) => led.on), false)
  }
})

test('every authored solution is a valid circuit', () => {
  for (const level of LEVELS) {
    const state = {
      wires: level.solutionWires.map((wire) => ({ ...wire })),
      switches: { ...level.solutionSwitches },
    }
    const result = validate(level, state)
    assert.equal(
      result.solved,
      true,
      `level ${level.id} (${level.title}) failed: ${result.reasons.join(', ')}; wrong leds=${
        JSON.stringify(result.wrongLeds)
      }; ineffective=${JSON.stringify(result.ineffectiveControls)}; missing=${
        JSON.stringify(result.missingInputs)
      }; outputs=${JSON.stringify(result.missingOutputs)}; conflicts=${JSON.stringify(
        result.sim.conflicts,
      )}`,
    )
    assert.equal(result.sim.short, false)
    assert.equal(result.sim.unstable, false)
    const expectedLit = level.components.filter(
      (component) =>
        component.type === 'led' && (level.ledGoals?.[component.id] || 'on') === 'on',
    ).length
    assert.equal(result.litCount, expectedLit)
  }
})

test('all port references in solutions exist', () => {
  for (const level of LEVELS) {
    const ports = new Set(levelPorts(level).map((port) => port.ref))
    for (const wire of level.solutionWires) {
      assert.ok(ports.has(wire.a), `level ${level.id}: unknown ${wire.a}`)
      assert.ok(ports.has(wire.b), `level ${level.id}: unknown ${wire.b}`)
      assert.notEqual(
        wire.a.split(':')[0],
        wire.b.split(':')[0],
        `level ${level.id}: same-component wire ${wire.a} -> ${wire.b}`,
      )
    }
  }
})

test('required controls are genuinely removed from the implementations', () => {
  for (const level of LEVELS) {
    const ports = new Set(levelPorts(level).map((port) => port.ref))
    for (const control of level.requiredControls) {
      assert.ok(
        level.components.some((component) => component.id === control),
        `level ${level.id}: unknown control ${control}`,
      )
    }
    for (const component of level.components) {
      if (component.type === 'led' || component.type === 'battery') continue
      assert.ok(
        level.requiredControls.includes(component.id) ||
          component.type === 'switch' ||
          component.type === 'not' ||
          component.type === 'and' ||
          component.type === 'or' ||
          component.type === 'xor',
        `level ${level.id}: no requirements declared for ${component.id}`,
      )
    }
    assert.ok(ports.size > 0)
  }
})

test('a direct short is rejected', () => {
  const level = LEVELS[0]
  const state = {
    wires: [
      { a: 'bat:pos', b: 'bat:neg' },
      { a: 'bat:pos', b: 'l1:a' },
      { a: 'l1:k', b: 'bat:neg' },
    ],
    switches: {},
  }
  const sim = simulate(level, state)
  assert.equal(sim.short, true)
  assert.equal(validate(level, state).solved, false)
})

test('an open switch breaks a switched circuit', () => {
  const level = LEVELS[1]
  const state = {
    wires: level.solutionWires.map((wire) => ({ ...wire })),
    switches: { sw1: false },
  }
  const result = validate(level, state)
  assert.equal(result.solved, false)
  assert.equal(result.sim.ledById.get('l1').on, false)
})

test('logic gates evaluate AND, OR, XOR and NOT correctly', () => {
  for (const type of ['and', 'or', 'xor', 'not']) {
    const level = {
      components: [
        { id: 'bat', type: 'battery', x: 100, y: 100 },
        { id: 'a', type: 'switch', x: 250, y: 50, initial: false },
        { id: 'b', type: 'switch', x: 250, y: 150, initial: false },
        { id: 'g', type, x: 450, y: 100 },
        { id: 'l', type: 'led', x: 650, y: 100 },
      ],
      solutionWires: [],
      requiredControls: [],
    }
    const base = [
      { a: 'bat:pos', b: 'a:a' },
      { a: 'a:b', b: 'g:a' },
      { a: 'g:out', b: 'l:a' },
      { a: 'l:k', b: 'bat:neg' },
    ]
    if (type !== 'not') base.push({ a: 'bat:pos', b: 'b:a' }, { a: 'b:b', b: 'g:b' })
    const evaluate = (left, right) => {
      if (type === 'and') return left && right
      if (type === 'or') return left || right
      if (type === 'xor') return left !== right
      return !left
    }
    for (const [left, right] of [
      [false, false],
      [true, false],
      [false, true],
      [true, true],
    ]) {
      if (type === 'not') continue
      const sim = simulate(level, {
        wires: base,
        switches: { a: left, b: right },
      })
      assert.equal(
        sim.gateById.get('g').out,
        evaluate(left, right),
        `${type} ${left}/${right}`,
      )
    }
  }
  // NOT: low input produces high output.
  const level = {
    components: [
      { id: 'bat', type: 'battery', x: 100, y: 100 },
      { id: 'g', type: 'not', x: 350, y: 100 },
      { id: 'l', type: 'led', x: 550, y: 100 },
    ],
    solutionWires: [],
    requiredControls: [],
  }
  const sim = simulate(level, {
    wires: [
      { a: 'g:out', b: 'l:a' },
      { a: 'l:k', b: 'bat:neg' },
    ],
    switches: {},
  })
  assert.equal(sim.gateById.get('g').out, true)
  assert.equal(sim.ledById.get('l').on, true)
})

test('duplicate wire detection is direction-independent', () => {
  const wires = [{ a: 'bat:pos', b: 'l1:a' }]
  assert.equal(duplicateWire(wires, 'bat:pos', 'l1:a'), true)
  assert.equal(duplicateWire(wires, 'l1:a', 'bat:pos'), true)
  assert.equal(duplicateWire(wires, 'bat:pos', 'l1:k'), false)
})

test('component specs expose valid, separated ports', () => {
  for (const [type, spec] of Object.entries(COMPONENT_SPECS)) {
    assert.ok(spec.width > 0 && spec.height > 0, type)
    assert.ok(spec.ports.length >= 2, type)
    const refs = new Set()
    for (const port of spec.ports) {
      assert.ok(!refs.has(port.id), `${type} duplicate port ${port.id}`)
      refs.add(port.id)
      assert.equal(port.dir.length, 2)
    }
  }
})
