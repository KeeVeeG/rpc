// @ts-nocheck
import { rpcMaster, rpcWorker } from '../'

const master = new rpcMaster()
const worker1 = new rpcWorker()
const worker2 = new rpcWorker(44442)

describe('main', () => {
  test('connect worker', async () => {
    const id = await master.addWorker()
    expect(worker1.sockets[id]).toBeDefined()
  })

  test('add module', async () => {
    const module = 'uuid'
    await master.addModule(module)
    expect(worker1.modules.has(module)).toBeTruthy()
  }, 10000)

  test('exec', async () => {
    const sum = (a, b) => a + b
    const result = await master.exec(sum, 1, 2)
    expect(result).toEqual(3)
  })

  test('connect one more worker', async () => {
    const id = await master.addWorker(undefined, 44442)
    expect(worker2.sockets[id]).toBeDefined()
  })

  test('add one more module', async () => {
    const module = 'axios'
    await master.addModule(module)
    expect(worker1.modules.has(module) && worker2.modules.has(module)).toBeTruthy()
  }, 10000)

  test('exec with module', async () => {
    const func = async () => {
      const { v4 } = await import('uuid')
      return v4()
    }
    const result = await master.exec(func)
    expect(result.length).toEqual(36)
  })

  test('exec async with module', async () => {
    const func = async (url: string) => {
      const { default: axios } = await import('axios')
      const { status } = await axios.get(url)
      return status
    }
    const result = await master.exec(func, 'https://github.com/KeeVeeG')
    expect(result).toEqual(200)
  })
})
