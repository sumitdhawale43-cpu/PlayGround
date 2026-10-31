/**
 * CIRCUIT MASTER — circuit simulation engine.
 *
 * The simulation is intentionally small but physically motivated:
 * - wires and closed switches join conductive nets;
 * - the battery produces a high rail and a ground rail;
 * - logic gates read their input nets and drive their output nets;
 * - LEDs conduct only from anode to cathode, and only into ground;
 * - shorts and conflicting gate drivers invalidate a solution.
 */

export const GATE_TYPES = new Set(['and', 'or', 'not', 'xor'])

export const COMPONENT_SPECS = {
  battery: {
    width: 112,
    height: 76,
    ports: [
      { id: 'neg', dx: -65, dy: 0, dir: [-1, 0], label: '−' },
      { id: 'pos', dx: 65, dy: 0, dir: [1, 0], label: '+' },
    ],
  },
  switch: {
    width: 108,
    height: 58,
    ports: [
      { id: 'a', dx: -64, dy: 0, dir: [-1, 0], label: 'IN' },
      { id: 'b', dx: 64, dy: 0, dir: [1, 0], label: 'OUT' },
    ],
  },
  led: {
    width: 92,
    height: 82,
    ports: [
      { id: 'a', dx: -59, dy: 0, dir: [-1, 0], label: 'A' },
      { id: 'k', dx: 59, dy: 0, dir: [1, 0], label: 'K' },
    ],
  },
  and: {
    width: 150,
    height: 112,
    ports: [
      { id: 'a', dx: -85, dy: -27, dir: [-1, 0], label: 'A' },
      { id: 'b', dx: -85, dy: 27, dir: [-1, 0], label: 'B' },
      { id: 'out', dx: 85, dy: 0, dir: [1, 0], label: 'Y' },
    ],
  },
  or: {
    width: 150,
    height: 112,
    ports: [
      { id: 'a', dx: -85, dy: -27, dir: [-1, 0], label: 'A' },
      { id: 'b', dx: -85, dy: 27, dir: [-1, 0], label: 'B' },
      { id: 'out', dx: 85, dy: 0, dir: [1, 0], label: 'Y' },
    ],
  },
  xor: {
    width: 154,
    height: 112,
    ports: [
      { id: 'a', dx: -88, dy: -27, dir: [-1, 0], label: 'A' },
      { id: 'b', dx: -88, dy: 27, dir: [-1, 0], label: 'B' },
      { id: 'out', dx: 88, dy: 0, dir: [1, 0], label: 'Y' },
    ],
  },
  not: {
    width: 142,
    height: 98,
    ports: [
      { id: 'a', dx: -81, dy: 0, dir: [-1, 0], label: 'A' },
      { id: 'out', dx: 81, dy: 0, dir: [1, 0], label: 'Y' },
    ],
  },
}

const ENDPOINT_RE = /^([A-Za-z0-9_-]+):([A-Za-z0-9_-]+)$/

export function endpointKey(ref) {
  if (typeof ref !== 'string') throw new Error(`Invalid port reference: ${ref}`)
  const match = ref.match(ENDPOINT_RE)
  if (!match) throw new Error(`Invalid port reference: ${ref}`)
  return { componentId: match[1], portId: match[2] }
}

export function makeRef(componentId, portId) {
  return `${componentId}:${portId}`
}

export function getComponent(level, componentId) {
  return level.components.find((component) => component.id === componentId)
}

export function displayScale(level) {
  if (level.displayScale) return level.displayScale
  const count = level.components.length
  if (count <= 3) return 1.38
  if (count <= 5) return 1.16
  return 1
}

export function portPosition(level, ref) {
  const { componentId, portId } = endpointKey(ref)
  const component = getComponent(level, componentId)
  if (!component) return null
  const spec = COMPONENT_SPECS[component.type]
  const port = spec?.ports.find((entry) => entry.id === portId)
  if (!port) return null
  const scale = displayScale(level)
  return {
    x: component.x + port.dx * scale,
    y: component.y + port.dy * scale,
    dx: port.dir[0],
    dy: port.dir[1],
    port,
    component,
    scale,
  }
}

export function levelPorts(level) {
  const ports = []
  const scale = displayScale(level)
  for (const component of level.components) {
    const spec = COMPONENT_SPECS[component.type]
    if (!spec) continue
    for (const port of spec.ports) {
      ports.push({
        ref: makeRef(component.id, port.id),
        component,
        port,
        x: component.x + port.dx * scale,
        y: component.y + port.dy * scale,
        dir: port.dir,
        scale,
      })
    }
  }
  return ports
}

export function switchInitialState(level) {
  const result = {}
  for (const component of level.components) {
    if (component.type !== 'switch') continue
    result[component.id] = Boolean(component.initial)
  }
  return result
}

export function initialState(level) {
  return {
    wires: [],
    switches: switchInitialState(level),
  }
}

export function duplicateWire(wires, a, b) {
  return wires.some(
    (wire) =>
      (wire.a === a && wire.b === b) || (wire.a === b && wire.b === a),
  )
}

class UnionFind {
  constructor(size) {
    this.parent = Array.from({ length: size }, (_, index) => index)
    this.rank = new Array(size).fill(0)
  }

  find(value) {
    let root = value
    while (this.parent[root] !== root) root = this.parent[root]
    while (this.parent[value] !== value) {
      const next = this.parent[value]
      this.parent[value] = root
      value = next
    }
    return root
  }

  union(left, right) {
    let a = this.find(left)
    let b = this.find(right)
    if (a === b) return false
    if (this.rank[a] < this.rank[b]) [a, b] = [b, a]
    this.parent[b] = a
    if (this.rank[a] === this.rank[b]) this.rank[a] += 1
    return true
  }
}

function netStateForGate(inputNet, baseHigh, drivenHigh) {
  if (inputNet === undefined) return false
  return baseHigh.has(inputNet) || drivenHigh.has(inputNet)
}

function evaluateGate(type, a, b) {
  switch (type) {
    case 'and':
      return a && b
    case 'or':
      return a || b
    case 'xor':
      return Boolean(a) !== Boolean(b)
    case 'not':
      return !a
    default:
      return false
  }
}

/**
 * Simulate the circuit in a given player state.
 *
 * state = { wires: [{a, b}], switches: {switchId: boolean} }
 * options.disabled = array of component ids treated as removed (used to prove
 * that a switch or gate actually controls a load).
 */
export function simulate(level, state, options = {}) {
  const disabled = new Set(options.disabled || [])
  const wires = state.wires || []
  const switchState = state.switches || {}
  const ports = levelPorts(level)
  const indexByRef = new Map(ports.map((port, index) => [port.ref, index]))
  const uf = new UnionFind(ports.length)

  const invalidWires = []
  for (const wire of wires) {
    const left = indexByRef.get(wire.a)
    const right = indexByRef.get(wire.b)
    if (left === undefined || right === undefined) {
      invalidWires.push(wire)
      continue
    }
    uf.union(left, right)
  }

  const conductiveLinks = []
  for (const component of level.components) {
    if (component.type !== 'switch' || disabled.has(component.id)) continue
    if (!switchState[component.id]) continue
    const left = indexByRef.get(makeRef(component.id, 'a'))
    const right = indexByRef.get(makeRef(component.id, 'b'))
    if (left !== undefined && right !== undefined) {
      uf.union(left, right)
      conductiveLinks.push({ type: 'switch', id: component.id, a: left, b: right })
    }
  }

  const netByIndex = new Map()
  for (let index = 0; index < ports.length; index += 1) {
    const root = uf.find(index)
    if (!netByIndex.has(root)) netByIndex.set(root, [])
    netByIndex.get(root).push(index)
  }
  const netOfPort = new Map()
  for (const [net, indices] of netByIndex) {
    for (const index of indices) netOfPort.set(index, net)
  }

  const baseHigh = new Set()
  const baseLow = new Set()
  const portPolarity = new Map()
  for (const port of ports) {
    if (port.component.type !== 'battery' || disabled.has(port.component.id)) continue
    const net = netOfPort.get(indexByRef.get(port.ref))
    if (port.port.id === 'pos') {
      baseHigh.add(net)
      portPolarity.set(port.ref, 'high')
    } else {
      baseLow.add(net)
      portPolarity.set(port.ref, 'low')
    }
  }

  const gates = level.components.filter(
    (component) => GATE_TYPES.has(component.type) && !disabled.has(component.id),
  )

  let drivenHigh = new Set()
  let drivenLow = new Set()
  let unstable = false
  let stable = false
  for (let iteration = 0; iteration < 20; iteration += 1) {
    const nextHigh = new Set()
    const nextLow = new Set()
    const states = []
    for (const gate of gates) {
      const inputPorts = COMPONENT_SPECS[gate.type].ports.filter(
        (port) => port.id === 'a' || port.id === 'b',
      )
      const values = inputPorts.map((port) => {
        const index = indexByRef.get(makeRef(gate.id, port.id))
        const net = netOfPort.get(index)
        return netStateForGate(net, baseHigh, drivenHigh)
      })
      const a = values[0] || false
      const b = values[1] || false
      const output = evaluateGate(gate.type, a, b)
      const outputIndex = indexByRef.get(makeRef(gate.id, 'out'))
      const outputNet = netOfPort.get(outputIndex)
      if (outputNet !== undefined) {
        if (output) nextHigh.add(outputNet)
        else nextLow.add(outputNet)
      }
      states.push({ id: gate.id, type: gate.type, a, b, output })
    }

    const same =
      nextHigh.size === drivenHigh.size &&
      nextLow.size === drivenLow.size &&
      [...nextHigh].every((net) => drivenHigh.has(net)) &&
      [...nextLow].every((net) => drivenLow.has(net))
    drivenHigh = nextHigh
    drivenLow = nextLow
    if (same) {
      stable = true
      break
    }
  }
  if (!stable && gates.length) unstable = true

  const conflicts = []
  let short = false
  const allNets = new Set([
    ...baseHigh,
    ...baseLow,
    ...drivenHigh,
    ...drivenLow,
  ])
  for (const net of allNets) {
    const high = baseHigh.has(net) || drivenHigh.has(net)
    const low = baseLow.has(net) || drivenLow.has(net)
    if (!high || !low) continue
    const sourceHigh = baseHigh.has(net) ? 'battery' : 'gate'
    const sourceLow = baseLow.has(net) ? 'ground' : 'gate'
    conflicts.push({ net, high: sourceHigh, low: sourceLow })
    if (baseHigh.has(net) && baseLow.has(net)) short = true
  }

  for (const port of ports) {
    if (port.component.type !== 'battery') continue
    const net = netOfPort.get(indexByRef.get(port.ref))
    portPolarity.set(port.ref, port.port.id === 'pos' ? 'high' : 'low')
    if (net !== undefined) {
      if (drivenLow.has(net) && port.port.id === 'pos') {
        // gate output fighting the positive rail
      }
      if (drivenHigh.has(net) && port.port.id === 'neg') {
        // gate output fighting ground
      }
    }
  }

  const inputPortsByGate = new Map()
  for (const gate of level.components) {
    if (!GATE_TYPES.has(gate.type)) continue
    const needed = COMPONENT_SPECS[gate.type].ports
      .filter((port) => port.id === 'a' || port.id === 'b')
      .map((port) => makeRef(gate.id, port.id))
    inputPortsByGate.set(
      gate.id,
      needed.map((ref) => ({
        ref,
        connected: wires.some((wire) => wire.a === ref || wire.b === ref),
      })),
    )
  }

  const leds = []
  for (const component of level.components) {
    if (component.type !== 'led') continue
    const anodeIndex = indexByRef.get(makeRef(component.id, 'a'))
    const cathodeIndex = indexByRef.get(makeRef(component.id, 'k'))
    const anodeNet = netOfPort.get(anodeIndex)
    const cathodeNet = netOfPort.get(cathodeIndex)
    const anodeHigh =
      anodeNet !== undefined &&
      (baseHigh.has(anodeNet) || drivenHigh.has(anodeNet))
    const cathodeLow =
      cathodeNet !== undefined &&
      (baseLow.has(cathodeNet) || drivenLow.has(cathodeNet))
    const reverse =
      anodeNet !== undefined &&
      cathodeNet !== undefined &&
      (baseLow.has(anodeNet) || drivenLow.has(anodeNet)) &&
      (baseHigh.has(cathodeNet) || drivenHigh.has(cathodeNet))
    leds.push({
      id: component.id,
      on: anodeHigh && cathodeLow && anodeNet !== cathodeNet,
      anodeHigh,
      cathodeLow,
      reverse,
    })
  }

  const netPower = new Map()
  for (const port of ports) {
    const index = indexByRef.get(port.ref)
    const net = netOfPort.get(index)
    if (net === undefined) {
      netPower.set(port.ref, 'floating')
      continue
    }
    const high = baseHigh.has(net) || drivenHigh.has(net)
    const low = baseLow.has(net) || drivenLow.has(net)
    netPower.set(port.ref, high && low ? 'conflict' : high ? 'high' : low ? 'low' : 'floating')
  }

  const activeWires = wires.map((wire) => {
    const left = netPower.get(wire.a)
    const right = netPower.get(wire.b)
    return left !== 'floating' && left !== undefined && right !== 'floating' && right !== undefined
  })

  const gateStates = gates.map((gate) => {
    const inputPorts = COMPONENT_SPECS[gate.type].ports.filter(
      (port) => port.id === 'a' || port.id === 'b',
    )
    const values = inputPorts.map((port) => {
      const index = indexByRef.get(makeRef(gate.id, port.id))
      const net = netOfPort.get(index)
      return netStateForGate(net, baseHigh, drivenHigh)
    })
    return {
      id: gate.id,
      type: gate.type,
      a: values[0] || false,
      b: values[1] || false,
      out: evaluateGate(gate.type, values[0] || false, values[1] || false),
    }
  })

  return {
    short,
    conflicts,
    unstable,
    invalidWires,
    leds,
    ledById: new Map(leds.map((led) => [led.id, led])),
    gateStates,
    gateById: new Map(gateStates.map((gate) => [gate.id, gate])),
    inputPortsByGate,
    netPower,
    activeWires,
    conductiveLinks,
    battery: {
      positive: baseHigh,
      ground: baseLow,
    },
  }
}

/**
 * Validate the current circuit against the level's goals.
 * This is stricter than "all LEDs are on": every required control must
 * demonstrably affect the circuit, and all logic inputs must be wired.
 */
export function validate(level, state) {
  const sim = simulate(level, state)
  const reasons = []
  let solved = true

  if (sim.short) {
    solved = false
    reasons.push('short')
  }
  if (sim.conflicts.length) {
    solved = false
    reasons.push('conflict')
  }
  if (sim.unstable) {
    solved = false
    reasons.push('unstable')
  }

  const missingInputs = []
  for (const [gateId, ports] of sim.inputPortsByGate) {
    for (const port of ports) {
      if (!port.connected) missingInputs.push({ gateId, ref: port.ref })
    }
  }
  if (missingInputs.length) {
    solved = false
    reasons.push('inputs')
  }

  const missingOutputs = []
  for (const component of level.components) {
    if (!GATE_TYPES.has(component.type)) continue
    const ref = makeRef(component.id, 'out')
    const connected = (state.wires || []).some(
      (wire) => wire.a === ref || wire.b === ref,
    )
    if (!connected) missingOutputs.push({ gateId: component.id, ref })
  }
  if (missingOutputs.length) {
    solved = false
    reasons.push('outputs')
  }

  const goals = level.ledGoals || {}
  const wrongLeds = []
  for (const led of sim.leds) {
    const expected = goals[led.id] || 'on'
    const wantsOn = expected === 'on'
    if (led.on !== wantsOn) {
      wrongLeds.push({ id: led.id, expected, actual: led.on ? 'on' : 'off' })
    }
  }
  if (wrongLeds.length) {
    solved = false
    reasons.push('leds')
  }

  const ineffectiveControls = []
  for (const controlId of level.requiredControls || []) {
    const removed = simulate(level, state, { disabled: [controlId] })
    let changed = false
    for (const led of sim.leds) {
      const expected = (goals[led.id] || 'on') === 'on'
      const without = removed.ledById.get(led.id)?.on || false
      if (led.on !== without) changed = true
      // If the control is responsible for an LED being dark, removing it must
      // also reveal that responsibility by turning that LED on.
      if (!expected && !led.on && without) changed = true
    }
    if (!changed) ineffectiveControls.push(controlId)
  }
  if (ineffectiveControls.length) {
    solved = false
    reasons.push('controls')
  }

  return {
    solved,
    reasons,
    sim,
    wrongLeds,
    missingInputs,
    missingOutputs,
    ineffectiveControls,
    litCount: sim.leds.filter((led) => led.on).length,
    ledCount: sim.leds.length,
    controlCount: (level.requiredControls || []).length,
  }
}

export function formatObjective(level) {
  const goals = level.ledGoals || {}
  const on = level.components.filter(
    (component) => component.type === 'led' && (goals[component.id] || 'on') === 'on',
  ).length
  const off = level.components.filter(
    (component) => component.type === 'led' && goals[component.id] === 'off',
  ).length
  if (off && on) return `Light ${on} lamps and keep ${off} dark`
  if (off) return `Keep ${off} lamps dark`
  return on === 1 ? 'Light the lamp' : `Light all ${on} lamps`
}

export function componentLabel(component) {
  switch (component.type) {
    case 'battery':
      return 'Cell'
    case 'switch':
      return 'Switch'
    case 'led':
      return 'Lamp'
    case 'and':
      return 'AND gate'
    case 'or':
      return 'OR gate'
    case 'xor':
      return 'XOR gate'
    case 'not':
      return 'NOT gate'
    default:
      return component.type
  }
}
